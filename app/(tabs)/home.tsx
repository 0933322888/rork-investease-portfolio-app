import { router } from 'expo-router';
import { Plus, Fingerprint } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ASSET_TYPES } from '@/types/assets';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2;
const CHART_HEIGHT = 180;
const CHART_PADDING = 16;

function SimpleLineChart({ data }: { data: number[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>Add your first asset to see performance</Text>
      </View>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const chartDrawWidth = CHART_WIDTH - CHART_PADDING * 2;
  const chartDrawHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const points = data.map((value, index) => {
    const x = CHART_PADDING + (index / (data.length - 1)) * chartDrawWidth;
    const y = CHART_PADDING + chartDrawHeight - ((value - min) / range) * chartDrawHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  const fillPath = `${pathData} L ${CHART_WIDTH - CHART_PADDING},${CHART_HEIGHT} L ${CHART_PADDING},${CHART_HEIGHT} Z`;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart}>
      <Defs>
        <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.accent} stopOpacity="0.3" />
          <Stop offset="1" stopColor={Colors.accent} stopOpacity="0.01" />
        </LinearGradient>
      </Defs>
      <Path
        d={fillPath}
        fill="url(#chartGradient)"
      />
      <Path
        d={pathData}
        stroke={Colors.accent}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length <= 50 && points.map((point, index) => {
        const [x, y] = point.split(',').map(Number);
        const isFirst = index === 0;
        const isLast = index === points.length - 1;
        if (isFirst || isLast || index % Math.ceil(points.length / 10) === 0) {
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={4}
              fill={Colors.card}
              stroke={Colors.accent}
              strokeWidth={2}
            />
          );
        }
        return null;
      })}
    </Svg>
  );
}

type DateRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'All';

export default function HomeScreen() {
  const { totalValue, totalGain, totalGainPercent, assetAllocation, assets } = usePortfolio();
  const [selectedRange, setSelectedRange] = useState<DateRange>('1M');

  const dataPointsForRange = (range: DateRange): number => {
    switch (range) {
      case '1D': return 24;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      case 'All': return 730;
      default: return 30;
    }
  };

  const mockHistoricalData = useMemo(() => {
    if (assets.length === 0) return [];
    const baseValue = totalValue - totalGain;
    const points = dataPointsForRange(selectedRange);
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1);
      return baseValue + totalGain * progress + Math.random() * baseValue * 0.02;
    });
  }, [totalValue, totalGain, assets.length, selectedRange]);

  const dateRanges: DateRange[] = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  const allocationData = useMemo(() => {
    const total = Object.values(assetAllocation).reduce((sum, val) => sum + val, 0);
    return ASSET_TYPES.map((type) => ({
      ...type,
      value: assetAllocation[type.id],
      percentage: total > 0 ? (assetAllocation[type.id] / total) * 100 : 0,
    })).filter((item) => item.value > 0);
  }, [assetAllocation]);

  const isPositive = totalGain >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Total Portfolio Value</Text>
          <Text style={styles.heroValue}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.performanceContainer}>
            <Text style={[styles.performance, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.performancePercent, isPositive ? styles.positive : styles.negative]}>
              ({isPositive ? '+' : ''}{totalGainPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.dateRangeContainer}>
            {dateRanges.map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.dateRangeButton,
                  selectedRange === range && styles.dateRangeButtonActive,
                ]}
                onPress={() => setSelectedRange(range)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    selectedRange === range && styles.dateRangeTextActive,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <SimpleLineChart data={mockHistoricalData} />
        </View>

        {assets.length > 0 && (
          <TouchableOpacity
            style={styles.fingerprintCard}
            onPress={() => router.push('/risk-fingerprint')}
            activeOpacity={0.8}
          >
            <View style={styles.fingerprintIcon}>
              <Fingerprint size={28} color={Colors.accent} strokeWidth={2} />
            </View>
            <View style={styles.fingerprintContent}>
              <Text style={styles.fingerprintTitle}>Portfolio Fingerprint</Text>
              <Text style={styles.fingerprintDescription}>
                See your portfolio's risk profile at a glance
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {allocationData.length > 0 && (
          <View style={styles.allocationCard}>
            <Text style={styles.sectionTitle}>Asset Allocation</Text>
            <View style={styles.allocationBars}>
              <View style={styles.barContainer}>
                {allocationData.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.bar,
                      {
                        flex: item.percentage,
                        backgroundColor: getColorForIndex(index),
                        borderTopLeftRadius: index === 0 ? borderRadius.sm : 0,
                        borderBottomLeftRadius: index === 0 ? borderRadius.sm : 0,
                        borderTopRightRadius: index === allocationData.length - 1 ? borderRadius.sm : 0,
                        borderBottomRightRadius: index === allocationData.length - 1 ? borderRadius.sm : 0,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.allocationList}>
              {allocationData.map((item, index) => (
                <View key={item.id} style={styles.allocationItem}>
                  <View style={styles.allocationLeft}>
                    <View style={[styles.allocationDot, { backgroundColor: getColorForIndex(index) }]} />
                    <Text style={styles.allocationLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.allocationValue}>{item.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {assets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start Building Your Portfolio</Text>
            <Text style={styles.emptyDescription}>
              Add your first investment to start tracking your wealth in one place
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push('/add-asset')}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.card} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getColorForIndex(index: number): string {
  const colors = [Colors.accent, '#00C853', '#FF9500', '#FF3B30', '#9C27B0', '#00BCD4'];
  return colors[index % colors.length];
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  label: {
    ...typography.subhead,
    color: Colors.text.secondary,
    marginBottom: spacing.sm,
  },
  heroValue: {
    ...typography.hero,
    color: Colors.text.primary,
    marginBottom: spacing.xs,
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  performance: {
    ...typography.title3,
  },
  performancePercent: {
    ...typography.body,
  },
  positive: {
    color: Colors.success,
  },
  negative: {
    color: Colors.error,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: Colors.background,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.accent,
  },
  dateRangeText: {
    ...typography.footnote,
    color: Colors.text.secondary,
    fontWeight: '500' as const,
  },
  dateRangeTextActive: {
    color: Colors.card,
    fontWeight: '600' as const,
  },
  chart: {
    marginVertical: spacing.sm,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    ...typography.callout,
    color: Colors.text.tertiary,
  },
  allocationCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.title3,
    color: Colors.text.primary,
    marginBottom: spacing.md,
  },
  allocationBars: {
    marginBottom: spacing.lg,
  },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    gap: 2,
  },
  bar: {
    height: '100%',
  },
  allocationList: {
    gap: spacing.md,
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allocationDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
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
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fingerprintCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.accent + '20',
  },
  fingerprintIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintContent: {
    flex: 1,
  },
  fingerprintTitle: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  fingerprintDescription: {
    ...typography.caption,
    color: Colors.text.secondary,
  },
});
