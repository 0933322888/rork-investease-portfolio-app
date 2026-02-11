import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Check, X, Sparkles, TrendingUp, Shield, Link2, BarChart3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FEATURES = [
  {
    icon: Link2,
    title: 'Connected Accounts',
    description: 'Link bank & brokerage accounts via Plaid and SnapTrade',
  },
  {
    icon: BarChart3,
    title: 'Advanced Insights',
    description: 'Diversification score, concentration risk, and recommendations',
  },
  {
    icon: TrendingUp,
    title: 'Detailed Analytics',
    description: 'Total return breakdowns, cost basis analysis, and performance tracking',
  },
  {
    icon: Shield,
    title: 'Risk Assessment',
    description: 'Personalized risk fingerprint with detailed analysis',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, purchase, isPurchasing } = useSubscription();

  const handleUpgrade = async () => {
    const success = await purchase();
    if (success) {
      Alert.alert(
        'Welcome to Premium!',
        'You now have access to all premium features.',
        [{ text: 'Let\'s Go', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GradientBackground />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyPremium}>
          <View style={styles.alreadyPremiumIcon}>
            <Crown size={48} color={Colors.accent} strokeWidth={1.5} />
          </View>
          <Text style={styles.alreadyPremiumTitle}>You're Already Premium</Text>
          <Text style={styles.alreadyPremiumSubtitle}>
            You have access to all premium features. Enjoy!
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <View style={styles.crownGlow} />
            <Crown size={56} color={Colors.accent} strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Get the most out of your portfolio with advanced analytics and integrations
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <feature.icon size={22} color={Colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Check size={20} color={Colors.success} strokeWidth={2.5} />
            </View>
          ))}
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Sparkles size={18} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.pricingLabel}>PREMIUM</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>$</Text>
            <Text style={styles.priceAmount}>9</Text>
            <Text style={styles.pricePeriod}>.99/mo</Text>
          </View>
          <Text style={styles.pricingNote}>Cancel anytime</Text>
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, isPurchasing && styles.upgradeButtonDisabled]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Crown size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  crownContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  crownGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    opacity: 0.1,
  },
  heroTitle: {
    ...typography.title1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  featuresSection: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  featureDescription: {
    ...typography.footnote,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  pricingCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pricingLabel: {
    ...typography.subhead,
    color: Colors.accent,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 56,
    fontWeight: '800' as const,
    color: Colors.text.primary,
    lineHeight: 64,
  },
  pricePeriod: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  pricingNote: {
    ...typography.footnote,
    color: Colors.text.tertiary,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  upgradeButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 18,
  },
  termsText: {
    ...typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  alreadyPremium: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  alreadyPremiumIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  alreadyPremiumTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  alreadyPremiumSubtitle: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  backButton: {
    backgroundColor: Colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  backButtonText: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
});
