import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Key, ShieldCheck, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';

export default function ConnectCoinbaseScreen() {
  const router = useRouter();
  const { syncCoinbaseAccount } = usePortfolio();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [assetsFound, setAssetsFound] = useState(0);

  const isFormValid = apiKey.trim().length > 0 && apiSecret.trim().length > 0;

  const handleConnect = async () => {
    if (!isFormValid) return;

    setIsConnecting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const result = await syncCoinbaseAccount(apiKey.trim(), apiSecret.trim());
      if (result.success) {
        setStatus('success');
        setAssetsFound(result.assetsCount || 0);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to connect. Check your API keys.');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Coinbase</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <CheckCircle size={64} color={Colors.positive} />
          </View>
          <Text style={styles.successTitle}>Connected!</Text>
          <Text style={styles.successSubtitle}>
            {assetsFound > 0
              ? `Found ${assetsFound} crypto asset${assetsFound > 1 ? 's' : ''} in your Coinbase account.`
              : 'Your Coinbase account is connected. Assets will sync shortly.'}
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Connect Coinbase</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <View style={styles.infoIconRow}>
            <ShieldCheck size={24} color={Colors.accent} />
            <Text style={styles.infoTitle}>Read-Only Access</Text>
          </View>
          <Text style={styles.infoText}>
            We only read your balances. No trading or withdrawals are possible with this connection.
          </Text>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How to create a read-only API key</Text>
          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
            <Text style={styles.stepText}>Go to Coinbase Settings &gt; API</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
            <Text style={styles.stepText}>Click "New API Key"</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
            <Text style={styles.stepText}>Select only "View" permissions</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>4</Text></View>
            <Text style={styles.stepText}>Disable all trading permissions</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>5</Text></View>
            <Text style={styles.stepText}>Copy and paste the keys below</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>API Key</Text>
            <View style={styles.inputWrapper}>
              <Key size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste your API key"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isConnecting}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>API Secret</Text>
            <View style={styles.inputWrapper}>
              <Key size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={apiSecret}
                onChangeText={setApiSecret}
                placeholder="Paste your API secret"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isConnecting}
              />
              <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={styles.eyeButton}>
                {showSecret ? (
                  <EyeOff size={18} color={Colors.text.tertiary} />
                ) : (
                  <Eye size={18} color={Colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {status === 'error' && (
          <View style={styles.errorCard}>
            <AlertCircle size={18} color={Colors.negative} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.connectButton, (!isFormValid || isConnecting) && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={!isFormValid || isConnecting}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonText}>Connect Coinbase</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  infoText: {
    ...typography.footnote,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  stepsCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  stepsTitle: {
    ...typography.subhead,
    color: Colors.text.primary,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  stepText: {
    ...typography.footnote,
    color: Colors.text.secondary,
    flex: 1,
  },
  form: {
    gap: spacing.lg,
  },
  formGroup: {
    gap: spacing.sm,
  },
  formLabel: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: Colors.text.primary,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.negative + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: Colors.negative + '30',
  },
  errorText: {
    ...typography.footnote,
    color: Colors.negative,
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  connectButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: Colors.border.medium,
    shadowOpacity: 0,
  },
  connectButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successIconWrapper: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: Colors.positive,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: borderRadius.md,
  },
  doneButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
});
