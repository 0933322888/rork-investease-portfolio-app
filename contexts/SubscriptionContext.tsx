import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY!;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY!,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY!,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY!,
  });
}

Purchases.configure({
  apiKey: getRCToken(),
});

const ENTITLEMENT_ID = 'Assetra Pro';

export const [SubscriptionContext, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: async () => {
      console.log('[Subscription] Fetching customer info');
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 1000 * 60 * 5,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async () => {
      console.log('[Subscription] Fetching offerings');
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    staleTime: 1000 * 60 * 10,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      console.log('[Subscription] Purchasing package:', packageId);
      const offerings = offeringsQuery.data;
      if (!offerings?.current) {
        throw new Error('No offerings available');
      }

      const pkg = offerings.current.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) {
        throw new Error('Package not found');
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[Subscription] Purchase successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[Subscription] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[Subscription] Restore successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
  });

  useEffect(() => {
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[Subscription] Customer info updated');
      queryClient.setQueryData(['customerInfo'], info);
    });

    return () => {
      listener.remove();
    };
  }, [queryClient]);

  const isPremium = customerInfoQuery.data?.entitlements.active[ENTITLEMENT_ID] !== undefined;
  const isLoading = customerInfoQuery.isPending || offeringsQuery.isPending;

  return {
    isPremium,
    isLoading,
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    restore: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    refetch: () => {
      customerInfoQuery.refetch();
      offeringsQuery.refetch();
    },
  };
});
