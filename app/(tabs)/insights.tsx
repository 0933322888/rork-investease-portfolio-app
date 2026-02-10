import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, TrendingUp, Globe, PieChart, Sparkles, Wand2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useInsightsRefresh } from './_layout';

interface InsightPreviewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  refreshKey: number;
}

function InsightPreview({ icon, title, description, index, refreshKey }: InsightPreviewProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const delay = index * 100;
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      )
    );
    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(8, { duration: 150 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
      )
    );
  }, [refreshKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.insightCard, animatedStyle]}>
      <View style={styles.insightIconContainer}>{icon}</View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
      <View style={styles.lockBadge}>
        <Lock size={14} color={Colors.text.tertiary} strokeWidth={2} />
      </View>
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const { refreshKey } = useInsightsRefresh();
  const scrollRef = useRef<ScrollView>(null);
  const headerGlow = useSharedValue(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    headerGlow.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
    );
  }, [refreshKey]);

  const headerGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: headerGlow.value * 0.6,
    shadowRadius: headerGlow.value * 20,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerGlowStyle]}>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.headerBadgeText}>Premium</Text>
          </View>
          <Text style={styles.headerTitle}>Deeper Insights</Text>
          <Text style={styles.headerDescription}>
            Understand your portfolio better with advanced analytics and personalized recommendations
          </Text>
        </Animated.View>

        <View style={styles.insights}>
          <InsightPreview
            icon={<Globe size={24} color={Colors.accent} strokeWidth={2} />}
            title="Geographic Exposure"
            description="See where your investments are distributed across countries and regions"
            index={0}
            refreshKey={refreshKey}
          />
          <InsightPreview
            icon={<PieChart size={24} color={Colors.accent} strokeWidth={2} />}
            title="Sector Analysis"
            description="Understand your concentration across technology, healthcare, finance, and more"
            index={1}
            refreshKey={refreshKey}
          />
          <InsightPreview
            icon={<TrendingUp size={24} color={Colors.accent} strokeWidth={2} />}
            title="Risk Assessment"
            description="Get personalized insights into your portfolio's risk profile and volatility"
            index={2}
            refreshKey={refreshKey}
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
    paddingTop: 60,
  },
  header: {
    marginBottom: spacing.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  upgradePrice: {
    ...typography.footnote,
    color: 'rgba(255,255,255,0.85)',
  },
});
