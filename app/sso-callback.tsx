import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { typography } from "@/constants/typography";
import GradientBackground from "@/components/GradientBackground";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { useSignIn, useSignUp } = require("@clerk/clerk-expo");
        const { signIn } = useSignIn();
        const { signUp } = useSignUp();

        if (signIn?.status === "complete") {
          router.replace("/(tabs)/home" as any);
          return;
        }
        if (signUp?.status === "complete") {
          router.replace("/(tabs)/home" as any);
          return;
        }
      } catch {}

      setTimeout(() => {
        router.replace("/(tabs)/home" as any);
      }, 2000);
    };

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  text: {
    ...typography.body,
    color: Colors.text.secondary,
  },
});
