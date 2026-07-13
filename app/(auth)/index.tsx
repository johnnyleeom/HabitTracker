import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function LogInScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Habit Tracker</Text>
          </View>

          <Text style={styles.title}>Hello</Text>

          <Text style={styles.subtitle}>
            Welcome! Manage your daily habits.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <View style={styles.primaryButton}>
            <Button
              title={"Sign In"}
              color="#ffffff"
              onPress={() => {
                router.push("/(auth)/signInPage");
              }}
            />
          </View>

          <View style={styles.secondaryButton}>
            <Button title={"Sign Up"} color="#5b50c8" onPress={() => {}} />
          </View>

          {/* Start of --- or --- divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />

            <Text style={styles.dividerText}>or continue with</Text>

            <View style={styles.dividerLine} />
          </View>
          {/* End of --- or --- divider */}

          <View style={styles.socialButtonContainer}>
            <View style={styles.socialButton}>
              <Button title={"Google"} color="#333333" />
            </View>

            <View style={styles.socialButton}>
              <Button title={"Apple"} color="#333333" />
            </View>
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
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 60,
  },

  topSection: {
    alignItems: "center",
  },

  imagePlaceholder: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#f0efff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  imagePlaceholderText: {
    color: "#5b50c8",
    fontSize: 18,
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

  buttonSection: {
    width: "100%",
  },

  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#5b50c8",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },

  secondaryButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#5b50c8",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    overflow: "hidden",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d2d2d7",
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#86868b",
  },

  socialButtonContainer: {
    flexDirection: "row",
    gap: 12,
  },

  socialButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#d2d2d7",
    borderRadius: 14,
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
});
