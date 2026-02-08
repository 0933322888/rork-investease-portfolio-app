import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Landmark, TrendingUp, Bitcoin, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { AccountCard, AddAccountCard } from './AccountCard';

interface ConnectedAccount {
  id: string;
  institution: string;
  badge: string;
  balance: number;
  dailyChangePercent: number;
  color: string;
}

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  {
    id: '1',
    institution: 'Wealthsimple',
    badge: 'Broker',
    balance: 24500,
    dailyChangePercent: 1.2,
    color: Colors.stocks,
  },
  {
    id: '2',
    institution: 'TD Bank',
    badge: 'Bank',
    balance: 8200,
    dailyChangePercent: 0.1,
    color: Colors.cash,
  },
  {
    id: '3',
    institution: 'Coinbase',
    badge: 'Crypto',
    balance: 5100,
    dailyChangePercent: -2.4,
    color: Colors.crypto,
  },
  {
    id: '4',
    institution: 'Rental Property',
    badge: 'Real Estate',
    balance: 310000,
    dailyChangePercent: 0.3,
    color: Colors.realEstate,
  },
];

const ACCOUNT_OPTIONS = [
  {
    id: 'bank',
    label: 'Bank Account',
    description: 'Connect via Plaid',
    icon: Landmark,
    color: Colors.cash,
    route: '/connect-plaid',
  },
  {
    id: 'broker',
    label: 'Brokerage',
    description: 'Connect via SnapTrade',
    icon: TrendingUp,
    color: Colors.stocks,
    route: '/connect-snaptrade',
  },
  {
    id: 'crypto',
    label: 'Crypto Exchange',
    description: 'Connect via Coinbase',
    icon: Bitcoin,
    color: Colors.crypto,
    route: '/connect-coinbase',
  },
];

export default function ConnectedAccountsSection() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAccountPress = (account: ConnectedAccount) => {
  };

  const handleAddPress = () => {
    setModalVisible(true);
  };

  const handleOptionPress = (route: string) => {
    setModalVisible(false);
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const handleSeeAll = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connected Accounts</Text>
        <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {Platform.OS === 'web' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row' as const,
            overflowX: 'auto' as const,
            scrollbarWidth: 'none' as const,
            WebkitOverflowScrolling: 'touch' as const,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            gap: spacing.md,
          }}
        >
          {MOCK_ACCOUNTS.map((account, index) => (
            <AccountCard
              key={account.id}
              name={account.id}
              institution={account.institution}
              badge={account.badge}
              balance={account.balance}
              dailyChange={account.dailyChangePercent}
              color={account.color}
              delay={index * 80}
              onPress={() => handleAccountPress(account)}
              noMargin
            />
          ))}
          <AddAccountCard
            delay={MOCK_ACCOUNTS.length * 80}
            onPress={handleAddPress}
          />
        </div>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {MOCK_ACCOUNTS.map((account, index) => (
            <AccountCard
              key={account.id}
              name={account.id}
              institution={account.institution}
              badge={account.badge}
              balance={account.balance}
              dailyChange={account.dailyChangePercent}
              color={account.color}
              delay={index * 80}
              onPress={() => handleAccountPress(account)}
            />
          ))}
          <AddAccountCard
            delay={MOCK_ACCOUNTS.length * 80}
            onPress={handleAddPress}
          />
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7} style={styles.closeButton}>
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose the type of account to connect</Text>

            <View style={styles.optionsList}>
              {ACCOUNT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionRow}
                    activeOpacity={0.7}
                    onPress={() => handleOptionPress(option.route)}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                      <Icon size={22} color={option.color} />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title3,
    color: Colors.text.primary,
  },
  seeAll: {
    ...typography.body,
    color: Colors.accent,
  },
  scrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.title3,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: Colors.text.secondary,
    marginBottom: spacing.lg,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: Colors.cardSoft,
    borderRadius: 16,
    gap: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
