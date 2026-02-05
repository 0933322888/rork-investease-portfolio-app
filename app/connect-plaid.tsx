import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { trpc } from '@/lib/trpc';
import { usePortfolio } from '@/contexts/PortfolioContext';

export default function ConnectPlaidScreen() {
  const router = useRouter();
  const { syncPlaidAccount } = usePortfolio();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  const userId = 'user_' + Date.now();

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

  React.useEffect(() => {
    createLinkTokenMutation.mutate({ userId });
  }, []);

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('[ConnectPlaid] WebView message:', message.type);

      if (message.type === 'success' && message.publicToken) {
        setIsExchanging(true);
        exchangeTokenMutation.mutate({ publicToken: message.publicToken });
      } else if (message.type === 'exit') {
        router.back();
      }
    } catch (error) {
      console.error('[ConnectPlaid] Error parsing message:', error);
    }
  };

  const plaidLinkHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      </style>
    </head>
    <body>
      <script>
        const linkToken = '${linkToken}';
        
        const handler = Plaid.create({
          token: linkToken,
          onSuccess: (publicToken, metadata) => {
            console.log('Plaid success:', publicToken);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              publicToken: publicToken,
              metadata: metadata
            }));
          },
          onExit: (err, metadata) => {
            console.log('Plaid exit:', err);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'exit',
              error: err,
              metadata: metadata
            }));
          },
          onEvent: (eventName, metadata) => {
            console.log('Plaid event:', eventName);
          }
        });

        handler.open();
      </script>
    </body>
    </html>
  `;

  if (createLinkTokenMutation.isPending || !linkToken) {
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
      <WebView
        source={{ html: plaidLinkHtml }}
        onMessage={handleWebViewMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
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
  webview: {
    flex: 1,
  },
});
