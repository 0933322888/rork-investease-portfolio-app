import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Bitcoin, Gem, Receipt, Home, Wallet, ChevronRight, Pencil, Trash2, TrendingDown, DollarSign, BarChart3, Banknote, Building2, Coins, PiggyBank } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ASSET_TYPES, AssetType } from '@/types/assets';
import { Asset } from '@/types/assets';

const ICONS = {
  TrendingUp,
  Bitcoin,
  Gem,
  Receipt,
  Home,
  Wallet,
};

const ASSET_ICONS: Record<AssetType, any> = {
  stocks: TrendingUp,
  crypto: Bitcoin,
  commodities: Gem,
  'fixed-income': Receipt,
  'real-estate': Building2,
  cash: Banknote,
};

const SPARKLINE_WIDTH = 48;
const SPARKLINE_HEIGHT = 24;

function MiniSparkline({ isPositive, seed }: { isPositive: boolean; seed: number }) {
  const data = useMemo(() => {
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    
    const points: number[] = [];
    let value = 50;
    for (let i = 0; i < 7; i++) {
      const change = (random(seed + i) - 0.5) * 20;
      value = Math.max(10, Math.min(90, value + change));
      points.push(value);
    }
    
    if (isPositive) {
      points[points.length - 1] = Math.max(points[points.length - 1], points[0] + 10);
    } else {
      points[points.length - 1] = Math.min(points[points.length - 1], points[0] - 10);
    }
    
    return points;
  }, [isPositive, seed]);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pathPoints = data.map((value, index) => {
    const x = (index / (data.length - 1)) * SPARKLINE_WIDTH;
    const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT;
    return `${x},${y}`;
  });

  const pathData = `M ${pathPoints.join(' L ')}`;
  const color = isPositive ? Colors.success : Colors.error;

  return (
    <Svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT}>
      <Path
        d={pathData}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface AssetItemProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

function AssetItem({ asset, onEdit, onDelete }: AssetItemProps) {
  const value = asset.quantity * asset.currentPrice;
  const cost = asset.quantity * asset.purchasePrice;
  const gain = value - cost;
  const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
  const isPositive = gain >= 0;

  const IconComponent = ASSET_ICONS[asset.type] || TrendingUp;
  const sparklineSeed = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const handlePress = () => {
    Alert.alert(
      asset.name,
      `Value: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => onEdit(asset) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(asset) },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.assetItem} activeOpacity={0.7} onPress={handlePress}>
      <View style={styles.assetLeft}>
        <View style={styles.assetIconSmall}>
          <IconComponent size={16} color={Colors.text.secondary} strokeWidth={2} />
        </View>
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{asset.name}</Text>
          {asset.symbol && <Text style={styles.assetSymbol}>{asset.symbol}</Text>}
        </View>
      </View>
      <View style={styles.assetMiddle}>
        <MiniSparkline isPositive={isPositive} seed={sparklineSeed} />
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetValue}>
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.assetGain, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen() {
  const router = useRouter();
  const { assetsByType, deleteAsset, totalValue, totalGain, totalGainPercent, assets } = usePortfolio();

  const groupsWithAssets = ASSET_TYPES.filter((type) => assetsByType[type.id].length > 0);
  const isPositive = totalGain >= 0;

  const handleEditAsset = (asset: Asset) => {
    router.push({ pathname: '/edit-asset', params: { id: asset.id } });
  };

  const handleDeleteAsset = (asset: Asset) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAsset(asset.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupsWithAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Assets Yet</Text>
            <Text style={styles.emptyDescription}>
              Start adding your investments to see them organized here
            </Text>
          </View>
        ) : (
          <View style={styles.groups}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
                <View style={[styles.changeIndicator, isPositive ? styles.changePositive : styles.changeNegative]}>
                  {isPositive ? (
                    <TrendingUp size={14} color={Colors.success} strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={14} color={Colors.error} strokeWidth={2.5} />
                  )}
                  <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                    {isPositive ? '+' : ''}{totalGainPercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryValue}>
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.summaryFooter}>
                <Text style={[styles.summaryGain, isPositive ? styles.positive : styles.negative]}>
                  {isPositive ? '+' : ''}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} all time
                </Text>
                <Text style={styles.summaryAssetCount}>
                  {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                </Text>
              </View>
            </View>
            {groupsWithAssets.map((type) => {
              const IconComponent = ICONS[type.icon as keyof typeof ICONS];
              const assets = assetsByType[type.id];
              const totalValue = assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);

              return (
                <View key={type.id} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupLeft}>
                      <View style={styles.groupIconContainer}>
                        <IconComponent size={20} color={Colors.accent} strokeWidth={2} />
                      </View>
                      <View>
                        <Text style={styles.groupTitle}>{type.label}</Text>
                        <Text style={styles.groupSubtitle}>{assets.length} {assets.length === 1 ? 'asset' : 'assets'}</Text>
                      </View>
                    </View>
                    <Text style={styles.groupValue}>
                      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.assetList}>
                    {assets.map((asset) => (
                      <AssetItem 
                        key={asset.id} 
                        asset={asset} 
                        onEdit={handleEditAsset}
                        onDelete={handleDeleteAsset}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
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
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
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
  groups: {
    gap: spacing.lg,
  },
  group: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  groupSubtitle: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  groupValue: {
    ...typography.title3,
    color: Colors.text.primary,
  },
  assetList: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  assetLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetIconSmall: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  assetMiddle: {
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  assetSymbol: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  assetRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  assetValue: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  assetGain: {
    ...typography.footnote,
    fontWeight: '600' as const,
  },
  positive: {
    color: Colors.success,
  },
  negative: {
    color: Colors.error,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.subhead,
    color: Colors.text.secondary,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  changePositive: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  changeNegative: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  changeText: {
    ...typography.footnote,
    fontWeight: '700' as const,
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryGain: {
    ...typography.callout,
    fontWeight: '600' as const,
  },
  summaryAssetCount: {
    ...typography.footnote,
    color: Colors.text.tertiary,
  },
});
