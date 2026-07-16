export type NewHabit = {
  name: string;
  user_id: string;
};

export type StoredHabit = NewHabit & { id: number; createdAt: string };
