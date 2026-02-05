import { router } from 'expo-router';
import { ArrowRight, TrendingUp, PieChart, Eye, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';

const { width, height } = Dimensions.get('window');

const screens = [
  {
    title: 'All your investments\nin one place',
    description: 'Track stocks, crypto, real estate, and more. No matter where they are.',
    icon: TrendingUp,
    color: '#007AFF',
    bgGradient: ['#E8F4FD', '#F0F8FF'],
  },
  {
    title: 'Clear insights\nat a glance',
    description: 'Understand your portfolio allocation and performance instantly.',
    icon: PieChart,
    color: '#34C759',
    bgGradient: ['#E8F8ED', '#F0FFF4'],
  },
  {
    title: 'Monitor,\nnot trade',
    description: 'Focus on the big picture. This is your clarity dashboard, not a trading platform.',
    icon: Eye,
    color: '#AF52DE',
    bgGradient: ['#F5E8FD', '#FAF0FF'],
  },
];

function IndicatorDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 28 : 8, { damping: 15, stiffness: 150 }),
      opacity: withTiming(isActive ? 1 : 0.3, { duration: 200 }),
      backgroundColor: withTiming(isActive ? Colors.accent : Colors.text.tertiary, { duration: 200 }),
    };
  });

  return <Animated.View style={[styles.indicatorDot, animatedStyle]} />;
}

function IllustrationCircle({ icon: Icon, color }: { icon: any; color: string }) {
  return (
    <View style={[styles.illustrationContainer, { backgroundColor: color + '15' }]}>
      <View style={[styles.illustrationInner, { backgroundColor: color + '25' }]}>
        <View style={[styles.illustrationCenter, { backgroundColor: color }]}>
          <Icon size={48} color="#FFFFFF" strokeWidth={1.5} />
        </View>
      </View>
      <View style={[styles.floatingDot, styles.dot1, { backgroundColor: color }]} />
      <View style={[styles.floatingDot, styles.dot2, { backgroundColor: color + '60' }]} />
      <View style={[styles.floatingDot, styles.dot3, { backgroundColor: color + '40' }]} />
    </View>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const { completeOnboarding } = usePortfolio();
  const currentScreen = screens[currentIndex];

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/home');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Sparkles size={20} color={Colors.accent} />
          <Text style={styles.logoText}>InvestEase</Text>
        </View>
        {currentIndex < screens.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Animated.View 
          key={currentIndex}
          entering={FadeIn.duration(400)}
          style={styles.illustrationWrapper}
        >
          <IllustrationCircle icon={currentScreen.icon} color={currentScreen.color} />
        </Animated.View>

        <View style={styles.textSection}>
          <View style={styles.indicator}>
            {screens.map((_, index) => (
              <IndicatorDot key={index} isActive={index === currentIndex} />
            ))}
          </View>

          <Animated.View 
            key={`text-${currentIndex}`}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.textContainer}
          >
            <Text style={styles.title}>{currentScreen.title}</Text>
            <Text style={styles.description}>{currentScreen.description}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentScreen.color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === screens.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </SafeAreaView>
  );
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    ...typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  illustrationWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  illustrationContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationInner: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCenter: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  floatingDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  dot1: {
    width: 12,
    height: 12,
    top: '15%',
    right: '20%',
  },
  dot2: {
    width: 20,
    height: 20,
    bottom: '25%',
    left: '10%',
  },
  dot3: {
    width: 8,
    height: 8,
    top: '40%',
    left: '15%',
  },
  textSection: {
    paddingBottom: spacing.lg,
  },
  indicator: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  indicatorDot: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  textContainer: {
    gap: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  description: {
    ...typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    maxWidth: width * 0.85,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsText: {
    ...typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
