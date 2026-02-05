// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { SubscriptionContext } from "@/contexts/SubscriptionContext";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-asset" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="risk-fingerprint" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="connect-plaid" options={{ presentation: "modal", title: "Connect Account" }} />
      <Stack.Screen name="premium" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <SubscriptionContext>
            <PortfolioProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </PortfolioProvider>
          </SubscriptionContext>
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
