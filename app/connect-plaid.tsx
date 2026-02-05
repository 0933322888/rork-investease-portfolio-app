import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { trpc } from '@/lib/trpc';
import { usePortfolio } from '@/contexts/PortfolioContext';

declare global {
  interface Window {
    Plaid?: {
      create: (config: any) => { open: () => void; destroy: () => void };
    };
  }
}

export default function ConnectPlaidScreen() {
  const router = useRouter();
  const { syncPlaidAccount } = usePortfolio();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [plaidLoaded, setPlaidLoaded] = useState(false);
  const [plaidOpened, setPlaidOpened] = useState(false);
  const plaidHandlerRef = React.useRef<any>(null);

  const userIdRef = React.useRef('user_' + Date.now());
  const userId = userIdRef.current;

  const createLinkTokenMutation = trpc.plaid.createLinkToken.useMutation({
    onSuccess: (data) => {
      console.log('[ConnectPlaid] Link token created');
      setLinkToken(data.linkToken);
    },
    onError: (error) => {
      console.error('[ConnectPlaid] Error creating link token:', error);
      Alert.alert('Error', 'Failed to initialize Plaid Link. Please try again.');
    },
  });

  const exchangeTokenMutation = trpc.plaid.exchangePublicToken.useMutation({
    onSuccess: async (data) => {
      console.log('[ConnectPlaid] Token exchanged, syncing account');
      try {
        await syncPlaidAccount(data.accessToken, data.itemId);
        Alert.alert('Success', 'Account connected successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } catch (error) {
        console.error('[ConnectPlaid] Error syncing account:', error);
        Alert.alert('Error', 'Failed to sync account data. Please try again.');
      } finally {
        setIsExchanging(false);
      }
    },
    onError: (error) => {
      console.error('[ConnectPlaid] Error exchanging token:', error);
      Alert.alert('Error', 'Failed to connect account. Please try again.');
      setIsExchanging(false);
    },
  });

  useEffect(() => {
    createLinkTokenMutation.mutate({ userId });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      script.onload = () => {
        console.log('[ConnectPlaid] Plaid SDK loaded');
        setPlaidLoaded(true);
      };
      script.onerror = () => {
        console.error('[ConnectPlaid] Failed to load Plaid SDK');
        Alert.alert('Error', 'Failed to load Plaid. Please refresh and try again.');
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const openPlaidLink = useCallback(() => {
    if (Platform.OS === 'web' && linkToken && window.Plaid && !plaidOpened) {
      console.log('[ConnectPlaid] Opening Plaid Link');
      setPlaidOpened(true);
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (publicToken: string, metadata: any) => {
          console.log('[ConnectPlaid] Plaid success');
          setIsExchanging(true);
          exchangeTokenMutation.mutate({ publicToken });
        },
        onExit: (err: any, metadata: any) => {
          console.log('[ConnectPlaid] Plaid exit:', err);
          setPlaidOpened(false);
          router.back();
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('[ConnectPlaid] Plaid event:', eventName);
        },
      });
      plaidHandlerRef.current = handler;
      handler.open();
    }
  }, [linkToken, plaidOpened, exchangeTokenMutation, router]);

  useEffect(() => {
    if (Platform.OS === 'web' && plaidLoaded && linkToken && !plaidOpened) {
      openPlaidLink();
    }
  }, [plaidLoaded, linkToken, plaidOpened, openPlaidLink]);

  useEffect(() => {
    return () => {
      if (plaidHandlerRef.current) {
        plaidHandlerRef.current.destroy();
      }
    };
  }, []);

  if (createLinkTokenMutation.isPending || !linkToken || (Platform.OS === 'web' && !plaidLoaded)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect Account</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Initializing secure connection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isExchanging) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.closeButton} />
          <Text style={styles.headerTitle}>Connect Account</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Connecting your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Account</Text>
        <View style={styles.closeButton} />
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Opening Plaid Link...</Text>
        <TouchableOpacity style={styles.retryButton} onPress={openPlaidLink}>
          <Text style={styles.retryButtonText}>Click here if Plaid doesn't open</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title2,
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: Colors.text.secondary,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    ...typography.body,
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
});
