import React, { createContext, useContext, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

let useAuthHook: any = null;
try {
  const clerk = require("@clerk/clerk-expo");
  useAuthHook = clerk.useAuth;
} catch {}

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  refetch: () => void;
}

const SubscriptionCtx = createContext<SubscriptionState>({
  isPremium: false,
  isLoading: true,
  isPurchasing: false,
  isRestoring: false,
  purchase: async () => false,
  restore: async () => false,
  refetch: () => {},
});

export function useSubscription() {
  return useContext(SubscriptionCtx);
}

export function SubscriptionContext({ children }: { children: React.ReactNode }) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const auth = useAuthHook?.();
  const isSignedIn = auth?.isSignedIn ?? false;

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

  const isPremium = statusQuery.data?.status === "premium";
  const isLoading = isSignedIn ? statusQuery.isLoading : false;

  const purchase = useCallback(async () => {
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
  }, [updateMutation]);

  const restore = useCallback(async () => {
    const result = await statusQuery.refetch();
    return result.data?.status === "premium";
  }, [statusQuery]);

  const refetch = useCallback(() => {
    statusQuery.refetch();
  }, [statusQuery]);

  return (
    <SubscriptionCtx.Provider
      value={{
        isPremium,
        isLoading,
        isPurchasing,
        isRestoring: false,
        purchase,
        restore,
        refetch,
      }}
    >
      {children}
    </SubscriptionCtx.Provider>
  );
}
