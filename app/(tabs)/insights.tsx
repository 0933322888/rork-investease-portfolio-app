import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, TrendingUp, Globe, PieChart, Sparkles, Wand2, ChevronRight, AlertTriangle, ShieldCheck, BarChart3 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useInsightsRefresh } from './_layout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePortfolio } from '@/contexts/PortfolioContext';

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

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  index: number;
  refreshKey: number;
}

function InsightCard({ icon, title, value, subtitle, color, index, refreshKey }: InsightCardProps) {
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
    <Animated.View style={[styles.premiumCard, animatedStyle]}>
      <View style={styles.premiumCardHeader}>
        <View style={[styles.premiumIconContainer, { backgroundColor: color + '20' }]}>{icon}</View>
        <Text style={styles.premiumCardTitle}>{title}</Text>
      </View>
      <Text style={styles.premiumCardValue}>{value}</Text>
      <Text style={styles.premiumCardSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

function PremiumInsights() {
  const { refreshKey } = useInsightsRefresh();
  const scrollRef = useRef<ScrollView>(null);
  const headerGlow = useSharedValue(0);
  const isFirst = useRef(true);
  const { assets } = usePortfolio();

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

  const totalValue = assets.reduce((sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity, 0);

  const typeBreakdown: Record<string, number> = {};
  assets.forEach(a => {
    const type = a.type || 'other';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + (a.currentPrice || a.purchasePrice) * a.quantity;
  });

  const typeColors: Record<string, string> = {
    stock: '#6C8CFF',
    crypto: '#F5B14C',
    cash: '#58D68D',
    'real-estate': '#FF7A7A',
    other: '#B8C1EC',
  };

  const typeLabels: Record<string, string> = {
    stock: 'Stocks',
    crypto: 'Crypto',
    cash: 'Cash',
    'real-estate': 'Real Estate',
    other: 'Other',
  };

  const sortedTypes = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0];
  const concentrationPct = topType ? ((topType[1] / totalValue) * 100).toFixed(0) : '0';

  const totalGain = assets.reduce((sum, a) => {
    const current = (a.currentPrice || a.purchasePrice) * a.quantity;
    const purchase = a.purchasePrice * a.quantity;
    return sum + (current - purchase);
  }, 0);
  const totalGainPct = totalValue > 0 ? ((totalGain / (totalValue - totalGain)) * 100).toFixed(1) : '0';

  const uniqueTypes = Object.keys(typeBreakdown).length;
  let diversificationScore = 'Low';
  let diversificationColor = '#FF6B6B';
  if (uniqueTypes >= 4) {
    diversificationScore = 'Excellent';
    diversificationColor = '#32D583';
  } else if (uniqueTypes >= 3) {
    diversificationScore = 'Good';
    diversificationColor = '#58D68D';
  } else if (uniqueTypes >= 2) {
    diversificationScore = 'Fair';
    diversificationColor = '#F5B14C';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerGlowStyle]}>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.headerBadgeText}>Premium Active</Text>
          </View>
          <Text style={styles.headerTitle}>Portfolio Insights</Text>
          <Text style={styles.headerDescription}>
            Advanced analytics and personalized recommendations for your portfolio
          </Text>
        </Animated.View>

        <View style={styles.premiumCards}>
          <InsightCard
            icon={<PieChart size={22} color="#6C8CFF" strokeWidth={2} />}
            title="Diversification"
            value={diversificationScore}
            subtitle={`${uniqueTypes} asset types across your portfolio`}
            color="#6C8CFF"
            index={0}
            refreshKey={refreshKey}
          />
          <InsightCard
            icon={<TrendingUp size={22} color="#32D583" strokeWidth={2} />}
            title="Total Return"
            value={`${totalGain >= 0 ? '+' : ''}${totalGainPct}%`}
            subtitle={`${totalGain >= 0 ? '+' : ''}$${Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} overall`}
            color={totalGain >= 0 ? '#32D583' : '#FF6B6B'}
            index={1}
            refreshKey={refreshKey}
          />
          <InsightCard
            icon={<AlertTriangle size={22} color="#F5B14C" strokeWidth={2} />}
            title="Concentration Risk"
            value={`${concentrationPct}%`}
            subtitle={topType ? `${typeLabels[topType[0]] || topType[0]} is your largest position` : 'No assets yet'}
            color="#F5B14C"
            index={2}
            refreshKey={refreshKey}
          />
        </View>

        <View style={styles.sectionHeader}>
          <BarChart3 size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
        </View>
        <View style={styles.allocationCard}>
          {sortedTypes.length > 0 ? (
            <>
              <View style={styles.allocationBar}>
                {sortedTypes.map(([type, value]) => (
                  <View
                    key={type}
                    style={{
                      flex: value / totalValue,
                      height: 8,
                      backgroundColor: typeColors[type] || '#B8C1EC',
                      borderRadius: 4,
                    }}
                  />
                ))}
              </View>
              <View style={styles.allocationList}>
                {sortedTypes.map(([type, value]) => (
                  <View key={type} style={styles.allocationRow}>
                    <View style={styles.allocationLabelRow}>
                      <View style={[styles.allocationDot, { backgroundColor: typeColors[type] || '#B8C1EC' }]} />
                      <Text style={styles.allocationLabel}>{typeLabels[type] || type}</Text>
                    </View>
                    <Text style={styles.allocationValue}>
                      {((value / totalValue) * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Add assets to see your allocation breakdown</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <ShieldCheck size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Recommendations</Text>
        </View>
        <View style={styles.recommendationsCard}>
          {uniqueTypes < 3 && (
            <View style={styles.recommendationItem}>
              <View style={[styles.recDot, { backgroundColor: '#F5B14C' }]} />
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>Diversify your portfolio</Text>
                <Text style={styles.recDesc}>Consider adding {uniqueTypes < 2 ? 'crypto, real estate, or cash' : 'additional asset types'} to reduce risk</Text>
              </View>
            </View>
          )}
          {Number(concentrationPct) > 70 && (
            <View style={styles.recommendationItem}>
              <View style={[styles.recDot, { backgroundColor: '#FF6B6B' }]} />
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>High concentration risk</Text>
                <Text style={styles.recDesc}>{concentrationPct}% of your portfolio is in {typeLabels[topType?.[0] || ''] || 'one asset type'}. Consider rebalancing.</Text>
              </View>
            </View>
          )}
          {Number(concentrationPct) <= 70 && uniqueTypes >= 3 && (
            <View style={styles.recommendationItem}>
              <View style={[styles.recDot, { backgroundColor: '#32D583' }]} />
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>Well-balanced portfolio</Text>
                <Text style={styles.recDesc}>Your allocation looks healthy with good diversification across {uniqueTypes} asset types</Text>
              </View>
            </View>
          )}
          {assets.length === 0 && (
            <View style={styles.recommendationItem}>
              <View style={[styles.recDot, { backgroundColor: '#6C8CFF' }]} />
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>Get started</Text>
                <Text style={styles.recDesc}>Add your first asset to start getting personalized insights</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function InsightsScreen() {
  const { isPremium } = useSubscription();
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

  if (isPremium) {
    return <PremiumInsights />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
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
    paddingBottom: 160,
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
  premiumCards: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  premiumCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCardTitle: {
    ...typography.callout,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  premiumCardValue: {
    ...typography.title1,
    color: Colors.text.primary,
    marginBottom: spacing.xs,
  },
  premiumCardSubtitle: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  allocationCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: spacing.xl,
  },
  allocationBar: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.lg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  allocationList: {
    gap: spacing.md,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationLabel: {
    ...typography.callout,
    color: Colors.text.primary,
  },
  allocationValue: {
    ...typography.callout,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  emptyText: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  recommendationsCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  recContent: {
    flex: 1,
    gap: spacing.xs,
  },
  recTitle: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  recDesc: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
});
