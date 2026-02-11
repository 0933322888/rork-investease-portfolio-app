import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { SubscriptionContext } from "@/contexts/SubscriptionContext";
import { trpc, trpcClient, setClerkTokenGetter } from "@/lib/trpc";
import ClerkProvider from "@/providers/ClerkProvider";
import { useAppLock } from "@/hooks/useAppLock";
import AppLockOverlay from "@/components/AppLockOverlay";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ClerkTokenBridge() {
  try {
    const { useAuth } = require("@clerk/clerk-expo");
    const { getToken } = useAuth();
    useEffect(() => {
      setClerkTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    }, [getToken]);
  } catch {}
  return null;
}

function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  let isSignedIn = false;
  let clerkLoaded = false;

  try {
    const { useAuth } = require("@clerk/clerk-expo");
    const auth = useAuth();
    isSignedIn = auth.isSignedIn ?? false;
    clerkLoaded = auth.isLoaded ?? false;
  } catch {
    clerkLoaded = true;
    isSignedIn = true;
  }

  useEffect(() => {
    if (!clerkLoaded) return;
    setIsReady(true);

    const inAuthGroup = (segments[0] as string) === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in" as any);
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/home" as any);
    }
  }, [isSignedIn, clerkLoaded, segments]);

  return { isReady, isSignedIn };
}

function RootLayoutNav() {
  const { isReady } = useAuthRedirect();
  const { isLocked, authenticate } = useAppLock();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <>
      <ClerkTokenBridge />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
        <Stack.Screen name="add-asset" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="risk-fingerprint" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="connect-plaid" options={{ presentation: "modal", title: "Connect Account" }} />
        <Stack.Screen name="connect-snaptrade" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="connect-coinbase" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="premium" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ presentation: "modal", headerShown: false }} />
      </Stack>
      {isLocked && <AppLockOverlay onUnlock={authenticate} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider>
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
    </ClerkProvider>
  );
}
