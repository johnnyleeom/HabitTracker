import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const COLORS = {
  background: "#000000",
  surface: "#171717",
  surfaceRaised: "#1D1D1F",
  border: "#2B2B2E",
  text: "#FFFFFF",
  secondaryText: "#929298",
  mutedText: "#5E5E63",
  green: "#61D157",
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled =
    !email.trim() || !password || !confirmPassword || isLoading;

  async function handleSignUp() {
    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure both passwords are the same.",
      );
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert("Sign-up failed", error.message);
      console.log(error);
      return;
    }

    router.replace("/(app)");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.logo}>
            <View style={styles.logoDot} />
            <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
          </View>

          <Text style={styles.title}>Create account</Text>

          <Text style={styles.subtitle}>
            Start building and tracking your daily habits.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>EMAIL</Text>

          <TextInput
            placeholder="Enter your email"
            placeholderTextColor={COLORS.mutedText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>PASSWORD</Text>

          <TextInput
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.mutedText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>

          <TextInput
            placeholder="Enter your password again"
            placeholderTextColor={COLORS.mutedText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            onSubmitEditing={() => {
              if (!isDisabled) {
                void handleSignUp();
              }
            }}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              isDisabled && styles.disabledButton,
              pressed && !isDisabled && styles.buttonPressed,
            ]}
            onPress={() => void handleSignUp()}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.primaryButtonText,
                isDisabled && styles.disabledButtonText,
              ]}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account?</Text>

          <Pressable
            onPress={() => router.replace("/(auth)/signInPage")}
            hitSlop={8}
          >
            <Text style={styles.signInLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 22,
  },

  content: {
    flex: 1,
    paddingTop: 105,
    paddingBottom: 30,
  },

  topSection: {
    alignItems: "flex-start",
    marginBottom: 28,
  },

  eyebrow: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
  },

  subtitle: {
    maxWidth: 310,
    marginTop: 10,
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 22,
  },

  formCard: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  inputLabel: {
    marginBottom: 9,
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },

  input: {
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 18,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 16,
  },

  primaryButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    backgroundColor: COLORS.text,
    borderRadius: 18,
  },

  disabledButton: {
    backgroundColor: COLORS.surfaceRaised,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "800",
  },

  disabledButtonText: {
    color: COLORS.mutedText,
  },

  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 6,
  },

  signInText: {
    color: COLORS.secondaryText,
    fontSize: 14,
  },

  signInLink: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  logoDot: {
    width: 8,
    height: 8,
    marginRight: 9,
    backgroundColor: COLORS.green,
    borderRadius: 4,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  logo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
});
