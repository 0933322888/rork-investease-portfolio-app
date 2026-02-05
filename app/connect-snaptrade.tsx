import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, ExternalLink, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { trpc } from '@/lib/trpc';
import { usePortfolio } from '@/contexts/PortfolioContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SNAPTRADE_USER_KEY = 'snaptrade_user';

export default function ConnectSnapTradeScreen() {
  const router = useRouter();
  const { syncSnapTradeAccount } = usePortfolio();
  const [isLoading, setIsLoading] = useState(true);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [snapTradeUser, setSnapTradeUser] = useState<{ userId: string; userSecret: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const userIdRef = React.useRef('snaptrade_user_' + Date.now());

  const registerUserMutation = trpc.snaptrade.registerUser.useMutation({
    onSuccess: async (data) => {
      console.log('[SnapTrade] User registered');
      const user = { userId: data.userId!, userSecret: data.userSecret! };
      setSnapTradeUser(user);
      await AsyncStorage.setItem(SNAPTRADE_USER_KEY, JSON.stringify(user));
      getConnectionUrlMutation.mutate(user);
    },
    onError: async (error) => {
      if (error.message === 'USER_EXISTS') {
        const storedUser = await AsyncStorage.getItem(SNAPTRADE_USER_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setSnapTradeUser(user);
          getConnectionUrlMutation.mutate(user);
        } else {
          Alert.alert('Error', 'User exists but credentials not found. Please try again.');
          setIsLoading(false);
        }
      } else {
        console.error('[SnapTrade] Error registering user:', error);
        Alert.alert('Error', 'Failed to register with SnapTrade. Please try again.');
        setIsLoading(false);
      }
    },
  });

  const getConnectionUrlMutation = trpc.snaptrade.getConnectionUrl.useMutation({
    onSuccess: (data) => {
      console.log('[SnapTrade] Connection URL generated');
      setConnectionUrl(data.redirectUri!);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('[SnapTrade] Error getting connection URL:', error);
      Alert.alert('Error', 'Failed to get connection URL. Please try again.');
      setIsLoading(false);
    },
  });

  useEffect(() => {
    initializeSnapTrade();
  }, []);

  const initializeSnapTrade = async () => {
    const storedUser = await AsyncStorage.getItem(SNAPTRADE_USER_KEY);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setSnapTradeUser(user);
      getConnectionUrlMutation.mutate(user);
    } else {
      registerUserMutation.mutate({ userId: userIdRef.current });
    }
  };

  const openConnectionUrl = useCallback(() => {
    if (connectionUrl) {
      if (Platform.OS === 'web') {
        window.open(connectionUrl, '_blank');
      } else {
        Linking.openURL(connectionUrl);
      }
    }
  }, [connectionUrl]);

  const syncAccounts = async () => {
    if (!snapTradeUser) return;
    
    setIsSyncing(true);
    try {
      await syncSnapTradeAccount(snapTradeUser.userId, snapTradeUser.userSecret);
      Alert.alert('Success', 'Accounts synced successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('[SnapTrade] Error syncing accounts:', error);
      Alert.alert('Error', 'Failed to sync accounts. Make sure you have connected a brokerage first.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Connect Brokerage</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing SnapTrade...</Text>
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
        <Text style={styles.title}>Connect Brokerage</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Connect your brokerage account to automatically sync your investment holdings.
          SnapTrade supports 20+ brokerages including Alpaca, Webull, Trading 212, and more.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Click "Connect Brokerage" to open the SnapTrade portal</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Select your brokerage and log in with your credentials</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Return here and tap "Sync Accounts" to import your holdings</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={openConnectionUrl}
          disabled={!connectionUrl}
        >
          <ExternalLink size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.connectButtonText}>Connect Brokerage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={syncAccounts}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <RefreshCw size={20} color={Colors.primary} style={styles.buttonIcon} />
              <Text style={styles.syncButtonText}>Sync Accounts</Text>
            </>
          )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: Colors.text.secondary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepText: {
    ...typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  connectButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  syncButton: {
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    ...typography.button,
    color: Colors.primary,
  },
});
