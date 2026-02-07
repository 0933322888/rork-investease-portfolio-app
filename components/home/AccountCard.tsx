import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface AccountCardProps {
  name: string;
  institution: string;
  badge: string;
  balance: number;
  dailyChange: number;
  color: string;
  delay?: number;
  onPress?: () => void;
}

function AnimatedWrapper({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function AccountCard({ name, institution, badge, balance, dailyChange, color, delay = 0, onPress }: AccountCardProps) {
  const isPositive = dailyChange >= 0;
  const changePercent = Math.abs(dailyChange);

  return (
    <AnimatedWrapper delay={delay}>
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Text style={[styles.logoText, { color }]}>{institution.charAt(0)}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.accountName} numberOfLines={1}>{institution}</Text>
        <View style={styles.bottomSection}>
          <Text style={styles.balance}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.dailyChange, { color: isPositive ? Colors.positive : Colors.negative }]}>
            {isPositive ? '+' : '-'}{changePercent.toFixed(1)}%
          </Text>
        </View>
      </TouchableOpacity>
    </AnimatedWrapper>
  );
}

export function AddAccountCard({ delay = 0, onPress }: { delay?: number; onPress?: () => void }) {
  return (
    <AnimatedWrapper delay={delay}>
      <TouchableOpacity style={styles.addCard} activeOpacity={0.7} onPress={onPress}>
        <Plus size={32} color={Colors.accent} />
        <Text style={styles.addText}>Add account</Text>
      </TouchableOpacity>
    </AnimatedWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 110,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: Colors.cardSoft,
    justifyContent: 'space-between',
    marginRight: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bottomSection: {},
  balance: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dailyChange: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addCard: {
    width: 180,
    height: 110,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent,
  },
});
