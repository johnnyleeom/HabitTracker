import { supabase } from "@/utils/supabase";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

const CALENDAR_HEIGHT = 420;
const CALENDAR_SIDE_BLEED = 8;

const COLORS = {
  background: "#000000",
  surface: "#171717",
  surfaceRaised: "#1D1D1F",
  surfaceMuted: "#252527",
  border: "#2B2B2E",
  text: "#FFFFFF",
  secondaryText: "#929298",
  mutedText: "#5E5E63",
  green: "#61D157",
  yellow: "#E7B94F",
  red: "#FF6259",
  white: "#FFFFFF",
};

type CalendarHabit = {
  id: number;
  name: string;
  logs: Record<string, boolean>;
  repeat_days: string[];
  created_at: string;
};

const daysToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const shortDayNames: Record<string, string> = {
  sunday: "SUN",
  monday: "MON",
  tuesday: "TUE",
  wednesday: "WED",
  thursday: "THU",
  friday: "FRI",
  saturday: "SAT",
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSchedule(repeatDays: string[]): string {
  if (repeatDays.length === 7) {
    return "EVERY DAY";
  }

  return repeatDays
    .map((day) => shortDayNames[day] ?? day.toUpperCase())
    .join(" · ");
}

export default function CalendarScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const calendarWidth = screenWidth - 44 + CALENDAR_SIDE_BLEED * 2;

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [habits, setHabits] = useState<CalendarHabit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<CalendarHabit | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [currDay, setCurrDay] = useState<DateData | null>(null);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  const { habitId } = useLocalSearchParams<{
    habitId?: string;
  }>();

  const snapPoints = useMemo(() => ["40%"], []);

  // fetch habits when calendar tab becomes focused again
  useFocusEffect(
    useCallback(() => {
      async function fetchHabits() {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          Alert.alert(error.message);
          return;
        }
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          Alert.alert("Access Token is not available");
          return;
        }

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/supabase/get_habits`,
          {
            method: "GET",
            headers: {
              authorization: "Bearer " + accessToken,
            },
          },
        );

        const response = await res.json();

        if (!res.ok) {
          Alert.alert(response.message);
          return;
        }

        const fetchedHabit = response.habits;

        setHabits(fetchedHabit);

        const habitFromHome = fetchedHabit.find(
          (habit: any) => habit.id === Number(habitId),
        );

        setSelectedHabit(habitFromHome ?? fetchedHabit[0] ?? null);
      }

      void fetchHabits();
    }, [habitId]),
  );

  const streak = useMemo(() => {
    if (!selectedHabit) {
      return 0;
    }

    const frequencyInNumbers = selectedHabit.repeat_days.map(
      (day) => daysToNumber[day],
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(selectedHabit.created_at);
    createdDate.setHours(0, 0, 0, 0);

    const currentDate = new Date(today);

    let currentStreak = 0;

    while (currentDate >= createdDate) {
      const dayNumber = currentDate.getDay();

      if (frequencyInNumbers.includes(dayNumber)) {
        const dateString = formatDate(currentDate);
        const completed = selectedHabit.logs[dateString];

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
  }, [selectedHabit]);

  const maxStreak = useMemo(() => {
    if (!selectedHabit) {
      return 0;
    }

    const frequencyInNumbers = selectedHabit.repeat_days.map(
      (day) => daysToNumber[day],
    );

    const createdDate = new Date(selectedHabit.created_at);
    createdDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(createdDate);

    let currentRun = 0;
    let longestRun = 0;

    while (currentDate <= today) {
      const dayNumber = currentDate.getDay();

      if (frequencyInNumbers.includes(dayNumber)) {
        const dateString = formatDate(currentDate);
        const completed = selectedHabit.logs[dateString];

        if (completed === true) {
          currentRun++;
          longestRun = Math.max(longestRun, currentRun);
        } else {
          currentRun = 0;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return longestRun;
  }, [selectedHabit]);

  const loggedDaysThisMonth = useMemo(() => {
    if (!selectedHabit) {
      return 0;
    }

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;

    return Object.keys(selectedHabit.logs).filter((date) =>
      date.startsWith(currentMonthPrefix),
    ).length;
  }, [selectedHabit]);

  const createdDateString = useMemo(() => {
    if (!selectedHabit) {
      return null;
    }

    const createdDate = new Date(selectedHabit.created_at);
    createdDate.setHours(0, 0, 0, 0);
    return formatDate(createdDate);
  }, [selectedHabit]);

  function openBottomSheet() {
    bottomSheetRef.current?.snapToIndex(0);
  }

  function selectHabit(habit: CalendarHabit) {
    setSelectedHabit(habit);
    setInlineMessage(null);
    bottomSheetRef.current?.close();
  }

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.7}
      />
    ),
    [],
  );

  function editDate(day: DateData) {
    setInlineMessage(null);
    setModalOpen(true);
    setCurrDay(day);
  }

  function handleDayPress(day: DateData) {
    if (!selectedHabit) {
      return;
    }

    const pressedDate = new Date(`${day.dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(selectedHabit.created_at);
    createdDate.setHours(0, 0, 0, 0);

    if (pressedDate > today) {
      setInlineMessage("Future dates can’t be edited yet.");
      return;
    }

    if (pressedDate < createdDate) {
      setInlineMessage(
        `This habit started on ${createdDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}.`,
      );
      return;
    }

    const pressedDayNumber = pressedDate.getDay();
    const allowedDayNumbers = selectedHabit.repeat_days.map(
      (repeatDay) => daysToNumber[repeatDay],
    );

    if (!allowedDayNumbers.includes(pressedDayNumber)) {
      setInlineMessage("This habit wasn’t scheduled for this day.");
      return;
    }

    editDate(day);
  }

  async function updateCalendar(completed: boolean | null) {
    if (!currDay || !selectedHabit) {
      return;
    }

    const newLog = {
      ...selectedHabit.logs,
    };

    if (completed === null) {
      delete newLog[currDay.dateString];
    } else {
      newLog[currDay.dateString] = completed;
    }

    const { data, error: err } = await supabase.auth.getSession();
    if (err) {
      Alert.alert(err.message);
      return;
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      Alert.alert("Access token is unavailable");
      return;
    }

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/supabase/update_habit`,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logs: newLog,
          habitId: selectedHabit.id,
        }),
      },
    );

    const response = await res.json();
    if (!res.ok) {
      Alert.alert(response.message);
      return;
    }

    const updatedHabit = {
      ...selectedHabit,
      logs: newLog,
    };

    setSelectedHabit(updatedHabit);

    setHabits((currentHabits) =>
      currentHabits.map((habit) =>
        habit.id === updatedHabit.id ? updatedHabit : habit,
      ),
    );

    setModalOpen(false);
    setCurrDay(null);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>YOUR ROUTINE</Text>
          <Text style={styles.pageTitle}>Calendar</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.headerHabitSelector,
            pressed && styles.headerHabitSelectorPressed,
          ]}
          onPress={openBottomSheet}
        >
          <Text
            style={styles.headerHabitName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedHabit?.name ?? "Select habit"}
          </Text>
          <Text style={styles.headerHabitChevron}>⌄</Text>
        </Pressable>
      </View>

      <Text style={styles.pageSubtitle}>
        {loggedDaysThisMonth} {loggedDaysThisMonth === 1 ? "day" : "days"}{" "}
        logged this month
      </Text>

      <View style={styles.calendarCard}>
        <View style={styles.calendarContainer}>
          <CalendarList
            key={selectedHabit?.id ?? "no-habit"}
            horizontal={false}
            pagingEnabled
            hideExtraDays
            current={new Date().toISOString().split("T")[0]}
            calendarHeight={CALENDAR_HEIGHT}
            calendarWidth={calendarWidth}
            style={[styles.calendar, { width: calendarWidth }]}
            dayComponent={(props) => {
              const date = props.date;

              if (!date) {
                return <View style={styles.dayCell} />;
              }

              const dateObject = new Date(`${date.dateString}T00:00:00`);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const createdDate = selectedHabit
                ? new Date(selectedHabit.created_at)
                : null;
              createdDate?.setHours(0, 0, 0, 0);

              const allowedDayNumbers =
                selectedHabit?.repeat_days.map(
                  (repeatDay) => daysToNumber[repeatDay],
                ) ?? [];

              const isFuture = dateObject > today;
              const isBeforeCreation = createdDate
                ? dateObject < createdDate
                : false;
              const isScheduled = allowedDayNumbers.includes(
                dateObject.getDay(),
              );
              const isUnavailable =
                !selectedHabit || isFuture || isBeforeCreation || !isScheduled;
              const isToday = dateObject.getTime() === today.getTime();
              const completed = selectedHabit?.logs[date.dateString];
              const isSuccess = completed === true;
              const isIntentionalNo = completed === false;
              const isMissed =
                Boolean(selectedHabit) &&
                isScheduled &&
                !isBeforeCreation &&
                dateObject < today &&
                completed === undefined;
              const isStartDate = date.dateString === createdDateString;

              return (
                <Pressable
                  onPress={() => handleDayPress(date)}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isUnavailable && styles.dayCellUnavailable,
                    pressed && styles.dayCellPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSuccess && styles.successDay,
                      isIntentionalNo && styles.intentionalNoDay,
                      isMissed && styles.missedDay,
                      isToday &&
                        !isSuccess &&
                        !isIntentionalNo &&
                        !isUnavailable &&
                        styles.todayDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSuccess && styles.successDayText,
                        isUnavailable && styles.unavailableDayText,
                      ]}
                    >
                      {date.day}
                    </Text>
                  </View>

                  {isStartDate && (
                    <View style={styles.startTag}>
                      <Text style={styles.startTagText}>START</Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
            theme={{
              calendarBackground: COLORS.surface,
              monthTextColor: COLORS.text,
              textMonthFontSize: 20,
              textMonthFontWeight: "700",
              textSectionTitleColor: COLORS.secondaryText,
              textDayHeaderFontSize: 12,
              textDayHeaderFontWeight: "600",
              arrowColor: COLORS.secondaryText,
            }}
          />
        </View>
      </View>

      <View style={styles.messageArea}>
        {inlineMessage ? (
          <View style={styles.inlineMessage}>
            <View style={styles.messageDot} />
            <Text style={styles.inlineMessageText}>{inlineMessage}</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Tap a scheduled day to update it.
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CURRENT</Text>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statCaption}>days in a row</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={[styles.statValue, styles.bestStatValue]}>
            {maxStreak}
          </Text>
          <Text style={styles.statCaption}>days in a row</Text>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetEyebrow}>YOUR ROUTINES</Text>
          <Text style={styles.sheetTitle}>Choose a habit</Text>

          <View style={styles.optionList}>
            {habits.map((currentHabit) => {
              const isSelected = selectedHabit?.id === currentHabit.id;

              return (
                <Pressable
                  key={currentHabit.id}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.selectedOption,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => selectHabit(currentHabit)}
                >
                  <View>
                    <Text style={styles.optionText}>{currentHabit.name}</Text>
                    <Text style={styles.optionSchedule}>
                      {formatSchedule(currentHabit.repeat_days)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.optionCheckCircle,
                      isSelected && styles.optionCheckCircleSelected,
                    ]}
                  >
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheet>

      <Modal visible={modalOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalBackground}
          onPress={() => {
            setModalOpen(false);
            setCurrDay(null);
          }}
        >
          <Pressable
            style={styles.modalBox}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>DAILY CHECK-IN</Text>
                <Text style={styles.modalTitle}>Update habit</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
                onPress={() => {
                  setModalOpen(false);
                  setCurrDay(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalDate}>{currDay?.dateString}</Text>

            <Text style={styles.modalQuestion}>
              Did you complete{" "}
              <Text style={styles.habitName}>{selectedHabit?.name}</Text> on
              this day?
            </Text>

            <View style={styles.primaryModalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.statusButton,
                  styles.yesButton,
                  pressed && styles.statusButtonPressed,
                ]}
                onPress={() => updateCalendar(true)}
              >
                <Text style={styles.yesButtonIcon}>✓</Text>
                <Text style={styles.yesButtonText}>Done</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.statusButton,
                  styles.noButton,
                  pressed && styles.statusButtonPressed,
                ]}
                onPress={() => updateCalendar(false)}
              >
                <Text style={styles.noButtonIcon}>✕</Text>
                <Text style={styles.noButtonText}>No</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.unlogButton,
                pressed && styles.statusButtonPressed,
              ]}
              onPress={() => updateCalendar(null)}
            >
              <Text style={styles.unlogButtonText}>Remove existing log</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 7,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1.1,
  },

  pageSubtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: COLORS.secondaryText,
    fontSize: 15,
  },

  headerHabitSelector: {
    maxWidth: 190,
    minWidth: 118,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  headerHabitSelectorPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  headerHabitName: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },

  headerHabitChevron: {
    marginTop: -3,
    color: COLORS.secondaryText,
    fontSize: 18,
    fontWeight: "700",
  },

  calendarCard: {
    marginHorizontal: -CALENDAR_SIDE_BLEED,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  calendarContainer: {
    height: CALENDAR_HEIGHT,
    width: "100%",
    alignItems: "center",
  },

  calendar: {
    height: CALENDAR_HEIGHT,
    alignSelf: "center",
    backgroundColor: COLORS.surface,
  },

  dayCell: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  dayCellUnavailable: {
    opacity: 0.32,
  },

  dayCellPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },

  dayCircle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  dayText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    fontWeight: "600",
  },

  unavailableDayText: {
    color: COLORS.mutedText,
  },

  successDay: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 9,
    elevation: 7,
  },

  successDayText: {
    color: COLORS.background,
    fontWeight: "800",
  },

  intentionalNoDay: {
    borderColor: COLORS.red,
  },

  missedDay: {
    borderColor: COLORS.yellow,
  },

  todayDay: {
    borderColor: COLORS.green,
  },

  startTag: {
    position: "absolute",
    top: -4,
    right: -8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: COLORS.green,
    borderRadius: 4,
    transform: [{ rotate: "-12deg" }],
  },

  startTagText: {
    color: COLORS.background,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  messageArea: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  inlineMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  messageDot: {
    width: 5,
    height: 5,
    backgroundColor: COLORS.secondaryText,
    borderRadius: 3,
  },

  inlineMessageText: {
    flex: 1,
    color: COLORS.secondaryText,
    fontSize: 13,
    fontWeight: "500",
  },

  helperText: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: "500",
  },

  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 124,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  statLabel: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.4,
  },

  statValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
  },

  bestStatValue: {
    color: COLORS.green,
  },

  statCaption: {
    marginTop: 2,
    color: COLORS.secondaryText,
    fontSize: 13,
    fontWeight: "500",
  },

  sheetBackground: {
    backgroundColor: COLORS.surfaceRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  handleIndicator: {
    width: 42,
    backgroundColor: COLORS.mutedText,
  },

  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  sheetEyebrow: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.3,
  },

  sheetTitle: {
    marginTop: 6,
    marginBottom: 18,
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  optionList: {
    gap: 10,
  },

  option: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedOption: {
    borderColor: COLORS.green,
  },

  optionPressed: {
    opacity: 0.72,
  },

  optionText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },

  optionSchedule: {
    marginTop: 4,
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  optionCheckCircle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
  },

  optionCheckCircleSelected: {
    backgroundColor: COLORS.green,
  },

  check: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "900",
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
  },

  modalBox: {
    width: "100%",
    maxWidth: 400,
    padding: 22,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: COLORS.background,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalEyebrow: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
  },

  modalTitle: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
  },

  closeButtonPressed: {
    opacity: 0.65,
  },

  closeButtonText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: "800",
  },

  modalDate: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(97, 209, 87, 0.12)",
    borderRadius: 10,
  },

  modalQuestion: {
    marginTop: 18,
    color: COLORS.secondaryText,
    fontSize: 17,
    lineHeight: 25,
  },

  habitName: {
    color: COLORS.text,
    fontWeight: "800",
  },

  primaryModalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },

  statusButton: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 18,
    borderWidth: 1.5,
  },

  statusButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  yesButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },

  yesButtonIcon: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: "900",
  },

  yesButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "800",
  },

  noButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.red,
  },

  noButtonIcon: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: "900",
  },

  noButtonText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "800",
  },

  unlogButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 15,
  },

  unlogButtonText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: "700",
  },
});
