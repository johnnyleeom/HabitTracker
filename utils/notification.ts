import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export default async function requestNotificationPermission() {
  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.status === "granted") {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.status === "granted";
}

export async function scheduleHabitNotification(
  habitId: number,
  habitName: string,
  notificationTime: Date,
  weekday: number,
) {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Habit check-in",
      body: `Did you complete ${habitName}?`,
      data: {
        habitId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: notificationTime.getHours(),
      minute: notificationTime.getMinutes(),
    },
  });

  return notificationId;
}

export async function saveNotificationIds(
  habitId: number,
  notificationIds: string[],
) {
  await AsyncStorage.setItem(
    `habit-notification-${habitId}`,
    JSON.stringify(notificationIds),
  );
}

export async function cancelHabitNotifications(habitId: number) {
  const storedIds = await AsyncStorage.getItem(`habit-notification-${habitId}`);

  if (!storedIds) {
    return;
  }

  const notificationIds: string[] = JSON.parse(storedIds);

  for (const notificationId of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  await AsyncStorage.removeItem(`habit-notification-${habitId}`);

  console.log("deleted", storedIds);
}
