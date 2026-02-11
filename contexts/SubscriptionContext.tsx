import createContextHook from '@nkzw/create-context-hook';

export const [SubscriptionContext, useSubscription] = createContextHook(() => {
  const isPremium = true;
  const isLoading = false;

  return {
    isPremium,
    isLoading,
    customerInfo: null,
    offerings: null,
    purchase: async (_packageId: string) => {
      console.log('[Subscription] Purchase not available on web');
      return null;
    },
    isPurchasing: false,
    restore: async () => {
      console.log('[Subscription] Restore not available on web');
      return null;
    },
    isRestoring: false,
    refetch: () => {},
  };
});
