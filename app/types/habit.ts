export type NewHabit = {
  name: string;
  notification_time: string;
  notification_enabled: boolean;
  repeat_days: string[];
};

export type StoredHabit = NewHabit & {
  id: number;
  created_at: string;
  logs: Record<string, boolean>;
};
