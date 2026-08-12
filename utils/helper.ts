import { StoredHabit } from "@/types/habit";

export const daysToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getHabitStreak(habit: StoredHabit) {
  const frequencyInNumbers = habit.repeat_days.map(
    (day) => daysToNumber[day.toLowerCase()],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createdDate = new Date(habit.created_at);
  createdDate.setHours(0, 0, 0, 0);

  const currentDate = new Date(today);
  let currentStreak = 0;

  while (currentDate >= createdDate) {
    const isScheduled = frequencyInNumbers.includes(currentDate.getDay());

    if (isScheduled) {
      const dateString = formatDate(currentDate);
      const completed = habit.logs?.[dateString];

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
}

export function formatRepeatDays(repeatDays: string[] | null | undefined) {
  if (!repeatDays || repeatDays.length === 0) {
    return "No scheduled days";
  }

  if (repeatDays.length === 7) {
    return "Every day";
  }

  return [...repeatDays]
    .sort(
      (a, b) => daysToNumber[a.toLowerCase()] - daysToNumber[b.toLowerCase()],
    )
    .map((day) => day.slice(0, 3))
    .join(", ");
}

export function formatNotificationTime(value: string | null | undefined) {
  if (!value) {
    return "No reminder";
  }

  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "Reminder set";
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatScheduleLine(habit: StoredHabit) {
  const schedule = formatRepeatDays(habit.repeat_days);
  const time = formatNotificationTime(habit.notification_time);

  return `${schedule} • ${time}`;
}

export function formatTimeForSupabase(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export function getMaxStreaks(selectedHabit: StoredHabit) {
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
}
