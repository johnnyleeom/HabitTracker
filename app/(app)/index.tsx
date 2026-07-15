import * as Haptics from "expo-haptics";
import { useState } from "react";
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
import { Habit } from "../types/habit";

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitName, setHabitName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  function handleAddHabit() {
    const trimmedHabitName = habitName.trim();

    if (trimmedHabitName === "") {
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: trimmedHabitName,
    };

    setHabits((prevHabits) => [...prevHabits, newHabit]);

    setHabitName("");
    setIsModalVisible(false);
  }

  function handleDeleteHabit(id: string) {
    Alert.alert("Delete Habit?", "Deleted habit cannot be restored.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setHabits((prevHabits) =>
            prevHabits.filter((habit) => habit.id !== id),
          );
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
