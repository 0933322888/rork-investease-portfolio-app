import { router } from 'expo-router';
import { 
  ChevronRight, TrendingUp, AlertCircle, DollarSign,
  Shield, BarChart3, Landmark, CreditCard, Bitcoin,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle as SvgCircle, Rect } from 'react-native-svg';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ASSET_TYPES, AssetType } from '@/types/assets';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2 - spacing.lg * 2;
const CHART_HEIGHT = 110;

const ALLOC_COLORS = ['#007AFF', '#FF9500', '#34C759', '#FF3B30', '#AF52DE', '#5AC8FA'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function NetWorthChart({ data }: { data: number[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 4;
  const drawW = CHART_WIDTH - padding * 2;
  const drawH = CHART_HEIGHT - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * drawW;
    const y = padding + drawH - ((value - min) / range) * drawH;
    return { x, y };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillPath = `${pathData} L ${CHART_WIDTH - padding},${CHART_HEIGHT} L ${padding},${CHART_HEIGHT} Z`;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <SvgLinearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#34C759" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#34C759" stopOpacity="0.01" />
        </SvgLinearGradient>
      </Defs>
      <Path d={fillPath} fill="url(#netGrad)" />
      <Path d={pathData} stroke="#34C759" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DonutChart({ data, size = 160 }: { data: { percentage: number; color: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 18;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const segments: { percentage: number; color: string; offset: number }[] = [];
  let accumulated = 0;
  data.forEach((segment) => {
    segments.push({ ...segment, offset: accumulated });
    accumulated += segment.percentage;
  });

  return (
    <Svg width={size} height={size}>
      <SvgCircle cx={cx} cy={cy} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
      {segments.map((segment, index) => {
        const dashLength = (segment.percentage / 100) * circumference;
        const gapLength = circumference - dashLength;
        const dashOffset = -((segment.offset / 100) * circumference);
        return (
          <SvgCircle
            key={index}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dashLength} ${gapLength}`}
            strokeDashoffset={dashOffset}
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
  { icon: Landmark, text: 'You are 45% invested in US markets.', color: '#007AFF' },
  { icon: AlertCircle, text: 'Crypto grew 12% this week.', color: '#FF9500' },
  { icon: DollarSign, text: 'You received $120 in dividends.', color: '#34C759' },
];

function HealthGauge({ score }: { score: number }) {
  const gaugeWidth = 100;
  const gaugeHeight = 6;
  const fillWidth = (score / 100) * gaugeWidth;
  let color = '#FF3B30';
  if (score >= 80) color = '#34C759';
  else if (score >= 60) color = '#007AFF';
  else if (score >= 40) color = '#FF9500';

  return (
    <Svg width={gaugeWidth} height={gaugeHeight}>
      <Rect x={0} y={0} width={gaugeWidth} height={gaugeHeight} rx={3} fill="rgba(255,255,255,0.08)" />
      <Rect x={0} y={0} width={fillWidth} height={gaugeHeight} rx={3} fill={color} />
    </Svg>
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
    return ASSET_TYPES.map((type, index) => ({
      ...type,
      value: assetAllocation[type.id],
      percentage: total > 0 ? (assetAllocation[type.id] / total) * 100 : 0,
      color: ALLOC_COLORS[index % ALLOC_COLORS.length],
    })).filter((item) => item.value > 0);
  }, [assetAllocation]);

  const health = useMemo(() => getHealthScore(allocationData), [allocationData]);
  const isPositive = totalGain >= 0;

  const connectedAccounts = useMemo(() => {
    const accounts: { name: string; value: number; change: number; icon: any; type: string }[] = [];
    const grouped: Record<string, { total: number; count: number }> = {};
    
    assets.forEach(asset => {
      const key = asset.type;
      if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
      grouped[key].total += asset.quantity * asset.currentPrice;
      grouped[key].count++;
    });

    const typeIcons: Record<string, any> = {
      stocks: TrendingUp,
      crypto: Bitcoin,
      cash: CreditCard,
      'real-estate': Landmark,
      commodities: BarChart3,
      'fixed-income': Shield,
    };

    const typeLabels: Record<string, string> = {
      stocks: 'Stocks',
      crypto: 'Crypto',
      cash: 'Cash',
      'real-estate': 'Real Estate',
      commodities: 'Commodities',
      'fixed-income': 'Bonds',
    };

    Object.entries(grouped).forEach(([type, data]) => {
      const change = (Math.random() - 0.3) * data.total * 0.01;
      accounts.push({
        name: typeLabels[type] || type,
        value: data.total,
        change,
        icon: typeIcons[type] || TrendingUp,
        type,
      });
    });

    return accounts.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [assets]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.7} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.avatarText}>U</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.netWorthCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/portfolio')}
        >
          <View style={styles.netWorthGlow} />
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.netWorthValue}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <View style={styles.netWorthChange}>
            <View style={[styles.changePill, isPositive ? styles.changePillPositive : styles.changePillNegative]}>
              <Text style={[styles.changePillText, isPositive ? styles.positive : styles.negative]}>
                {isPositive ? '+' : ''}{totalGainPercent.toFixed(2)}%
              </Text>
            </View>
            <Text style={[styles.netWorthChangeAbs, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : '-'}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} today
            </Text>
          </View>
          <View style={styles.chartWrapper}>
            <NetWorthChart data={mockHistoricalData} />
          </View>
          <View style={styles.chartPeriod}>
            <Text style={styles.chartPeriodText}>7D</Text>
          </View>
        </TouchableOpacity>

        {allocationData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Allocation</Text>
            <View style={styles.allocationContent}>
              <View style={styles.allocationList}>
                {allocationData.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.allocationRow}
                    activeOpacity={0.6}
                    onPress={() => router.push('/(tabs)/portfolio')}
                  >
                    <View style={styles.allocationLeft}>
                      <View style={[styles.allocDot, { backgroundColor: item.color }]} />
                      <Text style={styles.allocLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.allocationRight}>
                      <Text style={styles.allocPercent}>{item.percentage.toFixed(0)}%</Text>
                      <Text style={styles.allocValue}>{formatCompact(item.value)}</Text>
                    </View>
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
          </View>
        )}

        {assets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Portfolio Health</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.healthScoreBold}>{health.score}</Text>
                <Text style={styles.healthScoreTotal}>/100</Text>
              </View>
            </View>
            <View style={styles.gaugeRow}>
              <HealthGauge score={health.score} />
            </View>
            <Text style={styles.healthStatus}>
              <Text style={styles.healthLabel}>{health.label}</Text>
              <Text style={styles.healthDetail}> — {health.detail}</Text>
            </Text>
            <View style={styles.healthPills}>
              {HEALTH_CATEGORIES.map((cat) => (
                <View key={cat} style={styles.healthPill}>
                  <Text style={styles.healthPillText}>{cat}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.improveButton}
              onPress={() => router.push('/risk-fingerprint')}
              activeOpacity={0.8}
            >
              <Text style={styles.improveButtonText}>Improve my portfolio</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {connectedAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsScroll}
            >
              {connectedAccounts.map((account, index) => {
                const Icon = account.icon;
                const isUp = account.change >= 0;
                return (
                  <View key={index} style={styles.accountCard}>
                    <View style={styles.accountTop}>
                      <View style={[styles.accountIcon, { backgroundColor: ALLOC_COLORS[index % ALLOC_COLORS.length] + '20' }]}>
                        <Icon size={18} color={ALLOC_COLORS[index % ALLOC_COLORS.length]} />
                      </View>
                    </View>
                    <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
                    <Text style={styles.accountValue}>
                      ${account.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={[styles.accountChange, isUp ? styles.positive : styles.negative]}>
                      {isUp ? '+' : '-'}${Math.abs(account.change).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.addAccountCard}
                onPress={() => router.push('/connect-plaid')}
                activeOpacity={0.7}
              >
                <View style={styles.addAccountPlus}>
                  <Text style={styles.addAccountPlusText}>+</Text>
                </View>
                <Text style={styles.addAccountText}>Add account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsCard}>
            {INSIGHTS_DATA.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <TouchableOpacity key={index} style={[styles.insightRow, index === INSIGHTS_DATA.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
                  <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                    <Icon size={16} color={insight.color} />
                  </View>
                  <Text style={styles.insightText} numberOfLines={1}>{insight.text}</Text>
                  <ChevronRight size={14} color={Colors.text.tertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {assets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start Building Your Portfolio</Text>
            <Text style={styles.emptyDescription}>
              Add your first investment to start tracking your wealth
            </Text>
          </View>
        )}
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
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  dateText: {
    ...typography.footnote,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  netWorthCard: {
    backgroundColor: '#161628',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  netWorthGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  netWorthLabel: {
    ...typography.subhead,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  netWorthValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  netWorthChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  changePillPositive: {
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  changePillNegative: {
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  changePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  netWorthChangeAbs: {
    ...typography.footnote,
    fontWeight: '500',
  },
  chartWrapper: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.sm,
  },
  chartPeriod: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  chartPeriodText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  allocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationList: {
    flex: 1,
    gap: 14,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  allocDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocLabel: {
    ...typography.subhead,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  allocationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allocPercent: {
    ...typography.subhead,
    color: Colors.text.primary,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  allocValue: {
    ...typography.footnote,
    color: Colors.text.secondary,
    minWidth: 48,
    textAlign: 'right',
  },
  donutWrapper: {
    marginLeft: spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  healthScoreBold: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  healthScoreTotal: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text.tertiary,
    marginLeft: 2,
  },
  gaugeRow: {
    marginBottom: spacing.md,
  },
  healthStatus: {
    ...typography.subhead,
    color: Colors.text.secondary,
    marginBottom: spacing.md,
  },
  healthLabel: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
  healthDetail: {
    fontWeight: '400',
    color: Colors.text.secondary,
  },
  healthPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  healthPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  healthPillText: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  improveButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  improveButtonText: {
    ...typography.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  accountsScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 150,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  accountTop: {
    marginBottom: spacing.sm,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  accountChange: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  addAccountCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 130,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addAccountPlus: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountPlusText: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.text.secondary,
  },
  addAccountText: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    ...typography.subhead,
    color: Colors.text.primary,
    flex: 1,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
