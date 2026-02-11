import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Fingerprint } from "lucide-react-native";
import Colors from "@/constants/colors";
import { spacing, borderRadius } from "@/constants/spacing";
import { typography } from "@/constants/typography";

interface AppLockOverlayProps {
  onUnlock: () => void;
}

export default function AppLockOverlay({ onUnlock }: AppLockOverlayProps) {
  if (Platform.OS === "web") return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Fingerprint size={48} color={Colors.accent} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Assetra is Locked</Text>
        <Text style={styles.subtitle}>Use biometrics to unlock</Text>
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={onUnlock}
          activeOpacity={0.8}
        >
          <Fingerprint size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  title: {
    ...typography.title2,
    color: Colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: Colors.text.secondary,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  unlockText: {
    ...typography.headline,
    color: "#FFFFFF",
  },
});
