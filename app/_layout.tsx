import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/utils/supabase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import "react-native-reanimated";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const lastHandledNotificationId = useRef<string | null>(null);
  const hasHandledStart = useRef(false);

  async function handleNotificationResponse(
    response: Notifications.NotificationResponse,
  ) {
    const notificationId = response.notification.request.identifier;
    const habitId = response.notification.request.content.data.habitId;

    if (typeof habitId !== "number") {
      return;
    }

    if (lastHandledNotificationId.current === notificationId) {
      return;
    }

    lastHandledNotificationId.current = notificationId;

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      Alert.alert(error.message);
      return;
    }

    if (!data.session) {
      router.replace({
        pathname: "/(auth)/signInPage",
        params: {
          habitId: habitId.toString(),
        },
      });

      return;
    }

    router.push({
      pathname: "/notification",
      params: {
        habitId: habitId.toString(),
      },
    });
  }

  // Foreground/background notification taps after startup
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Initial app startup
  useEffect(() => {
    async function handleStart() {
      // Expo is still figuring out whether there was a notification response
      if (lastNotificationResponse === undefined) {
        return;
      }

      if (hasHandledStart.current) {
        return;
      }

      hasHandledStart.current = true;

      // App was opened from a notification
      if (lastNotificationResponse) {
        await handleNotificationResponse(lastNotificationResponse);
        return;
      }

      // Normal app open
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        Alert.alert(error.message);
        return;
      }

      if (!data.session) {
        router.replace("/(auth)");
        return;
      }

      router.replace("/(app)");
    }

    void handleStart();
  }, [lastNotificationResponse]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
