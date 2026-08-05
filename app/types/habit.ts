export type NewHabit = {
  name: string;
  notification_time: string;
  notification_enabled: boolean;
  repeat_days: string[];
};

export type StoredHabit = NewHabit & {
  id: number;
  createdAt: string;
  logs: Record<string, boolean>;
};
