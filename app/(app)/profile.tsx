import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  background: "#000000",
  surface: "#171717",
  border: "#2B2B2E",
  text: "#FFFFFF",
  secondaryText: "#929298",
  red: "#FF6259",
};

export default function SettingsScreen() {
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Unable to sign out", error.message);
      return;
    }

    router.replace("/(auth)");
  }

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You’ll need to sign in again to access your habits.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Text style={styles.subtitle}>Manage your account.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
          onPress={confirmSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 22,
    paddingTop: 66,
  },

  header: {
    alignItems: "flex-start",
  },

  eyebrow: {
    marginBottom: 7,
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: COLORS.secondaryText,
    fontSize: 15,
  },

  card: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  sectionLabel: {
    marginBottom: 16,
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.2,
  },

  signOutButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.red,
  },

  signOutButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.98 }],
  },

  signOutText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: "700",
  },
});
