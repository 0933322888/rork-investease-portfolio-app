import { router } from 'expo-router';
import { 
  ChevronRight, AlertCircle, DollarSign,
  Landmark,
} from 'lucide-react-native';
import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle as SvgCircle, Rect, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ASSET_TYPES, AssetType } from '@/types/assets';
import ConnectedAccountsSection from '@/components/home/ConnectedAccountsSection';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 4;
const CHART_HEIGHT = 50;

const ALLOC_COLORS: Record<string, string> = {
  stocks: Colors.stocks,
  crypto: Colors.crypto,
  cash: Colors.cash,
  'real-estate': Colors.realEstate,
  commodities: Colors.other,
  'fixed-income': '#B8C1EC',
};

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const w = CHART_WIDTH;
  const h = CHART_HEIGHT;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2),
  }));

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillD = `${pathD} L ${w - pad},${h} L ${pad},${h} Z`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.positive} stopOpacity="0.2" />
          <Stop offset="1" stopColor={Colors.positive} stopOpacity="0.01" />
        </SvgLinearGradient>
      </Defs>
      <Path d={fillD} fill="url(#sparkFill)" />
      <Path d={pathD} stroke={Colors.positive} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DonutChart({ data, size = 140 }: { data: { percentage: number; color: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 16;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const segments: { percentage: number; color: string; offset: number }[] = [];
  let accumulated = 0;
  data.forEach((seg) => {
    segments.push({ ...seg, offset: accumulated });
    accumulated += seg.percentage;
  });

  return (
    <Svg width={size} height={size}>
      <SvgCircle cx={cx} cy={cy} r={radius} stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="none" />
      {segments.map((seg, i) => {
        const dash = (seg.percentage / 100) * circumference;
        const gap = circumference - dash;
        const offset = -((seg.offset / 100) * circumference);
        return (
          <SvgCircle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            rotation={-90}
            origin={`${cx}, ${cy}`}
          />
        );
      })}
    </Svg>
  );
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function getHealthScore(allocationData: { id: AssetType; percentage: number }[]): { score: number; label: string; detail: string } {
  if (allocationData.length === 0) return { score: 0, label: 'N/A', detail: 'Add assets to see your score' };

  let score = 50;
  const typeCount = allocationData.length;
  if (typeCount >= 4) score += 20;
  else if (typeCount >= 3) score += 15;
  else if (typeCount >= 2) score += 8;

  const maxPct = Math.max(...allocationData.map(d => d.percentage));
  if (maxPct < 40) score += 20;
  else if (maxPct < 60) score += 10;
  else score -= 5;

  const hasStocks = allocationData.some(d => d.id === 'stocks');
  const hasCash = allocationData.some(d => d.id === 'cash');
  if (hasStocks && hasCash) score += 10;

  score = Math.min(100, Math.max(0, score));

  let label = 'Needs Work';
  let detail = 'Consider diversifying more';
  if (score >= 80) { label = 'Excellent'; detail = 'Well-diversified portfolio'; }
  else if (score >= 60) { label = 'Good'; detail = maxPct > 50 ? `Overexposed to ${allocationData.find(d => d.percentage === maxPct)?.id || 'one sector'}` : 'Room for improvement'; }
  else if (score >= 40) { label = 'Fair'; detail = 'More diversification recommended'; }

  return { score, label, detail };
}

const HEALTH_CATEGORIES = ['Diversification', 'Concentration', 'Volatility', 'Income'];

const INSIGHTS_DATA = [
  { icon: Landmark, text: 'You are 45% invested in US markets.', color: Colors.stocks },
  { icon: AlertCircle, text: 'Crypto grew 12% this week.', color: Colors.crypto },
  { icon: DollarSign, text: 'You received $120 in dividends.', color: Colors.positive },
];

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}


function InsightCard({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
  return (
    <TouchableOpacity
      style={styles.insightCard}
      activeOpacity={0.7}
      onPress={() => router.push('/(tabs)/insights')}
    >
      <View style={[styles.insightIcon, { backgroundColor: color + '18' }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={styles.insightText} numberOfLines={1}>{text}</Text>
      <ChevronRight size={14} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { totalValue, totalGain, totalGainPercent, assetAllocation, assets } = usePortfolio();

  const mockHistoricalData = useMemo(() => {
    if (assets.length === 0) return [];
    const baseValue = totalValue - totalGain;
    const points = 30;
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1);
      return baseValue + totalGain * progress + Math.random() * baseValue * 0.015;
    });
  }, [totalValue, totalGain, assets.length]);

  const allocationData = useMemo(() => {
    const total = Object.values(assetAllocation).reduce((sum, val) => sum + val, 0);
    return ASSET_TYPES.map((type) => ({
      ...type,
      value: assetAllocation[type.id],
      percentage: total > 0 ? (assetAllocation[type.id] / total) * 100 : 0,
      color: ALLOC_COLORS[type.id] || Colors.other,
    })).filter((item) => item.value > 0);
  }, [assetAllocation]);

  const health = useMemo(() => getHealthScore(allocationData), [allocationData]);
  const isPositive = totalGain >= 0;


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AnimatedCard delay={80}>
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/portfolio')}
          >
            <Text style={styles.heroLabel}>NET WORTH</Text>
            <Text style={styles.heroValue}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <View style={styles.heroChangeRow}>
              <Text style={[styles.heroDailyChange, { color: isPositive ? Colors.positive : Colors.negative }]}>
                {isPositive ? '+' : '-'}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} today
              </Text>
            </View>
            <View style={styles.sparklineWrapper}>
              <Sparkline data={mockHistoricalData} />
            </View>
          </TouchableOpacity>
        </AnimatedCard>

        {allocationData.length > 0 && (
          <AnimatedCard delay={160} style={styles.card}>
            <Text style={styles.cardTitle}>Allocation</Text>
            <View style={styles.allocationContent}>
              <View style={styles.allocationLegend}>
                {allocationData.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.legendRow}
                    activeOpacity={0.6}
                    onPress={() => router.push('/(tabs)/portfolio')}
                  >
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.legendPercent}>{item.percentage.toFixed(0)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.donutWrapper}>
                <DonutChart
                  data={allocationData.map(item => ({
                    percentage: item.percentage,
                    color: item.color,
                  }))}
                  size={140}
                />
              </View>
            </View>
          </AnimatedCard>
        )}

        {assets.length > 0 && (
          <AnimatedCard delay={240} style={styles.card}>
            <View style={styles.healthHeader}>
              <View>
                <Text style={styles.cardTitle}>Portfolio Health</Text>
                <Text style={styles.healthSubtitle}>{health.label} — {health.detail}</Text>
              </View>
              <Text style={styles.healthScore}>{health.score}</Text>
            </View>
            <View style={styles.chipsRow}>
              {HEALTH_CATEGORIES.map((cat) => (
                <Chip key={cat} label={cat} />
              ))}
            </View>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/risk-fingerprint')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>Improve my portfolio</Text>
            </TouchableOpacity>
          </AnimatedCard>
        )}

        <AnimatedCard delay={320}>
          <ConnectedAccountsSection />
        </AnimatedCard>

        <AnimatedCard delay={400}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {INSIGHTS_DATA.map((insight, index) => (
            <InsightCard
              key={index}
              icon={insight.icon}
              text={insight.text}
              color={insight.color}
            />
          ))}
        </AnimatedCard>

        {assets.length === 0 && (
          <AnimatedCard delay={160} style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start Building Your Portfolio</Text>
            <Text style={styles.emptyDescription}>
              Add your first investment to start tracking your wealth
            </Text>
          </AnimatedCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 44,
    paddingBottom: 160,
  },
  heroCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  heroChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  heroDailyChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  sparklineWrapper: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: spacing.md,
  },
  allocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationLegend: {
    flex: 1,
    gap: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  legendPercent: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  donutWrapper: {
    marginLeft: spacing.md,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  healthSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  healthScore: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.cardSoft,
  },
  chipText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  ctaButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3FAF7F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  insightCard: {
    borderRadius: 16,
    backgroundColor: Colors.cardSoft,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
