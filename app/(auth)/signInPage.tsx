import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isDisabled = !email.trim() || !password;

  async function handleUserSignIn() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password.",
      );
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.log(error.message);
      Alert.alert("Login failed", "Incorrect email or password.");
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

          <Text style={styles.title}>Welcome back</Text>

          <Text style={styles.subtitle}>
            Sign in to continue tracking your habits.
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
            placeholder="Enter your password"
            placeholderTextColor="#a1a1a6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <View
            style={[styles.primaryButton, isDisabled && styles.disabledButton]}
          >
            <Button
              title="Sign In"
              color="#ffffff"
              onPress={handleUserSignIn}
              disabled={!email.trim() || !password}
            />
          </View>

          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don&apos;t have an account?</Text>

            <Text
              style={styles.signUpLink}
              onPress={() => router.push("/(auth)/signUpPage")}
            >
              Sign Up
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
    paddingTop: 80,
  },

  topSection: {
    alignItems: "center",
    marginBottom: 45,
  },

  imagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#f0efff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 26,
  },

  imagePlaceholderText: {
    color: "#5b50c8",
    fontSize: 16,
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
    marginBottom: 18,
  },

  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#5b50c8",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 6,
  },

  disabledButton: {
    backgroundColor: "#b8b3e3",
  },

  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    gap: 5,
  },

  signUpText: {
    fontSize: 14,
    color: "#86868b",
  },

  signUpLink: {
    fontSize: 14,
    color: "#5b50c8",
    fontWeight: "600",
  },
});
