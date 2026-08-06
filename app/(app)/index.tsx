import requestNotificationPermission, {
  cancelHabitNotifications,
  saveNotificationIds,
  scheduleHabitNotification,
} from "@/utils/notification";
import { supabase } from "@/utils/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { NewHabit, StoredHabit } from "../types/habit";
import { Day, days } from "../types/notificationFreq";

// Visible-card layout: exactly 3 full cards fit, a 4th peeks in and fades.
const CARD_GAP = 14;
const VISIBLE_CARDS = 3;
const PEEK_RATIO = 0.32; // portion of a 4th card that peeks before fading
const FALLBACK_CARD_HEIGHT = 108;

const ACCENT = "#34C759";
const DANGER = "#FF3B30";

const daysToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const dayOrder: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function getTheme(isDark: boolean) {
  return {
    screen: PlatformColor("systemBackground"),
    elevated: PlatformColor("secondarySystemBackground"),
    card: PlatformColor("secondarySystemBackground"),
    field: PlatformColor("tertiarySystemBackground"),
    text: PlatformColor("label"),
    secondaryText: PlatformColor("secondaryLabel"),
    tertiaryText: PlatformColor("tertiaryLabel"),
    border: PlatformColor("separator"),
    buttonBackground: PlatformColor("label"),
    buttonText: PlatformColor("systemBackground"),
    overlay: isDark ? "rgba(0, 0, 0, 0.72)" : "rgba(0, 0, 0, 0.35)",
    fadeEnd: isDark ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)",
    disabled: PlatformColor("systemGray4"),
    dotInactive: isDark ? "rgba(255,255,255,0.12)" : "rgba(60,60,67,0.18)",
  };
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [habitName, setHabitName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const [user, setUser] = useState<User | null>(null);
  const [notificationTime, setNotificationTime] = useState(
    new Date(2026, 0, 1, 23, 59),
  );
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [listHeight, setListHeight] = useState(0);

  const isAddHabitButtonDisabled =
    habitName.trim() === "" || selectedDays.length === 0;

  // Size cards so exactly 3 fill the available space, with a 4th peeking in.
  // Recomputed from the actual measured container height, so it adapts to
  // any screen size instead of guessing at a fixed constant.
  const cardHeight =
    listHeight > 0
      ? (listHeight - CARD_GAP * (VISIBLE_CARDS - 1)) /
        (VISIBLE_CARDS + PEEK_RATIO)
      : FALLBACK_CARD_HEIGHT;
  const peekHeight = cardHeight * PEEK_RATIO;

  const needsScroll = habits.length > 3;

  // Track open swipe rows so opening one closes any others.
  const swipeableRefs = useRef(new Map<number, Swipeable | null>()).current;

  function closeOtherSwipeables(exceptId: number) {
    swipeableRefs.forEach((ref, id) => {
      if (id !== exceptId) {
        ref?.close();
      }
    });
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function fetchHabits() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      Alert.alert("Cannot retrieve habits", error.message);
      return;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      Alert.alert("You are not signed in");
      return;
    }

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/supabase/get_habits`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const response = await res.json();

    if (res.status !== 200) {
      Alert.alert(`${response.message}`);
    }

    setHabits(response.habits ?? []);

    console.log("habits retreived");
  }

  // call the habits function every time home gets focused.
  useFocusEffect(
    useCallback(() => {
      void fetchHabits();
    }, []),
  );

  function formatTimeForSupabase(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  function formatNotificationTime(value: string | null | undefined) {
    if (!value) {
      return "No reminder";
    }

    const [hourString, minuteString] = value.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return "Reminder set";
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatRepeatDays(repeatDays: string[] | null | undefined) {
    if (!repeatDays || repeatDays.length === 0) {
      return "No scheduled days";
    }

    if (repeatDays.length === 7) {
      return "Every day";
    }

    return [...repeatDays]
      .sort((a, b) => dayOrder[a.toLowerCase()] - dayOrder[b.toLowerCase()])
      .map((day) => day.slice(0, 3))
      .join(", ");
  }

  function formatScheduleLine(habit: StoredHabit) {
    const schedule = formatRepeatDays(habit.repeat_days);
    const time = formatNotificationTime(habit.notification_time);

    return `${schedule} • ${time}`;
  }

  function getHabitStreak(habit: StoredHabit): number {
    const frequencyInNumbers = habit.repeat_days.map(
      (day) => daysToNumber[day.toLowerCase()],
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(habit.created_at);
    createdDate.setHours(0, 0, 0, 0);

    const currentDate = new Date(today);
    let currentStreak = 0;

    while (currentDate >= createdDate) {
      const isScheduled = frequencyInNumbers.includes(currentDate.getDay());

      if (isScheduled) {
        const dateString = formatDate(currentDate);
        const completed = habit.logs?.[dateString];

        const isToday = currentDate.getTime() === today.getTime();

        if (completed === true) {
          currentStreak++;
        } else if (!isToday) {
          break;
        }
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return currentStreak;
  }

  function resetHabitForm() {
    setHabitName("");
    setNotificationTime(new Date(2026, 0, 1, 23, 59));
    setSelectedDays([]);
    setIsModalVisible(false);
  }

  async function handleAddHabit() {
    const newHabit: NewHabit = {
      name: habitName.trim(),
      notification_time: formatTimeForSupabase(notificationTime),
      notification_enabled: true,
      repeat_days: selectedDays,
    };

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      Alert.alert(error.message);
      return;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      Alert.alert("You are not signed in");
      return;
    }

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/supabase/add_habit`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHabit),
      },
    );

    const response = await res.json();

    if (!res.ok) {
      Alert.alert(response.message);
      return;
    }

    const notificationGranted = await requestNotificationPermission();

    if (!notificationGranted) {
      Alert.alert(
        "Notifications disabled",
        "The habit was created, but reminders are turned off.",
      );
      await fetchHabits();
      resetHabitForm();
      return;
    }

    const newlyInsertedHabitId = response.returnedHabit.id;

    const notificationIDs: string[] = [];
    for (const day of selectedDays) {
      const notificationID = await scheduleHabitNotification(
        newlyInsertedHabitId,
        habitName.trim(),
        notificationTime,
        daysToNumber[day] + 1,
      );

      notificationIDs.push(notificationID);
    }

    await saveNotificationIds(newlyInsertedHabitId, notificationIDs);

    await fetchHabits();
    resetHabitForm();
  }

  async function deleteHabitFromDB(habitId: number) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      Alert.alert(error.message);
      return;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      Alert.alert("No user signed in");
      return;
    }

    await cancelHabitNotifications(habitId);

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/supabase/delete_habit`,
      {
        method: "DELETE",
        headers: {
          authorization: "Bearer " + accessToken,
          "Content-type": "application/json",
        },
        body: JSON.stringify({ habitId }),
      },
    );

    const response = await res.json();

    if (!res.ok) {
      Alert.alert(response.message);
      return;
    }

    swipeableRefs.delete(habitId);

    await fetchHabits();
  }

  function handleSwipeDelete(habitId: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void deleteHabitFromDB(habitId);
  }

  function handleDeleteHabit(id: number) {
    Alert.alert("Delete habit?", "This habit cannot be restored.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteHabitFromDB(id),
      },
    ]);
  }

  function toggleDay(day: Day) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((selectedDay) => selectedDay !== day)
        : [...currentDays, day],
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
            <Text style={styles.title}>Habit Tracker</Text>
          </View>

          <View style={styles.habitCountBadge}>
            <Text style={styles.habitCountText}>{habits.length}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {habits.length === 0
            ? "Start with one habit worth keeping."
            : `${habits.length} habit${habits.length === 1 ? "" : "s"} in motion`}
        </Text>

        <View
          style={styles.habitContainer}
          onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
        >
          <ScrollView
            contentContainerStyle={[
              styles.habitContent,
              { paddingBottom: habits.length > 3 ? peekHeight : 0 },
            ]}
            showsVerticalScrollIndicator={false}
            bounces
            scrollEnabled
          >
            {habits.length === 0 ? (
              <View style={[styles.emptyState, { minHeight: listHeight }]}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>+</Text>
                </View>
                <Text style={styles.emptyTitle}>No habits yet</Text>
                <Text style={styles.emptyText}>
                  Add your first habit and build a routine one day at a time.
                </Text>
              </View>
            ) : (
              habits.map((habit) => (
                <Swipeable
                  key={habit.id}
                  ref={(ref) => {
                    if (ref) {
                      swipeableRefs.set(habit.id, ref);
                    } else {
                      swipeableRefs.delete(habit.id);
                    }
                  }}
                  containerStyle={[
                    styles.swipeableContainer,
                    { height: cardHeight },
                  ]}
                  overshootRight={false}
                  friction={2}
                  rightThreshold={40}
                  onSwipeableWillOpen={() => closeOtherSwipeables(habit.id)}
                  renderRightActions={() => (
                    <View
                      style={[
                        styles.deleteActionContainer,
                        { height: cardHeight },
                      ]}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteCircle,
                          pressed && styles.deleteCirclePressed,
                        ]}
                        onPress={() => handleSwipeDelete(habit.id)}
                      >
                        <Text style={styles.deleteIcon}>×</Text>
                      </Pressable>
                    </View>
                  )}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.habitCard,
                      { height: cardHeight },
                      pressed && styles.habitCardPressed,
                    ]}
                    onLongPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Heavy,
                      );
                      handleDeleteHabit(habit.id);
                    }}
                    onPress={() => {
                      router.navigate({
                        pathname: "/(app)/calendar",
                        params: { habitId: habit.id.toString() },
                      });
                    }}
                    delayLongPress={500}
                  >
                    <View style={styles.cardTopRow}>
                      <Text style={styles.habitName} numberOfLines={1}>
                        {habit.name}
                      </Text>

                      <View style={styles.streakBadge}>
                        <Text style={styles.streakBadgeText}>
                          {getHabitStreak(habit)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.habitSchedule} numberOfLines={1}>
                      {formatScheduleLine(habit)}
                    </Text>

                    <View style={styles.dotsRow}>
                      {days.map((day) => {
                        const isActive = (habit.repeat_days ?? []).includes(
                          day.value,
                        );

                        return (
                          <View
                            key={day.value}
                            style={[
                              styles.dot,
                              isActive ? styles.dotActive : styles.dotInactive,
                            ]}
                          />
                        );
                      })}
                    </View>
                  </Pressable>
                </Swipeable>
              ))
            )}
          </ScrollView>

          {needsScroll && (
            <LinearGradient
              colors={["transparent", theme.fadeEnd]}
              style={[styles.fadeOverlay, { height: peekHeight + CARD_GAP }]}
              pointerEvents="none"
            />
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addHabitButton,
            pressed && styles.addHabitButtonPressed,
          ]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addHabitPlus}>+</Text>
          <Text style={styles.addHabitButtonText}>Add Habit</Text>
        </Pressable>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={resetHabitForm}
        >
          <Pressable style={styles.modalBackground} onPress={resetHabitForm}>
            <Pressable
              style={styles.modalBox}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Create a habit</Text>

              <Text style={styles.modalLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Read for 20 minutes"
                placeholderTextColor={theme.tertiaryText}
                value={habitName}
                onChangeText={setHabitName}
              />

              <Text style={styles.modalLabel}>REMINDER TIME</Text>
              <DateTimePicker
                value={notificationTime}
                mode="time"
                display="spinner"
                themeVariant={isDark ? "dark" : "light"}
                onChange={(_, selectedTime) => {
                  if (selectedTime) {
                    setNotificationTime(selectedTime);
                  }
                }}
              />

              <Text style={styles.modalLabel}>FREQUENCY</Text>
              <View style={styles.daysContainer}>
                {days.map((day) => {
                  const isSelected = selectedDays.includes(day.value);

                  return (
                    <Pressable
                      key={day.value}
                      style={[styles.dayButton]}
                      onPress={() => toggleDay(day.value)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[
                  styles.addButton,
                  isAddHabitButtonDisabled && styles.disabledAddButton,
                ]}
                onPress={() => void handleAddHabit()}
                disabled={isAddHabitButtonDisabled}
              >
                <Text
                  style={[
                    styles.addButtonText,
                    isAddHabitButtonDisabled && styles.disabledAddButtonText,
                  ]}
                >
                  Add Habit
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

type Theme = ReturnType<typeof getTheme>;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    gestureRoot: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor: theme.screen,
      paddingHorizontal: 22,
      paddingTop: 66,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    eyebrow: {
      color: theme.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.8,
      marginBottom: 7,
    },

    title: {
      color: theme.text,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1.1,
    },

    subtitle: {
      color: theme.secondaryText,
      fontSize: 15,
      marginTop: 8,
      marginBottom: 18,
    },

    habitCountBadge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    habitCountText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
    },

    // flex: 1 (not a fixed height) so the list always fills whatever space
    // is actually available between the header and the Add Habit button.
    habitContainer: {
      flex: 1,
      position: "relative",
      marginBottom: 96,
    },

    habitContent: {
      flexGrow: 1,
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 38,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      marginBottom: 18,
    },

    emptyIconText: {
      color: theme.text,
      fontSize: 30,
      fontWeight: "300",
      marginTop: -2,
    },

    emptyTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },

    emptyText: {
      color: theme.secondaryText,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    swipeableContainer: {
      marginBottom: CARD_GAP,
      borderRadius: 24,
      overflow: "hidden",
    },

    habitCard: {
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingVertical: 18,
    },

    habitCardPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.99 }],
    },

    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    habitName: {
      flex: 1,
      color: theme.text,
      fontSize: 21,
      fontWeight: "800",
      letterSpacing: -0.4,
      marginRight: 10,
    },

    streakBadge: {
      minWidth: 34,
      height: 34,
      paddingHorizontal: 8,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    streakBadgeText: {
      color: ACCENT,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.3,
    },

    habitSchedule: {
      color: theme.secondaryText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },

    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },

    dotActive: {
      backgroundColor: theme.text,
      shadowColor: theme.text,
      shadowOpacity: 0.5,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },

    dotInactive: {
      backgroundColor: theme.dotInactive,
    },

    deleteActionContainer: {
      width: 84,
      alignItems: "center",
      justifyContent: "center",
    },

    deleteCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: DANGER,
      alignItems: "center",
      justifyContent: "center",
    },

    deleteCirclePressed: {
      opacity: 0.75,
      transform: [{ scale: 0.94 }],
    },

    deleteIcon: {
      color: "#FFFFFF",
      fontSize: 28,
      fontWeight: "500",
      lineHeight: 30,
    },

    fadeOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },

    addHabitButton: {
      position: "absolute",
      bottom: 22,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 176,
      backgroundColor: theme.buttonBackground,
      paddingHorizontal: 25,
      paddingVertical: 16,
      borderRadius: 999,
    },

    addHabitButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },

    addHabitPlus: {
      color: theme.buttonText,
      fontSize: 22,
      fontWeight: "500",
      marginRight: 8,
      marginTop: -1,
    },

    addHabitButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: "700",
    },

    modalBackground: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: theme.overlay,
    },

    modalBox: {
      width: "100%",
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 36,
      backgroundColor: theme.elevated,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    modalHandle: {
      width: 42,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.disabled,
      alignSelf: "center",
      marginBottom: 22,
    },

    modalTitle: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.6,
      marginBottom: 24,
    },

    modalLabel: {
      color: theme.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 4,
    },

    input: {
      backgroundColor: theme.field,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginBottom: 20,
      color: theme.text,
      fontSize: 16,
    },

    colorOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 22,
    },

    colorOptionOuter: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },

    colorOption: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },

    daysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 2,
    },

    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.field,
      alignItems: "center",
      justifyContent: "center",
    },

    dayText: {
      color: theme.secondaryText,
      fontWeight: "700",
    },

    selectedDayText: {
      color: "#FFFFFF",
    },

    addButton: {
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 24,
    },

    disabledAddButton: {
      backgroundColor: theme.disabled,
    },

    addButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },

    disabledAddButtonText: {
      color: theme.secondaryText,
    },
  });
}
