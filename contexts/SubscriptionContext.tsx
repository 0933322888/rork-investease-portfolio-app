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
if (Platform.OS !== 'web') {
  try {
    const rc = require("react-native-purchases");
    if (rc?.default?.configure) {
      Purchases = rc.default;
      LOG_LEVEL = rc.LOG_LEVEL;
    }
  } catch (e) {
    console.log("[RevenueCat] Native module not available, using DB fallback");
  }
}

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
  const [rcInitialized, setRcInitialized] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  let auth = null;
  try {
    auth = useAuthHook?.();
  } catch (error) {
    console.log("[SubscriptionContext] Clerk not available");
  }
  const isSignedIn = auth?.isSignedIn ?? false;
  const userId = auth?.userId;

  const rcAvailable = Platform.OS !== 'web' && Purchases !== null && !!REVENUECAT_API_KEY;

  const statusQuery = trpc.auth.getSubscriptionStatus.useQuery(undefined, {
    enabled: isSignedIn,
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
        setRcInitialized(true);

        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
        setRcPremium(hasPremium);

        try {
          const offeringsResult = await Purchases.getOfferings();
          if (offeringsResult?.current) {
            setOfferings(offeringsResult.current);
          }
        } catch (offerErr) {
          console.warn("[RevenueCat] Offerings fetch failed:", offerErr);
        }
      } catch (err) {
        console.error("[RevenueCat] Init error:", err);
        setRcInitialized(false);
      } finally {
        setRcLoading(false);
      }
    }

    initRevenueCat();
  }, [rcAvailable, userId]);

  const checkRcEntitlements = useCallback(async () => {
    if (!rcAvailable || !rcInitialized) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      setRcPremium(hasPremium);
      if (hasPremium) {
        updateMutation.mutateAsync({ status: "premium" }).catch(() => {});
      }
    } catch (err) {
      console.error("[RevenueCat] Check entitlements error:", err);
    }
  }, [rcAvailable, rcInitialized, updateMutation]);

  const useRc = rcAvailable && rcInitialized;

  const isPremium = useRc
    ? rcPremium
    : (statusQuery.data?.status === "premium");

  const isLoading = useRc
    ? rcLoading
    : (isSignedIn ? statusQuery.isLoading : false);

  const purchase = useCallback(async () => {
    if (useRc) {
      setIsPurchasing(true);
      try {
        if (!offerings || !offerings.availablePackages?.length) {
          console.error("[RevenueCat] No offerings available");
          return false;
        }

        const pkg = offerings.availablePackages[0];
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
        setRcPremium(hasPremium);

        if (hasPremium) {
          updateMutation.mutateAsync({ status: "premium" }).catch(() => {});
        }

        return hasPremium;
      } catch (err: any) {
        if (err?.userCancelled) {
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
  }, [useRc, offerings, updateMutation]);

  const restore = useCallback(async () => {
    if (useRc) {
      setIsRestoring(true);
      try {
        const customerInfo = await Purchases.restorePurchases();
        const hasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
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
  }, [useRc, statusQuery, updateMutation]);

  const refetch = useCallback(() => {
    if (useRc) {
      checkRcEntitlements();
    } else {
      statusQuery.refetch();
    }
  }, [useRc, checkRcEntitlements, statusQuery]);

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
