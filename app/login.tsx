import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Shield, Sparkles, BarChart3, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: BarChart3,
    title: 'Track Everything',
    description: 'Stocks, crypto, real estate, and more — all in one place',
    color: '#6C8CFF',
  },
  {
    icon: TrendingUp,
    title: 'Live Prices',
    description: 'Real-time market data for your entire portfolio',
    color: '#32D583',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your financial data stays safe and encrypted',
    color: '#F5B14C',
  },
  {
    icon: Sparkles,
    title: 'Smart Insights',
    description: 'AI-powered recommendations to grow your wealth',
    color: '#9B8FFF',
  },
];

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>
            Your investment portfolio,{'\n'}beautifully organized
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '15' }]}>
                  <Icon size={20} color={feature.color} strokeWidth={2} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8} onPress={login}>
            <Text style={styles.loginButtonText}>Get Started</Text>
            <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>Free to use. No credit card required.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.lg,
  },
  logoImage: {
    width: 160,
    height: 46,
  },
  tagline: {
    ...typography.title2,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  featuresSection: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    ...typography.callout,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  featureDescription: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  ctaSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    gap: spacing.sm,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  ctaSubtext: {
    ...typography.footnote,
    color: Colors.text.tertiary,
  },
});
