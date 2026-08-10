import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const lastHandledNotificationId = useRef<string | null>(null);

  function handleNotificationResponse(
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

    router.push({
      pathname: "/notification",
      params: {
        habitId: habitId.toString(),
      },
    });
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (lastNotificationResponse) {
      handleNotificationResponse(lastNotificationResponse);
    }
  }, [lastNotificationResponse]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
