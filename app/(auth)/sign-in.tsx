import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, ArrowRight, Smartphone } from "lucide-react-native";
import Colors from "@/constants/colors";
import { spacing, borderRadius } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import GradientBackground from "@/components/GradientBackground";

let useSignIn: any = null;
let useOAuth: any = null;
try {
  const clerk = require("@clerk/clerk-expo");
  useSignIn = clerk.useSignIn;
  useOAuth = clerk.useOAuth;
} catch {}

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");

  const signInHook = useSignIn?.();
  const signIn = signInHook?.signIn;
  const setActive = signInHook?.setActive;
  const isLoaded = signInHook?.isLoaded ?? false;

  const handleEmailSignIn = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!signIn || !isLoaded) {
      setError("Authentication not configured. Please add Clerk keys.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        strategy: "email_link",
        redirectUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/sso-callback`,
      });

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }, [email, signIn, isLoaded]);

  const handleOAuthSignIn = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      if (!isLoaded) {
        setError("Authentication not configured. Please add Clerk keys.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const oauthFlow = useOAuth?.({ strategy });
        if (oauthFlow?.startOAuthFlow) {
          const { createdSessionId, setActive: oauthSetActive } = await oauthFlow.startOAuthFlow();
          if (createdSessionId && oauthSetActive) {
            await oauthSetActive({ session: createdSessionId });
            router.replace("/(tabs)/home");
          }
        }
      } catch (err: any) {
        setError(err.errors?.[0]?.message || "OAuth sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, router]
  );

  if (magicLinkSent) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.content}>
          <View style={styles.sentCard}>
            <Mail size={48} color={Colors.accent} strokeWidth={1.5} />
            <Text style={styles.sentTitle}>Check your email</Text>
            <Text style={styles.sentDescription}>
              We sent a magic link to{"\n"}
              <Text style={styles.sentEmail}>{email}</Text>
            </Text>
            <Text style={styles.sentHint}>Tap the link in your email to sign in</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setMagicLinkSent(false)}
            >
              <Text style={styles.secondaryButtonText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your portfolio</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => handleOAuthSignIn("oauth_apple")}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.oauthIcon}></Text>
              <Text style={styles.oauthButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => handleOAuthSignIn("oauth_google")}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.oauthIcon}>G</Text>
              <Text style={styles.oauthButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.text.secondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleEmailSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send Magic Link</Text>
                  <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 40,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title1,
    color: Colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  form: {
    gap: spacing.md,
    marginBottom: 40,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  oauthIcon: {
    fontSize: 20,
    color: Colors.text.primary,
    fontWeight: "600" as const,
  },
  oauthButtonText: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    ...typography.footnote,
    color: Colors.text.tertiary,
    textTransform: "uppercase" as const,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    paddingVertical: 14,
  },
  errorText: {
    ...typography.footnote,
    color: Colors.error,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...typography.headline,
    color: "#FFFFFF",
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: "600" as const,
  },
  sentCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sentTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    textAlign: "center",
  },
  sentDescription: {
    ...typography.body,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  sentEmail: {
    color: Colors.accent,
    fontWeight: "600" as const,
  },
  sentHint: {
    ...typography.footnote,
    color: Colors.text.tertiary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    ...typography.callout,
    color: Colors.text.secondary,
  },
  footerLink: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: "600" as const,
  },
});
