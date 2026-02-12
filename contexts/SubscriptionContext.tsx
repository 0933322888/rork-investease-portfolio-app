import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { trpc } from '@/lib/trpc';

let useAuthHook: any = null;
try {
  const clerk = require("@clerk/clerk-expo");
  useAuthHook = clerk.useAuth;
} catch {}

let Purchases: any = null;
let LOG_LEVEL: any = null;
try {
  const rc = require("react-native-purchases");
  Purchases = rc.default;
  LOG_LEVEL = rc.LOG_LEVEL;
} catch {}

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
const ENTITLEMENT_ID = 'premium';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  refetch: () => void;
  offerings: any | null;
}

const SubscriptionCtx = createContext<SubscriptionState>({
  isPremium: false,
  isLoading: true,
  isPurchasing: false,
  isRestoring: false,
  purchase: async () => false,
  restore: async () => false,
  refetch: () => {},
  offerings: null,
});

export function useSubscription() {
  return useContext(SubscriptionCtx);
}

export function SubscriptionContext({ children }: { children: React.ReactNode }) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [rcPremium, setRcPremium] = useState(false);
  const [rcLoading, setRcLoading] = useState(true);
  const [offerings, setOfferings] = useState<any>(null);

  const auth = useAuthHook?.();
  const isSignedIn = auth?.isSignedIn ?? false;
  const userId = auth?.userId;

  const isNative = Platform.OS !== 'web';
  const rcAvailable = isNative && Purchases && REVENUECAT_API_KEY;

  const statusQuery = trpc.auth.getSubscriptionStatus.useQuery(undefined, {
    enabled: isSignedIn && !rcAvailable,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updateMutation = trpc.auth.updateSubscription.useMutation({
    onSuccess: () => {
      statusQuery.refetch();
    },
  });

  useEffect(() => {
    if (!rcAvailable) {
      setRcLoading(false);
      return;
    }

    async function initRevenueCat() {
      try {
        if (LOG_LEVEL) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: userId || undefined,
        });

        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setRcPremium(hasPremium);

        const offeringsResult = await Purchases.getOfferings();
        if (offeringsResult.current) {
          setOfferings(offeringsResult.current);
        }
      } catch (err) {
        console.error("[RevenueCat] Init error:", err);
      } finally {
        setRcLoading(false);
      }
    }

    initRevenueCat();
  }, [rcAvailable, userId]);

  const checkRcEntitlements = useCallback(async () => {
    if (!rcAvailable) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcPremium(hasPremium);
      if (hasPremium) {
        updateMutation.mutateAsync({ status: "premium" }).catch(() => {});
      }
    } catch (err) {
      console.error("[RevenueCat] Check entitlements error:", err);
    }
  }, [rcAvailable, updateMutation]);

  const isPremium = rcAvailable
    ? rcPremium
    : (statusQuery.data?.status === "premium");

  const isLoading = rcAvailable
    ? rcLoading
    : (isSignedIn ? statusQuery.isLoading : false);

  const purchase = useCallback(async () => {
    if (rcAvailable) {
      setIsPurchasing(true);
      try {
        if (!offerings || !offerings.availablePackages?.length) {
          console.error("[RevenueCat] No offerings available");
          return false;
        }

        const pkg = offerings.availablePackages[0];
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setRcPremium(hasPremium);

        if (hasPremium) {
          updateMutation.mutateAsync({ status: "premium" }).catch(() => {});
        }

        return hasPremium;
      } catch (err: any) {
        if (err.userCancelled) {
          return false;
        }
        console.error("[RevenueCat] Purchase error:", err);
        return false;
      } finally {
        setIsPurchasing(false);
      }
    }

    setIsPurchasing(true);
    try {
      await updateMutation.mutateAsync({ status: "premium" });
      return true;
    } catch (err) {
      console.error("[Subscription] Purchase failed:", err);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [rcAvailable, offerings, updateMutation]);

  const restore = useCallback(async () => {
    if (rcAvailable) {
      setIsRestoring(true);
      try {
        const customerInfo = await Purchases.restorePurchases();
        const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setRcPremium(hasPremium);

        if (hasPremium) {
          updateMutation.mutateAsync({ status: "premium" }).catch(() => {});
        }

        return hasPremium;
      } catch (err) {
        console.error("[RevenueCat] Restore error:", err);
        return false;
      } finally {
        setIsRestoring(false);
      }
    }

    const result = await statusQuery.refetch();
    return result.data?.status === "premium";
  }, [rcAvailable, statusQuery, updateMutation]);

  const refetch = useCallback(() => {
    if (rcAvailable) {
      checkRcEntitlements();
    } else {
      statusQuery.refetch();
    }
  }, [rcAvailable, checkRcEntitlements, statusQuery]);

  return (
    <SubscriptionCtx.Provider
      value={{
        isPremium,
        isLoading,
        isPurchasing,
        isRestoring,
        purchase,
        restore,
        refetch,
        offerings,
      }}
    >
      {children}
    </SubscriptionCtx.Provider>
  );
}
