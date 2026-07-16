export type NewHabit = {
  name: string;
  user_id: string;
  notification_time: string;
  notification_enabled: boolean;
  repeat_days: string[];
};

export type StoredHabit = NewHabit & { id: number; createdAt: string };
