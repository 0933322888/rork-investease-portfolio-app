import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';

const { width } = Dimensions.get('window');

const screens = [
  {
    title: 'All your investments\nin one place',
    description: 'Track stocks, crypto, real estate, and more. No matter where they are.',
  },
  {
    title: 'Clear insights\nat a glance',
    description: 'Understand your portfolio allocation and performance instantly.',
  },
  {
    title: 'Monitor,\nnot trade',
    description: 'Focus on the big picture. This is your clarity dashboard, not a trading platform.',
  },
];

function IndicatorDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? 32 : 8, { duration: 300 }),
      opacity: withTiming(isActive ? 1 : 0.3, { duration: 300 }),
    };
  });

  return <Animated.View style={[styles.indicatorDot, animatedStyle]} />;
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const { completeOnboarding } = usePortfolio();

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/home');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.indicator}>
          {screens.map((_, index) => (
            <IndicatorDot key={index} isActive={index === currentIndex} />
          ))}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{screens[currentIndex].title}</Text>
          <Text style={styles.description}>{screens[currentIndex].description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === screens.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={20} color={Colors.card} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  indicator: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  indicatorDot: {
    height: 8,
    backgroundColor: Colors.accent,
    borderRadius: borderRadius.full,
  },
  textContainer: {
    gap: spacing.lg,
  },
  title: {
    ...typography.hero,
    color: Colors.text.primary,
  },
  description: {
    ...typography.body,
    color: Colors.text.secondary,
    maxWidth: width * 0.8,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    ...typography.headline,
    color: Colors.card,
  },
});
