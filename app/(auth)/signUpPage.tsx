import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert("Sign-up failed", error.message);
      console.log(error);
      return;
    }

    console.log(data);
    router.replace("/(app)");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Habit Tracker</Text>
          </View>

          <Text style={styles.title}>Create account</Text>

          <Text style={styles.subtitle}>
            Start building and tracking your daily habits.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Email</Text>

          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#a1a1a6"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Password</Text>

          <TextInput
            placeholder="At least 6 characters"
            placeholderTextColor="#a1a1a6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Confirm password</Text>

          <TextInput
            placeholder="Enter your password again"
            placeholderTextColor="#a1a1a6"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <View
            style={[styles.primaryButton, isDisabled && styles.disabledButton]}
          >
            <Button
              title={isLoading ? "Creating Account..." : "Create Account"}
              color="#ffffff"
              onPress={handleSignUp}
              disabled={isDisabled}
            />
          </View>

          <View style={styles.signInRow}>
            <Text style={styles.signInText}>Already have an account?</Text>

            <Text
              style={styles.signInLink}
              onPress={() => router.push("/(auth)/signInPage")}
            >
              Sign In
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 28,
  },

  content: {
    flex: 1,
    paddingTop: 65,
  },

  topSection: {
    alignItems: "center",
    marginBottom: 36,
  },

  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0efff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  imagePlaceholderText: {
    color: "#5b50c8",
    fontSize: 15,
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1d1d1f",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#86868b",
    textAlign: "center",
  },

  formSection: {
    width: "100%",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#d2d2d7",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1d1d1f",
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },

  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#5b50c8",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 8,
  },

  disabledButton: {
    backgroundColor: "#b8b3e3",
  },

  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    gap: 5,
  },

  signInText: {
    fontSize: 14,
    color: "#86868b",
  },

  signInLink: {
    fontSize: 14,
    color: "#5b50c8",
    fontWeight: "600",
  },
});
