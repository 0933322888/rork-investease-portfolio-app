import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientBackground() {
  return (
    <LinearGradient
      colors={['#0B1220', '#101D35', '#0E1628', '#0B1220']}
      locations={[0, 0.35, 0.7, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
