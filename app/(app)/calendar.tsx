import { supabase } from "@/utils/supabase";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { User } from "@supabase/supabase-js";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarList } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

const CALENDAR_HEIGHT = 380;

type CalendarHabit = {
  id: number;
  name: string;
  logs: Record<string, boolean>;
};

export default function CalendarScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<CalendarHabit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<CalendarHabit | null>(
    null,
  );

  const { habitId } = useLocalSearchParams<{
    habitId?: string;
  }>();

  const snapPoints = useMemo(() => ["40%"], []);

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

  useFocusEffect(
    useCallback(() => {
      async function fetchHabits() {
        if (!user) return;

        const { data, error } = await supabase
          .from("habits")
          .select("id, name, logs")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          Alert.alert("Trouble retrieving habits", error.message);
          return;
        }

        setHabits(data);
      }

      fetchHabits();
    }, [user]),
  );

  useEffect(() => {
    if (habits.length === 0) {
      setSelectedHabit(null);
      return;
    }

    const habitFromHome = habits.find(
      (currentHabit) => currentHabit.id === Number(habitId),
    );

    setSelectedHabit(habitFromHome ?? habits[0]);
  }, [habitId, habits]);

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
        <Text style={styles.statsTitle}>Streaks</Text>
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
});
