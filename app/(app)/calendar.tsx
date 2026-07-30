import { supabase } from "@/utils/supabase";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { User } from "@supabase/supabase-js";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

const CALENDAR_HEIGHT = 380;

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

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CalendarScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<CalendarHabit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<CalendarHabit | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [currDay, setCurrDay] = useState<DateData | null>(null);

  const { habitId } = useLocalSearchParams<{
    habitId?: string;
  }>();

  const snapPoints = useMemo(() => ["40%"], []);

  //get user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("User not loaded", error?.message);
        return;
      }

      setUser(user);
    }

    getUser();
  }, []);

  // fetch habits when calendar tab becomes focused again
  useFocusEffect(
    useCallback(() => {
      async function fetchHabits() {
        if (!user) return;

        const { data, error } = await supabase
          .from("habits")
          .select("id, name, logs, repeat_days, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          Alert.alert("Trouble retrieving habits", error.message);
          return;
        }

        setHabits(data);

        const habitFromHome = data.find(
          (habit) => habit.id === Number(habitId),
        );

        setSelectedHabit(habitFromHome ?? data[0] ?? null);
      }

      fetchHabits();
    }, [user, habitId]),
  );

  //to convert data into expected format for calendar
  const markedDates = useMemo(() => {
    if (!selectedHabit) {
      return {};
    }

    return Object.entries(selectedHabit.logs).reduce(
      (result, [date, completed]) => {
        result[date] = {
          customStyles: {
            container: {
              backgroundColor: completed ? "green" : "red",
              borderRadius: 18,
            },
            text: {
              color: "white",
              fontWeight: "bold",
            },
          },
        };

        return result;
      },
      {} as Record<
        string,
        {
          customStyles: {
            container: {
              backgroundColor: string;
              borderRadius: number;
            };
            text: {
              color: string;
              fontWeight: "bold";
            };
          };
        }
      >,
    );
  }, [selectedHabit]);

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

  function openBottomSheet() {
    bottomSheetRef.current?.snapToIndex(0);
  }

  function selectHabit(habit: CalendarHabit) {
    setSelectedHabit(habit);
    bottomSheetRef.current?.close();
  }

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  function editDate(day: DateData) {
    setModalOpen(true);
    setCurrDay(day);
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

    const { error } = await supabase
      .from("habits")
      .update({ logs: newLog })
      .eq("id", selectedHabit.id);

    if (error) {
      Alert.alert("Something went wrong while updating", error.message);
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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.selector} onPress={openBottomSheet}>
          <Text style={styles.selectorText}>
            {selectedHabit?.name ?? "Select habit"}
          </Text>

          <Text style={styles.arrow}>⌄</Text>
        </Pressable>
      </View>

      <View style={styles.calendarContainer}>
        <CalendarList
          key={selectedHabit?.id ?? "no-habit"}
          onDayPress={(day) => {
            if (!selectedHabit) {
              return;
            }

            const pressedDate = new Date(`${day.dateString}T00:00:00`);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (pressedDate > today) {
              Alert.alert(
                "Future date",
                "You cannot update a habit for a future date.",
              );
              return;
            }
            const pressedDayNumber = pressedDate.getDay();

            const allowedDayNumbers = selectedHabit.repeat_days.map(
              (repeatDay) => daysToNumber[repeatDay],
            );

            if (!allowedDayNumbers.includes(pressedDayNumber)) {
              Alert.alert(
                "Not a scheduled day",
                `${selectedHabit.name} is not scheduled for this day.`,
              );
              return;
            }

            editDate(day);
          }}
          markingType="custom"
          markedDates={markedDates}
          horizontal={false}
          pagingEnabled
          current={new Date().toISOString().split("T")[0]}
          calendarHeight={CALENDAR_HEIGHT}
          style={{ height: CALENDAR_HEIGHT }}
          theme={{
            calendarBackground: "#ded1d1ff",
            monthTextColor: "#111111",
            textMonthFontSize: 20,
            textMonthFontWeight: "bold",
            dayTextColor: "#111111",
            textDayFontSize: 16,
            textSectionTitleColor: "#777777",
            todayTextColor: "#4f46e5",
            selectedDayBackgroundColor: "#4f46e5",
            selectedDayTextColor: "#ffffff",
            arrowColor: "#4f46e5",
          }}
        />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Current streak: {streak}</Text>
        <Text style={styles.statsTitle}>Max streak: {maxStreak}</Text>
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
          <Text style={styles.sheetTitle}>Choose a habit</Text>

          {habits.map((currentHabit) => (
            <Pressable
              key={currentHabit.name}
              style={styles.option}
              onPress={() => selectHabit(currentHabit)}
            >
              <Text style={styles.optionText}>{currentHabit.name}</Text>

              {selectedHabit?.name === currentHabit.name && (
                <Text style={styles.check}>✓</Text>
              )}
            </Pressable>
          ))}
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
              <Text style={styles.modalTitle}>Update Habit</Text>

              <Pressable
                style={styles.closeButton}
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

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.statusButton, styles.yesButton]}
                onPress={() => updateCalendar(true)}
              >
                <Text style={styles.statusIcon}>✓</Text>
                <Text style={styles.statusButtonText}>Yes, completed</Text>
              </Pressable>

              <Pressable
                style={[styles.statusButton, styles.noButton]}
                onPress={() => updateCalendar(false)}
              >
                <Text style={styles.statusIcon}>✕</Text>
                <Text style={styles.statusButtonText}>No, not completed</Text>
              </Pressable>
              <Pressable
                style={[styles.statusButton, styles.unlogButton]}
                onPress={() => updateCalendar(null)}
              >
                <Text style={styles.statusIcon}>−</Text>
                <Text style={styles.statusButtonText}>Remove log</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  selectorText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
  },

  arrow: {
    color: "#ffffff",
    fontSize: 18,
  },

  calendarContainer: {
    height: CALENDAR_HEIGHT,
  },

  statsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  statsTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },

  sheetBackground: {
    backgroundColor: "#1c1c1e",
  },

  handleIndicator: {
    backgroundColor: "#8e8e93",
  },

  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  sheetTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },

  option: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3a3a3c",
  },

  optionText: {
    color: "#ffffff",
    fontSize: 18,
  },

  check: {
    color: "#0a84ff",
    fontSize: 20,
    fontWeight: "700",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },

  modalBox: {
    width: "100%",
    maxWidth: 400,
    padding: 22,
    backgroundColor: "#1c1c1e",
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },

  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c2c2e",
    borderRadius: 16,
  },

  closeButtonText: {
    color: "#8e8e93",
    fontSize: 15,
    fontWeight: "700",
  },

  modalDate: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "#0a84ff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderRadius: 10,
  },

  modalQuestion: {
    marginTop: 20,
    color: "#d1d1d6",
    fontSize: 17,
    lineHeight: 24,
  },

  habitName: {
    color: "#ffffff",
    fontWeight: "700",
  },

  modalButtons: {
    gap: 12,
    marginTop: 24,
  },

  statusButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
  },

  yesButton: {
    backgroundColor: "#248a3d",
  },

  noButton: {
    backgroundColor: "#c9342f",
  },
  unlogButton: {
    backgroundColor: "#48484a",
  },

  statusIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  statusButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },

  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  cancelButtonText: {
    color: "#8e8e93",
    fontSize: 16,
    fontWeight: "600",
  },
});
