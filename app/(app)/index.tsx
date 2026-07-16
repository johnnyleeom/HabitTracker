import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NewHabit, StoredHabit } from "../types/habit";

export default function HomeScreen() {
  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [habitName, setHabitName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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

  async function handleAddHabit() {
    if (!user) {
      console.log("No user is logged In");
      return;
    }

    const trimmedHabitName = habitName.trim();

    if (trimmedHabitName === "") {
      return;
    }

    const newHabit: NewHabit = {
      name: trimmedHabitName,
      user_id: user.id,
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

    setHabitName("");
    setIsModalVisible(false);

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
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setIsModalVisible(false)}
        >
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

            <Button title="Add" onPress={handleAddHabit} />
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
});
