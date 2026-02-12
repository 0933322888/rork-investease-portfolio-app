import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, TrendingUp, Globe, PieChart, Sparkles, Wand2, ChevronRight, AlertTriangle, ShieldCheck, BarChart3, Radar } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useInsightsRefresh } from './_layout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { calculateRiskFingerprint, RiskDimension } from '@/utils/riskFingerprint';

const { width: screenWidth } = Dimensions.get('window');
const CHART_SIZE = Math.min(screenWidth - spacing.lg * 4, 280);
const CHART_CENTER = CHART_SIZE / 2;
const MAX_RADIUS = CHART_CENTER - 50;

function getColorForScore(score: number): string {
  if (score > 70) return '#FF6B6B';
  if (score > 50) return '#F5B14C';
  if (score > 30) return '#FFCC00';
  return '#32D583';
}

function RiskRadarChart({ dimensions }: { dimensions: RiskDimension[] }) {
  const angleStep = (Math.PI * 2) / dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * MAX_RADIUS;
    return {
      x: CHART_CENTER + radius * Math.cos(angle),
      y: CHART_CENTER + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = MAX_RADIUS + 20;
    return {
      x: CHART_CENTER + radius * Math.cos(angle),
      y: CHART_CENTER + radius * Math.sin(angle),
    };
  };

  const polygonPoints = dimensions
    .map((dim, index) => {
      const point = getPoint(index, dim.score);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const levels = [20, 40, 60, 80, 100];

  return (
    <View style={styles.radarContainer}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {levels.map((level) => {
          const points = dimensions
            .map((_, index) => {
              const point = getPoint(index, level);
              return `${point.x},${point.y}`;
            })
            .join(' ');
          return (
            <Polygon
              key={level}
              points={points}
              fill="none"
              stroke={Colors.border.light}
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}
        {dimensions.map((_, index) => {
          const outerPoint = getPoint(index, 100);
          return (
            <Line
              key={index}
              x1={CHART_CENTER}
              y1={CHART_CENTER}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke={Colors.border.light}
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}
        <Polygon
          points={polygonPoints}
          fill={Colors.accent}
          fillOpacity={0.2}
          stroke={Colors.accent}
          strokeWidth={2.5}
        />
        {dimensions.map((dim, index) => {
          const point = getPoint(index, dim.score);
          return (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={Colors.accent}
            />
          );
        })}
      </Svg>
      {dimensions.map((dim, index) => {
        const labelPoint = getLabelPoint(index);
        const isLeft = labelPoint.x < CHART_CENTER - 15;
        const isRight = labelPoint.x > CHART_CENTER + 15;
        const isTop = labelPoint.y < CHART_CENTER - 15;
        const isBottom = labelPoint.y > CHART_CENTER + 15;

        let textAlign: 'left' | 'center' | 'right' = 'center';
        if (isLeft) textAlign = 'right';
        if (isRight) textAlign = 'left';

        let translateX = -40;
        if (isLeft) translateX = -80;
        if (isRight) translateX = 0;

        let translateY = -10;
        if (isTop) translateY = -24;
        if (isBottom) translateY = 4;

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: labelPoint.x,
              top: labelPoint.y,
              width: 80,
              transform: [{ translateX }, { translateY }],
            }}
          >
            <Text style={[styles.radarLabelText, { textAlign }]} numberOfLines={2}>{dim.label}</Text>
            <Text style={[styles.radarScoreText, { textAlign }]}>{dim.score.toFixed(0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

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
  const { refreshKey, registerScrollHandler } = useInsightsRefresh();
  const scrollRef = useRef<ScrollView>(null);
  const recsYRef = useRef(0);
  const headerGlow = useSharedValue(0);
  const isFirst = useRef(true);
  const { assets } = usePortfolio();
  const fingerprint = useMemo(() => calculateRiskFingerprint(assets), [assets]);

  useEffect(() => {
    registerScrollHandler(() => {
      scrollRef.current?.scrollTo({ y: recsYRef.current, animated: true });
    });
  }, [registerScrollHandler]);

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

  const now = Date.now();
  const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

  const totalValue = assets.reduce((sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity, 0);
  const totalCost = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);

  const typeBreakdown: Record<string, number> = {};
  const typeCost: Record<string, number> = {};
  assets.forEach(a => {
    const type = a.type || 'other';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + (a.currentPrice || a.purchasePrice) * a.quantity;
    typeCost[type] = (typeCost[type] || 0) + a.purchasePrice * a.quantity;
  });

  const typeColors: Record<string, string> = {
    stocks: '#6C8CFF',
    crypto: '#F5B14C',
    cash: '#58D68D',
    'real-estate': '#FF7A7A',
    commodities: '#E0A458',
    'fixed-income': '#9B8FFF',
    other: '#B8C1EC',
  };

  const typeLabels: Record<string, string> = {
    stocks: 'Stocks',
    crypto: 'Crypto',
    cash: 'Cash',
    'real-estate': 'Real Estate',
    commodities: 'Commodities',
    'fixed-income': 'Fixed Income',
    other: 'Other',
  };

  const sortedTypes = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0];
  const concentrationPct = topType ? ((topType[1] / totalValue) * 100).toFixed(0) : '0';

  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : '0';

  const calcPeriodReturn = (periodMs: number) => {
    const cutoff = now - periodMs;
    const periodAssets = assets.filter(a => {
      const addedTime = a.purchaseDate ? new Date(a.purchaseDate).getTime() : (a.addedAt || now);
      return addedTime >= cutoff;
    });
    if (periodAssets.length === 0) return { gain: 0, pct: '0.0', count: 0 };
    const pCost = periodAssets.reduce((s, a) => s + a.purchasePrice * a.quantity, 0);
    const pValue = periodAssets.reduce((s, a) => s + (a.currentPrice || a.purchasePrice) * a.quantity, 0);
    const pGain = pValue - pCost;
    return { gain: pGain, pct: pCost > 0 ? ((pGain / pCost) * 100).toFixed(1) : '0.0', count: periodAssets.length };
  };

  const return1m = calcPeriodReturn(ONE_MONTH);
  const return1y = calcPeriodReturn(ONE_YEAR);

  const topHoldings = [...assets]
    .map(a => ({ ...a, value: (a.currentPrice || a.purchasePrice) * a.quantity }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

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

  const fmtMoney = (v: number) => {
    const sign = v >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtPct = (v: string, gain: number) => `${gain >= 0 ? '+' : ''}${v}%`;

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

        <View style={styles.sectionHeader}>
          <TrendingUp size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Total Return</Text>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.returnHero}>
            <Text style={[styles.returnHeroValue, { color: totalGain >= 0 ? '#32D583' : '#FF6B6B' }]}>
              {fmtPct(totalGainPct, totalGain)}
            </Text>
            <Text style={styles.returnHeroSubtext}>{fmtMoney(totalGain)}</Text>
          </View>
          <View style={styles.returnDivider} />
          <View style={styles.returnPeriods}>
            <View style={styles.returnPeriodItem}>
              <Text style={styles.returnPeriodLabel}>1 Month</Text>
              <Text style={[styles.returnPeriodValue, { color: return1m.gain >= 0 ? '#32D583' : '#FF6B6B' }]}>
                {fmtPct(return1m.pct, return1m.gain)}
              </Text>
              <Text style={styles.returnPeriodAmount}>{fmtMoney(return1m.gain)}</Text>
              <Text style={styles.returnPeriodCount}>{return1m.count} asset{return1m.count !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.returnPeriodDivider} />
            <View style={styles.returnPeriodItem}>
              <Text style={styles.returnPeriodLabel}>1 Year</Text>
              <Text style={[styles.returnPeriodValue, { color: return1y.gain >= 0 ? '#32D583' : '#FF6B6B' }]}>
                {fmtPct(return1y.pct, return1y.gain)}
              </Text>
              <Text style={styles.returnPeriodAmount}>{fmtMoney(return1y.gain)}</Text>
              <Text style={styles.returnPeriodCount}>{return1y.count} asset{return1y.count !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.returnPeriodDivider} />
            <View style={styles.returnPeriodItem}>
              <Text style={styles.returnPeriodLabel}>All Time</Text>
              <Text style={[styles.returnPeriodValue, { color: totalGain >= 0 ? '#32D583' : '#FF6B6B' }]}>
                {fmtPct(totalGainPct, totalGain)}
              </Text>
              <Text style={styles.returnPeriodAmount}>{fmtMoney(totalGain)}</Text>
              <Text style={styles.returnPeriodCount}>{assets.length} asset{assets.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.returnDivider} />
          <View style={styles.returnSummaryRow}>
            <View style={styles.returnSummaryItem}>
              <Text style={styles.returnSummaryLabel}>Cost Basis</Text>
              <Text style={styles.returnSummaryValue}>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.returnSummaryItem}>
              <Text style={styles.returnSummaryLabel}>Current Value</Text>
              <Text style={styles.returnSummaryValue}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <PieChart size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Diversification</Text>
          <View style={[styles.scoreBadge, { backgroundColor: diversificationColor + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: diversificationColor }]}>{diversificationScore}</Text>
          </View>
        </View>
        <View style={styles.detailCard}>
          {sortedTypes.length > 0 ? (
            <>
              <View style={styles.allocationBar}>
                {sortedTypes.map(([type, value]) => (
                  <View
                    key={type}
                    style={{
                      flex: value / totalValue,
                      height: 10,
                      backgroundColor: typeColors[type] || '#B8C1EC',
                      borderRadius: 5,
                    }}
                  />
                ))}
              </View>
              <View style={styles.allocationList}>
                {sortedTypes.map(([type, value]) => {
                  const cost = typeCost[type] || 0;
                  const gain = value - cost;
                  const gainPct = cost > 0 ? ((gain / cost) * 100).toFixed(1) : '0.0';
                  return (
                    <View key={type} style={styles.allocationRowExpanded}>
                      <View style={styles.allocationLabelRow}>
                        <View style={[styles.allocationDot, { backgroundColor: typeColors[type] || '#B8C1EC' }]} />
                        <Text style={styles.allocationLabel}>{typeLabels[type] || type}</Text>
                      </View>
                      <View style={styles.allocationRightCol}>
                        <Text style={styles.allocationValue}>
                          {((value / totalValue) * 100).toFixed(1)}%
                        </Text>
                        <Text style={[styles.allocationGain, { color: gain >= 0 ? '#32D583' : '#FF6B6B' }]}>
                          {fmtPct(gainPct, gain)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Add assets to see your allocation breakdown</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <AlertTriangle size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Concentration Risk</Text>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.concentrationHeader}>
            <Text style={styles.concentrationValue}>{concentrationPct}%</Text>
            <Text style={styles.concentrationLabel}>
              in {topType ? (typeLabels[topType[0]] || topType[0]) : 'N/A'}
            </Text>
          </View>
          {topHoldings.length > 0 && (
            <>
              <View style={styles.returnDivider} />
              <Text style={styles.topHoldingsTitle}>Top Holdings</Text>
              <View style={styles.topHoldingsList}>
                {topHoldings.map((h, i) => {
                  const holdingPct = totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) : '0.0';
                  const holdingGain = h.value - h.purchasePrice * h.quantity;
                  return (
                    <View key={h.id} style={styles.topHoldingRow}>
                      <View style={styles.topHoldingRank}>
                        <Text style={styles.topHoldingRankText}>{i + 1}</Text>
                      </View>
                      <View style={styles.topHoldingInfo}>
                        <Text style={styles.topHoldingName} numberOfLines={1}>{h.name}</Text>
                        <Text style={styles.topHoldingType}>{typeLabels[h.type] || h.type}</Text>
                      </View>
                      <View style={styles.topHoldingValues}>
                        <Text style={styles.topHoldingPct}>{holdingPct}%</Text>
                        <Text style={[styles.topHoldingGain, { color: holdingGain >= 0 ? '#32D583' : '#FF6B6B' }]}>
                          {fmtMoney(holdingGain)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View
          style={styles.sectionHeader}
          onLayout={(e) => { recsYRef.current = e.nativeEvent.layout.y; }}
        >
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

        <View style={styles.sectionHeader}>
          <Radar size={18} color={Colors.text.secondary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Risk Fingerprint</Text>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.radarChartWrapper}>
            <RiskRadarChart dimensions={fingerprint.dimensions} />
          </View>
          <Text style={styles.fingerprintInterpretation}>{fingerprint.interpretation}</Text>
          {fingerprint.badges.length > 0 && (
            <View style={styles.fingerprintBadges}>
              {fingerprint.badges.map((badge, index) => (
                <View key={index} style={styles.fingerprintBadge}>
                  <Text style={styles.fingerprintBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.riskDimensionsTitle}>Risk Dimensions</Text>
          {fingerprint.dimensions.map((dim) => (
            <View key={dim.key} style={styles.riskDimensionItem}>
              <View style={styles.riskDimensionHeader}>
                <Text style={styles.riskDimensionLabel}>{dim.label}</Text>
                <Text style={styles.riskDimensionScore}>{dim.score.toFixed(0)}/100</Text>
              </View>
              <Text style={styles.riskDimensionDesc}>{dim.description}</Text>
              <View style={styles.riskProgressBar}>
                <View
                  style={[
                    styles.riskProgressFill,
                    {
                      width: `${dim.score}%`,
                      backgroundColor: getColorForScore(dim.score),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
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
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  scoreBadgeText: {
    ...typography.footnote,
    fontWeight: '700' as const,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: spacing.xl,
  },
  returnHero: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  returnHeroValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    marginBottom: spacing.xs,
  },
  returnHeroSubtext: {
    ...typography.callout,
    color: Colors.text.secondary,
  },
  returnDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: spacing.md,
  },
  returnPeriods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  returnPeriodItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  returnPeriodDivider: {
    width: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: spacing.sm,
  },
  returnPeriodLabel: {
    ...typography.footnote,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  returnPeriodValue: {
    ...typography.headline,
    fontWeight: '700' as const,
  },
  returnPeriodAmount: {
    ...typography.caption,
    color: Colors.text.secondary,
  },
  returnPeriodCount: {
    ...typography.caption,
    color: Colors.text.tertiary,
    fontSize: 10,
  },
  returnSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  returnSummaryItem: {
    gap: spacing.xs,
  },
  returnSummaryLabel: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  returnSummaryValue: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  concentrationHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  concentrationValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#F5B14C',
    marginBottom: spacing.xs,
  },
  concentrationLabel: {
    ...typography.callout,
    color: Colors.text.secondary,
  },
  topHoldingsTitle: {
    ...typography.footnote,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  topHoldingsList: {
    gap: spacing.md,
  },
  topHoldingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  topHoldingRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHoldingRankText: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  topHoldingInfo: {
    flex: 1,
    gap: 2,
  },
  topHoldingName: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  topHoldingType: {
    ...typography.caption,
    color: Colors.text.tertiary,
  },
  topHoldingValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  topHoldingPct: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  topHoldingGain: {
    ...typography.caption,
  },
  allocationBar: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.lg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  allocationList: {
    gap: spacing.md,
  },
  allocationRowExpanded: {
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
  allocationRightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  allocationValue: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  allocationGain: {
    ...typography.caption,
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
  radarContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative' as const,
  },
  radarChartWrapper: {
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  radarLabelText: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
    marginBottom: 2,
    fontSize: 10,
  },
  radarScoreText: {
    ...typography.caption,
    color: Colors.accent,
    fontWeight: '700' as const,
    fontSize: 10,
  },
  fingerprintInterpretation: {
    ...typography.body,
    color: Colors.text.primary,
    lineHeight: 22,
    textAlign: 'center' as const,
    marginBottom: spacing.md,
  },
  fingerprintBadges: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    justifyContent: 'center' as const,
  },
  fingerprintBadge: {
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  fingerprintBadgeText: {
    ...typography.caption,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  riskDimensionsTitle: {
    ...typography.headline,
    color: Colors.text.primary,
    marginBottom: spacing.lg,
  },
  riskDimensionItem: {
    marginBottom: spacing.lg,
  },
  riskDimensionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  riskDimensionLabel: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
    flex: 1,
  },
  riskDimensionScore: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  riskDimensionDesc: {
    ...typography.caption,
    color: Colors.text.secondary,
    marginBottom: spacing.sm,
  },
  riskProgressBar: {
    height: 6,
    backgroundColor: Colors.border.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden' as const,
  },
  riskProgressFill: {
    height: '100%' as const,
    borderRadius: borderRadius.sm,
  },
});
