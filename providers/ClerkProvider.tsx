import React from "react";
import { ClerkProvider as ClerkBaseProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Platform } from "react-native";

let tokenCache: any = undefined;

if (Platform.OS !== "web") {
  try {
    const SecureStore = require("expo-secure-store");
    tokenCache = {
      async getToken(key: string) {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (err) {
          return null;
        }
      },
      async saveToken(key: string, value: string) {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (err) {
          console.error("[Clerk] Failed to save token:", err);
        }
      },
    };
  } catch {
    tokenCache = undefined;
  }
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function ClerkProvider({ children }: { children: React.ReactNode }) {
  if (!publishableKey || Platform.OS === 'web') {
    return <>{children}</>;
  }

  return (
    <ClerkBaseProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkBaseProvider>
  );
}
