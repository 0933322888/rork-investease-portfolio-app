import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Bitcoin, Gem, Receipt, Home, Wallet, ChevronRight, Pencil, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ASSET_TYPES } from '@/types/assets';
import { Asset } from '@/types/assets';

const ICONS = {
  TrendingUp,
  Bitcoin,
  Gem,
  Receipt,
  Home,
  Wallet,
};

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
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{asset.name}</Text>
          {asset.symbol && <Text style={styles.assetSymbol}>{asset.symbol}</Text>}
        </View>
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
  const { assetsByType, deleteAsset } = usePortfolio();

  const groupsWithAssets = ASSET_TYPES.filter((type) => assetsByType[type.id].length > 0);

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
    paddingTop: 60,
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
  },
  assetInfo: {
    gap: spacing.xs,
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
});
