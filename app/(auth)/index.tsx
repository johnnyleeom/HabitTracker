import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

export default function LogInScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>YOUR ROUTINE</Text>
          </View>

          <Text style={styles.title}>Build better habits.</Text>

          <Text style={styles.subtitle}>
            Track your routine, stay consistent, {"\n"}and be honest with
            yourself.
          </Text>
        </View>

        <View style={styles.visualCard}>
          <Text style={styles.visualEyebrow}>TODAY</Text>

          <Text style={styles.visualTitle}>Start is all you need.</Text>

          <Text style={styles.visualSubtitle}>
            Small actions become routines when you keep returning to them.
          </Text>

          <View style={styles.daysRow}>
            {Array.from({ length: 7 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dayDot,
                  index < 5 ? styles.dayDotActive : styles.dayDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(auth)/signInPage")}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(auth)/signUpPage")}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </Pressable>

          {/* <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {}}
            >
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {}}
            >
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
          </View> */}
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
    justifyContent: "space-between",
    paddingTop: 82,
    paddingBottom: 42,
  },

  topSection: {
    alignItems: "flex-start",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  brandDot: {
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

  brandText: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  title: {
    maxWidth: 330,
    color: COLORS.text,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1.4,
  },

  subtitle: {
    maxWidth: 320,
    marginTop: 12,
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 22,
  },

  visualCard: {
    padding: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  visualEyebrow: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  visualTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  visualSubtitle: {
    marginTop: 8,
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },

  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },

  dayDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  dayDotActive: {
    backgroundColor: COLORS.text,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  dayDotInactive: {
    backgroundColor: COLORS.surfaceRaised,
  },

  buttonSection: {
    width: "100%",
  },

  primaryButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.text,
    borderRadius: 18,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    marginHorizontal: 12,
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },

  socialButtonContainer: {
    flexDirection: "row",
    gap: 12,
  },

  socialButton: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  socialButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
