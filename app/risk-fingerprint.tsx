import { router, Stack } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { calculateRiskFingerprint, RiskDimension } from '@/utils/riskFingerprint';

const { width } = Dimensions.get('window');
const CHART_SIZE = Math.min(width - spacing.lg * 4, 320);
const CENTER = CHART_SIZE / 2;
const MAX_RADIUS = CENTER - 60;

function RiskRadarChart({ dimensions }: { dimensions: RiskDimension[] }) {
  const scaleOpacity = useRef(new Animated.Value(0)).current;
  const dataOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(dataOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const angleStep = (Math.PI * 2) / dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * MAX_RADIUS;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = MAX_RADIUS + 24;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
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
    <View style={styles.chartContainer}>
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
              x1={CENTER}
              y1={CENTER}
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
              r={5}
              fill={Colors.accent}
            />
          );
        })}
      </Svg>

      {dimensions.map((dim, index) => {
        const labelPoint = getLabelPoint(index);
        const isTop = labelPoint.y < CENTER - 15;
        const isBottom = labelPoint.y > CENTER + 15;
        const isLeft = labelPoint.x < CENTER - 15;
        const isRight = labelPoint.x > CENTER + 15;

        let textAlign: 'left' | 'center' | 'right' = 'center';
        if (isLeft) textAlign = 'right';
        if (isRight) textAlign = 'left';

        let translateX = -48;
        if (isLeft) translateX = -96;
        if (isRight) translateX = 0;

        let translateY = -12;
        if (isTop) translateY = -30;
        if (isBottom) translateY = 4;

        return (
          <View
            key={index}
            style={[
              styles.label,
              {
                position: 'absolute',
                left: labelPoint.x,
                top: labelPoint.y,
                transform: [
                  { translateX },
                  { translateY },
                ],
              },
            ]}
          >
            <Text style={[styles.labelText, { textAlign }]} numberOfLines={2}>{dim.label}</Text>
            <Text style={[styles.scoreText, { textAlign }]}>{dim.score.toFixed(0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function RiskFingerprintScreen() {
  const { assets } = usePortfolio();
  const { isPremium } = useSubscription();
  const fingerprint = useMemo(() => calculateRiskFingerprint(assets), [assets]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio Fingerprint</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainCard}>
          <RiskRadarChart dimensions={fingerprint.dimensions} />
        </View>

        <View style={styles.interpretationCard}>
          <Text style={styles.interpretationText}>{fingerprint.interpretation}</Text>
        </View>

        {fingerprint.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {fingerprint.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}

        {!isPremium && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <Lock size={20} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.premiumTitle}>Unlock Detailed Analysis</Text>
            </View>
            <Text style={styles.premiumDescription}>
              Get deeper insights into each risk dimension, historical comparisons, and personalized recommendations
            </Text>
            <TouchableOpacity style={styles.premiumButton} activeOpacity={0.8} onPress={() => router.push('/premium' as any)}>
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dimensionsCard}>
          <Text style={styles.sectionTitle}>Risk Dimensions</Text>
          {fingerprint.dimensions.map((dim, index) => (
            <View key={dim.key} style={styles.dimensionItem}>
              <View style={styles.dimensionHeader}>
                <Text style={styles.dimensionLabel}>{dim.label}</Text>
                <Text style={styles.dimensionScore}>{dim.score.toFixed(0)}/100</Text>
              </View>
              <Text style={styles.dimensionDescription}>{dim.description}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
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

function getColorForScore(score: number): string {
  if (score > 70) return '#FF6B6B';
  if (score > 50) return '#F5B14C';
  if (score > 30) return '#FFCC00';
  return '#32D583';
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title2,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  mainCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  chartContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
  },
  label: {
    width: 96,
  },
  labelText: {
    ...typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  scoreText: {
    ...typography.caption,
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  interpretationCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  interpretationText: {
    ...typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  badgeText: {
    ...typography.caption,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  premiumCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: Colors.accent + '30',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  premiumTitle: {
    ...typography.title3,
    color: Colors.text.primary,
  },
  premiumDescription: {
    ...typography.callout,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  premiumButton: {
    backgroundColor: Colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  premiumButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  dimensionsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    marginBottom: spacing.lg,
  },
  dimensionItem: {
    marginBottom: spacing.lg,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dimensionLabel: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
    flex: 1,
  },
  dimensionScore: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  dimensionDescription: {
    ...typography.caption,
    color: Colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
