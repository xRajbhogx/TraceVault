import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo/legacy";
import { Link, useRouter } from "expo-router";
import { colors } from "../../constants/colors";

export default function LoginScreen() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    if (!emailAddress.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password: password.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/HomeScreen");
      } else {
        setError("Sign-in could not be completed. Please try again.");
        console.error("Sign-in not complete:", result);
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "errors" in err &&
        Array.isArray((err as { errors: Array<{ message: string }> }).errors)
      ) {
        const clerkErr = (err as { errors: Array<{ message: string }> })
          .errors[0];
        setError(clerkErr?.message ?? "Sign-in failed.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error("Sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoIcon}>
              <Ionicons
                name="shield-checkmark"
                size={36}
                color={colors.accent}
              />
            </View>
            <Text style={styles.appName}>TraceVault</Text>
            <Text style={styles.tagline}>
              Secure your evidence. Protect your truth.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.heading}>Sign in</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.inputPlaceholder}
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/SignUpScreen" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: "center",
    gap: 32,
  },
  logoArea: {
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerMuted,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  signInButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
  },
});
