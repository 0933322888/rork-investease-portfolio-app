import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, TrendingUp, Globe, PieChart, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';

interface InsightPreviewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function InsightPreview({ icon, title, description }: InsightPreviewProps) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightIconContainer}>{icon}</View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
      <View style={styles.lockBadge}>
        <Lock size={14} color={Colors.text.tertiary} strokeWidth={2} />
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.headerBadgeText}>Premium</Text>
          </View>
          <Text style={styles.headerTitle}>Deeper Insights</Text>
          <Text style={styles.headerDescription}>
            Understand your portfolio better with advanced analytics and personalized recommendations
          </Text>
        </View>

        <View style={styles.insights}>
          <InsightPreview
            icon={<Globe size={24} color={Colors.accent} strokeWidth={2} />}
            title="Geographic Exposure"
            description="See where your investments are distributed across countries and regions"
          />
          <InsightPreview
            icon={<PieChart size={24} color={Colors.accent} strokeWidth={2} />}
            title="Sector Analysis"
            description="Understand your concentration across technology, healthcare, finance, and more"
          />
          <InsightPreview
            icon={<TrendingUp size={24} color={Colors.accent} strokeWidth={2} />}
            title="Risk Assessment"
            description="Get personalized insights into your portfolio's risk profile and volatility"
          />
        </View>

        <View style={styles.paywallCard}>
          <Text style={styles.paywallTitle}>Unlock Premium Insights</Text>
          <Text style={styles.paywallDescription}>
            Get detailed analytics, personalized recommendations, and advanced portfolio tracking
          </Text>
          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>Advanced diversification metrics</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>Country & sector breakdown</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>Risk analysis & recommendations</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.8}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            <Text style={styles.upgradePrice}>$4.99/month</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: spacing.md,
  },
  headerBadgeText: {
    ...typography.footnote,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  headerTitle: {
    ...typography.title1,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
  },
  headerDescription: {
    ...typography.body,
    color: Colors.text.secondary,
  },
  insights: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    opacity: 0.6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
    gap: spacing.xs,
  },
  insightTitle: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  insightDescription: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  paywallTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  paywallDescription: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  features: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.card,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  featureText: {
    ...typography.callout,
    color: Colors.text.primary,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  upgradeButtonText: {
    ...typography.headline,
    color: Colors.card,
    marginBottom: spacing.xs,
  },
  upgradePrice: {
    ...typography.footnote,
    color: Colors.card,
    opacity: 0.9,
  },
});
