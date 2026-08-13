import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#000000",
  surface: "#171717",
  border: "#2B2B2E",
  text: "#FFFFFF",
  secondaryText: "#929298",
  red: "#FF6259",
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function openPrivacyPolicy() {
  void Linking.openURL(
    "https://johnnyleeom.github.io/HabitTracker/privacy.html",
  );
}

function openSupportPage() {
  void Linking.openURL(
    "https://johnnyleeom.github.io/HabitTracker/support.html",
  );
}

export default function SettingsScreen() {
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDeleteAccount() {
    try {
      setIsDeleting(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Alert.alert(
          "Unable to delete account",
          "Your session has expired. Please sign in again.",
        );
        router.replace("/(auth)");
        return;
      }

      if (!API_URL) {
        Alert.alert(
          "Unable to delete account",
          "The server is not configured.",
        );
        return;
      }

      const response = await fetch(`${API_URL}/supabase/account_delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message ?? "Account deletion failed.");
      }

      await supabase.auth.signOut();

      router.replace("/(auth)");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting your account.";

      Alert.alert("Unable to delete account", message);
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, habits, and progress history. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            void handleDeleteAccount();
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
          disabled={isDeleting}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={confirmSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerLabel}>DANGER ZONE</Text>

        <Text style={styles.dangerDescription}>
          Permanently delete your account, habits, and progress history.
        </Text>

        <Pressable
          disabled={isDeleting}
          style={({ pressed }) => [
            styles.deleteButton,
            (pressed || isDeleting) && styles.buttonPressed,
          ]}
          onPress={confirmDeleteAccount}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.deleteText}>Delete Account</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.card, styles.linksCard]}>
        <Text style={styles.sectionLabel}>ABOUT</Text>

        <Pressable onPress={openPrivacyPolicy}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable onPress={openSupportPage}>
          <Text style={styles.linkText}>Support</Text>
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

  dangerCard: {
    marginTop: 16,
  },

  sectionLabel: {
    marginBottom: 16,
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.2,
  },

  dangerLabel: {
    marginBottom: 8,
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.2,
  },

  dangerDescription: {
    marginBottom: 16,
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },

  signOutButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.red,
  },

  deleteButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: COLORS.red,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.98 }],
  },

  signOutText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: "700",
  },

  deleteText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "800",
  },
  linksCard: {
    marginTop: 16,
  },

  linkText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
    backgroundColor: COLORS.border,
  },
});
