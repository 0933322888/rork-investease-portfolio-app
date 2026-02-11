import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Info, Mail, Shield, ChevronRight, Crown, Link, RefreshCw, Building2, Briefcase, Lock, Sparkles, Trash2, LogOut, User, Bitcoin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

let useAuth: any = null;
let useUser: any = null;
try {
  const clerk = require("@clerk/clerk-expo");
  useAuth = clerk.useAuth;
  useUser = clerk.useUser;
} catch {}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: string;
  locked?: boolean;
  destructive?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, badge, locked, destructive }: SettingItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.settingItem, locked && styles.settingItemLocked]} 
      onPress={locked ? undefined : onPress} 
      activeOpacity={locked ? 1 : 0.7}
      disabled={locked}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconContainer, locked && styles.settingIconLocked]}>{icon}</View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, locked && styles.settingTitleLocked, destructive && styles.settingTitleDestructive]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {locked ? (
          <Lock size={18} color={Colors.text.tertiary} />
        ) : (
          <ChevronRight size={20} color={Colors.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function UserProfileCard({ isPremium, onPress }: { isPremium: boolean; onPress?: () => void }) {
  const userHook = useUser?.();
  const user = userHook?.user;
  const isLoaded = userHook?.isLoaded ?? false;

  if (!useUser || !isLoaded || !user) {
    return (
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarPlaceholder}>
          <User size={32} color={Colors.text.tertiary} strokeWidth={1.5} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Guest User</Text>
          <Text style={styles.profileEmail}>Not signed in</Text>
        </View>
      </View>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const email = user.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user.imageUrl;

  return (
    <TouchableOpacity style={styles.profileCard} onPress={onPress} activeOpacity={0.7}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
      ) : (
        <View style={styles.profileAvatarPlaceholder}>
          <Text style={styles.profileAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.profileInfo}>
        <View style={styles.profileNameRow}>
          <Text style={styles.profileName}>{displayName}</Text>
          {isPremium && (
            <View style={styles.profilePremiumBadge}>
              <Crown size={12} color="#FFFFFF" fill={Colors.accent} strokeWidth={2} />
              <Text style={styles.profilePremiumText}>PRO</Text>
            </View>
          )}
        </View>
        {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
      </View>
      <ChevronRight size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { plaidAccounts, refreshPlaidBalances, removeAllPlaidAccounts } = usePortfolio();
  const { isPremium } = useSubscription();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const authHook = useAuth?.();
  const signOut = authHook?.signOut;
  const isSignedIn = authHook?.isSignedIn ?? false;

  const handleConnectBank = () => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    router.push('/connect-plaid');
  };

  const handleConnectBrokerage = () => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    router.push('/connect-snaptrade');
  };

  const handleConnectCrypto = () => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    router.push('/connect-coinbase');
  };

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    try {
      await refreshPlaidBalances();
      Alert.alert('Success', 'Account balances refreshed');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh balances. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveConnections = () => {
    Alert.alert(
      'Remove All Connections',
      'Are you sure you want to remove all connected accounts? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            await removeAllPlaidAccounts();
            Alert.alert('Success', 'All connections removed');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (signOut) {
                await signOut();
              }
              router.replace("/(auth)/sign-in" as any);
            } catch (err) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    router.push('/premium');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Configure your notification preferences');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Your data is stored locally and never shared');
  };

  const handleAbout = () => {
    Alert.alert('About', 'Assetra v1.0.0\nBuilt with clarity and care');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Need help? Contact us at support@assetra.app');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        <View style={styles.section}>
          <View style={styles.settingGroup}>
            <UserProfileCard isPremium={isPremium} onPress={() => router.push('/profile-edit')} />
          </View>
        </View>

        {!isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.settingGroup}>
              <SettingItem
                icon={<Crown size={22} color={Colors.accent} strokeWidth={2} />}
                title="Upgrade to Premium"
                subtitle="Unlock advanced insights"
                onPress={handleUpgrade}
                badge="Pro"
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInRow]}>Connected Accounts</Text>
            {!isPremium && (
              <View style={styles.premiumBadge}>
                <Sparkles size={14} color={Colors.accent} strokeWidth={2} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={<Building2 size={22} color={!isPremium ? Colors.text.tertiary : Colors.accent} strokeWidth={2} />}
              title="Connect Bank (Plaid)"
              subtitle="Link bank accounts for balance tracking"
              onPress={handleConnectBank}
              locked={!isPremium}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Briefcase size={22} color={!isPremium ? Colors.text.tertiary : Colors.primary} strokeWidth={2} />}
              title="Connect Brokerage (SnapTrade)"
              subtitle="Alpaca, Webull, Trading 212 & more"
              onPress={handleConnectBrokerage}
              locked={!isPremium}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Bitcoin size={22} color={!isPremium ? Colors.text.tertiary : '#F5B14C'} strokeWidth={2} />}
              title="Connect Crypto (Coinbase)"
              subtitle="Track your crypto portfolio balances"
              onPress={handleConnectCrypto}
              locked={!isPremium}
            />
            {plaidAccounts.length > 0 && isPremium && (
              <>
                <View style={styles.separator} />
                <SettingItem
                  icon={
                    <RefreshCw
                      size={22}
                      color={isRefreshing ? Colors.text.tertiary : Colors.text.primary}
                      strokeWidth={2}
                    />
                  }
                  title="Refresh Balances"
                  subtitle={`${plaidAccounts.length} account${plaidAccounts.length > 1 ? 's' : ''} connected`}
                  onPress={handleRefreshBalances}
                />
                <View style={styles.separator} />
                <SettingItem
                  icon={<Trash2 size={22} color={Colors.error} strokeWidth={2} />}
                  title="Remove All Connections"
                  subtitle="Disconnect all linked accounts"
                  onPress={handleRemoveConnections}
                />
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={<Bell size={22} color={Colors.text.primary} strokeWidth={2} />}
              title="Notifications"
              subtitle="Manage alerts and updates"
              onPress={handleNotifications}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={<Shield size={22} color={Colors.text.primary} strokeWidth={2} />}
              title="Privacy & Security"
              subtitle="Your data stays on your device"
              onPress={handlePrivacy}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Mail size={22} color={Colors.text.primary} strokeWidth={2} />}
              title="Support"
              subtitle="Get help and feedback"
              onPress={handleSupport}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Info size={22} color={Colors.text.primary} strokeWidth={2} />}
              title="About"
              subtitle="App version and info"
              onPress={handleAbout}
            />
          </View>
        </View>

        {isSignedIn && (
          <View style={styles.section}>
            <View style={styles.settingGroup}>
              <SettingItem
                icon={<LogOut size={22} color={Colors.error} strokeWidth={2} />}
                title="Sign Out"
                subtitle="Sign out of your account"
                onPress={handleSignOut}
                destructive
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with care for clarity</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
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
    paddingTop: spacing.lg,
  },
  pageTitle: {
    ...typography.title1,
    color: Colors.text.primary,
    marginBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardSoft,
  },
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profilePremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  profilePremiumText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileName: {
    ...typography.headline,
    color: Colors.text.primary,
    fontSize: 18,
  },
  profileEmail: {
    ...typography.callout,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitleInRow: {
    marginBottom: 0,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  premiumBadgeText: {
    ...typography.footnote,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  settingGroup: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  settingTitleLocked: {
    color: Colors.text.tertiary,
  },
  settingTitleDestructive: {
    color: Colors.error,
  },
  settingItemLocked: {
    opacity: 0.7,
    pointerEvents: 'none',
  },
  settingIconLocked: {
    backgroundColor: Colors.border.light,
  },
  settingSubtitle: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.footnote,
    color: Colors.text.tertiary,
  },
  footerVersion: {
    ...typography.caption,
    color: Colors.text.tertiary,
  },
});
