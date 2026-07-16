import { supabase } from "@/utils/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { User } from "@supabase/supabase-js";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NewHabit, StoredHabit } from "../types/habit";
import { Day, days } from "../types/notificationFreq";

export default function HomeScreen() {
  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [habitName, setHabitName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notificationTime, setNotificationTime] = useState(
    new Date(2026, 0, 1, 23, 59),
  );
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const isAddDisabled = habitName.trim() === "" || selectedDays.length === 0;

  //retreving user id
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(userError.message);
        return;
      }

      setUser(user);
    }

    fetchUser();
  }, []);

  //retrieving user data. like habits
  useEffect(() => {
    async function fetchHabits() {
      if (!user) {
        console.log("no user logged in");
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        Alert.alert("Cannot retrieve data from database", error.message);
        return;
      }

      setHabits(data);
    }

    fetchHabits();
  }, [user]);

  //Helper functions start
  function formatTimeForSupabase(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  function resetHabitForm() {
    setHabitName("");
    setNotificationTime(new Date(2026, 0, 1, 23, 59));
    setSelectedDays([]);
    setIsModalVisible(false);
  }
  //helper function ends

  async function handleAddHabit() {
    if (!user) {
      console.log("No user is logged In");
      return;
    }

    const trimmedHabitName = habitName.trim();

    if (trimmedHabitName === "") {
      return;
    }

    if (selectedDays.length === 0) {
      return;
    }

    const supabaseFormatDate = formatTimeForSupabase(notificationTime);

    const newHabit: NewHabit = {
      name: trimmedHabitName,
      user_id: user.id,
      notification_time: supabaseFormatDate,
      notification_enabled: true,
      repeat_days: selectedDays,
    };

    const { data, error } = await supabase
      .from("habits")
      .insert(newHabit)
      .select()
      .single();

    if (error) {
      Alert.alert(error.message);
      return;
    }

    resetHabitForm();

    setHabits((prevHabits) => [...prevHabits, data]);
  }

  async function deleteHabitFromDB(habitId: number) {
    if (!user) {
      console.log("no user signed in");
      return;
    }

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", user.id);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    setHabits((prevHabits) =>
      prevHabits.filter((habit) => habit.id !== habitId),
    );
  }

  function handleDeleteHabit(id: number) {
    Alert.alert("Delete Habit?", "Deleted habit cannot be restored.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteHabitFromDB(id);
        },
      },
    ]);
  }

  function toggleDay(day: Day) {
    setSelectedDays((prevDays) => {
      if (prevDays.includes(day)) {
        return prevDays.filter((selectedDay) => selectedDay !== day);
      }

      return [...prevDays, day];
    });
  }

  return (
    <View style={styles.container}>
      {/* Screen title */}
      <Text style={styles.title}>Habit Tracker</Text>

      {/* Habit display area */}
      <ScrollView
        style={styles.habitContainer}
        contentContainerStyle={styles.habitContent}
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits yet</Text>
        ) : (
          habits.map((habit) => (
            <Pressable
              key={habit.id}
              style={styles.habitCard}
              onLongPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleDeleteHabit(habit.id);
              }}
              delayLongPress={500}
            >
              <Text style={styles.habitName}>{habit.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add habit button */}
      <Pressable
        style={[
          styles.addHabitButton,
          {
            bottom: 20,
          },
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addHabitButtonText}>+ Add Habit</Text>
      </Pressable>

      {/* Add habit modal */}
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
            <Text style={styles.modalTitle}>Add Habit</Text>

            <TextInput
              style={styles.input}
              placeholder="Habit name"
              placeholderTextColor="#a1a1a6"
              value={habitName}
              onChangeText={setHabitName}
            />

            <Text style={styles.modalTitle}>Reminder Time </Text>

            <DateTimePicker
              value={notificationTime}
              mode="time"
              display="spinner"
              textColor="black"
              onChange={(_, selectedTime) => {
                if (selectedTime) {
                  setNotificationTime(selectedTime);
                }
              }}
            />

            <Text style={styles.modalTitle}>Frequency</Text>
            <View style={styles.daysContainer}>
              {days.map((day) => {
                const isSelected = selectedDays.includes(day.value);

                return (
                  <Pressable
                    key={day.value}
                    style={[
                      styles.dayButton,
                      isSelected && styles.selectedDayButton,
                    ]}
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
            {/* ADD BUTTON */}
            <Pressable
              style={[
                styles.addButton,
                isAddDisabled && styles.disabledAddButton,
              ]}
              onPress={handleAddHabit}
              disabled={isAddDisabled}
            >
              <Text
                style={[
                  styles.addButtonText,
                  isAddDisabled && styles.disabledAddButtonText,
                ]}
              >
                Add
              </Text>
            </Pressable>
            {/* ADD BUTTON END */}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  habitContainer: {
    flex: 1,
    marginTop: 30,
    marginBottom: 100,
  },

  habitContent: {
    paddingBottom: 20,
  },

  emptyText: {
    color: "#a1a1a6",
    textAlign: "center",
    marginTop: 40,
  },

  habitCard: {
    backgroundColor: "#242424",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },

  habitName: {
    color: "white",
    fontSize: 18,
  },

  addHabitButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "white",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },

  addHabitButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalBox: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: "black",
  },

  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A0A0A0",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedDayButton: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  dayText: {
    color: "#333",
    fontWeight: "600",
  },

  selectedDayText: {
    color: "white",
  },
  addButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  disabledAddButton: {
    backgroundColor: "#d1d1d6",
  },

  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  disabledAddButtonText: {
    color: "#8e8e93",
  },
});
