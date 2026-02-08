import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
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

export default function ConnectedAccountsSection() {
  const handleAccountPress = (account: ConnectedAccount) => {
    // stub: navigate to AccountDetails
  };

  const handleAddPress = () => {
    router.push('/connect-plaid');
  };

  const handleSeeAll = () => {
    // stub: navigate to AccountsList
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
});
