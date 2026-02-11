import { Redirect } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { usePortfolio } from '@/contexts/PortfolioContext';

function useClerkAuth() {
  try {
    const { useAuth } = require("@clerk/clerk-expo");
    const auth = useAuth();
    return {
      isSignedIn: auth.isSignedIn ?? false,
      isLoaded: auth.isLoaded ?? false,
      hasClerk: true,
    };
  } catch {
    return { isSignedIn: true, isLoaded: true, hasClerk: false };
  }
}

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = usePortfolio();
  const { isSignedIn, isLoaded, hasClerk } = useClerkAuth();

  if (isLoading || !isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (hasClerk && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
