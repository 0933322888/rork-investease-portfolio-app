import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Crown, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';

const FEATURES = [
  'Connect unlimited bank accounts with Plaid',
  'Sync brokerage accounts via SnapTrade',
  'Advanced portfolio analytics',
  'Priority support',
  'Ad-free experience',
];

export default function PremiumScreen() {
  const router = useRouter();
  const { offerings, purchase, isPurchasing, restore, isRestoring, isPremium } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<string>('$rc_annual');

  const handlePurchase = async () => {
    try {
      await purchase(selectedPackage);
      Alert.alert('Success!', 'Welcome to Premium! You now have full access.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('[Premium] Purchase error:', error);
      if (!error.userCancelled) {
        Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert('Success', 'Your purchases have been restored!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('[Premium] Restore error:', error);
      Alert.alert('Error', 'No purchases found to restore.');
    }
  };

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.availablePackages.find(
    p => p.identifier === '$rc_monthly'
  );
  const yearlyPackage = currentOffering?.availablePackages.find(
    p => p.identifier === '$rc_annual'
  );

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyPremiumContainer}>
          <Crown size={64} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.alreadyPremiumTitle}>You're Premium!</Text>
          <Text style={styles.alreadyPremiumText}>
            You have full access to all premium features.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
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
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[Colors.accent, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Crown size={48} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.heroTitle}>Upgrade to Premium</Text>
          <Text style={styles.heroSubtitle}>Unlock the full power of your portfolio</Text>
        </LinearGradient>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkContainer}>
                <Check size={20} color={Colors.accent} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.packagesContainer}>
          {yearlyPackage && (
            <TouchableOpacity
              style={[
                styles.packageCard,
                selectedPackage === '$rc_annual' && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage('$rc_annual')}
            >
              <View style={styles.packageBadge}>
                <Sparkles size={14} color="#FFFFFF" />
                <Text style={styles.packageBadgeText}>Best Value</Text>
              </View>
              <Text style={styles.packageTitle}>Yearly</Text>
              <Text style={styles.packagePrice}>
                {formatPrice(yearlyPackage.product.price, yearlyPackage.product.currencyCode)}
              </Text>
              <Text style={styles.packagePeriod}>per year</Text>
              <Text style={styles.packageSavings}>Save 50%</Text>
            </TouchableOpacity>
          )}

          {monthlyPackage && (
            <TouchableOpacity
              style={[
                styles.packageCard,
                selectedPackage === '$rc_monthly' && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage('$rc_monthly')}
            >
              <Text style={styles.packageTitle}>Monthly</Text>
              <Text style={styles.packagePrice}>
                {formatPrice(monthlyPackage.product.price, monthlyPackage.product.currencyCode)}
              </Text>
              <Text style={styles.packagePeriod}>per month</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || !currentOffering}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>Start Premium</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          <Text style={styles.restoreButtonText}>
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions will auto-renew unless canceled. Cancel anytime in your account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  heroGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.largeTitle,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  packageCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  packageCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
  },
  packageBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  packageBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  packageTitle: {
    ...typography.title3,
    color: Colors.text.primary,
    fontWeight: '600' as const,
    marginTop: spacing.xs,
  },
  packagePrice: {
    ...typography.title1,
    color: Colors.text.primary,
    fontWeight: '700' as const,
    marginTop: spacing.xs,
  },
  packagePeriod: {
    ...typography.footnote,
    color: Colors.text.secondary,
    marginTop: spacing.xs,
  },
  packageSavings: {
    ...typography.footnote,
    color: Colors.accent,
    fontWeight: '600' as const,
    marginTop: spacing.xs,
  },
  purchaseButton: {
    backgroundColor: Colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  restoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  restoreButtonText: {
    ...typography.callout,
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    ...typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  alreadyPremiumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  alreadyPremiumTitle: {
    ...typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '700' as const,
    marginTop: spacing.lg,
  },
  alreadyPremiumText: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  doneButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  doneButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});
