import type { Habit } from "../types";

export type HabitChecks = Record<string, Record<string, boolean>>;

export type HabitView = Habit & {
  checked: boolean;
  streak: number;
};

export function calculateHabitStreak(checks: HabitChecks, habitId: string, today: string): number {
  let streak = 0;
  let cursor = today;
  while (checks[cursor]?.[habitId] === true) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}

export function calculateHabitDisplayStreak(checks: HabitChecks, habitId: string, day: string): number {
  if (checks[day]?.[habitId] === true) {
    return calculateHabitStreak(checks, habitId, day);
  }
  return calculateHabitStreak(checks, habitId, addDaysToKey(day, -1));
}

export function getVisibleHabits(habits: Habit[]): Habit[] {
  return habits.filter((habit) => !habit.archived_at);
}

export function normalizeHabit(
  habit: Partial<Habit>,
  createId: () => string = () => crypto.randomUUID(),
  now: () => string = () => new Date().toISOString(),
): Habit {
  return {
    id: typeof habit.id === "string" ? habit.id : createId(),
    name: typeof habit.name === "string" ? habit.name.trim() : "",
    note: typeof habit.note === "string" ? habit.note : "",
    created_at: typeof habit.created_at === "string" ? habit.created_at : now(),
    archived_at: typeof habit.archived_at === "string" ? habit.archived_at : null,
  };
}

export function getHabitViews(habits: Habit[], checks: HabitChecks, day: string): HabitView[] {
  return getVisibleHabits(habits).map((habit) => ({
    ...habit,
    checked: checks[day]?.[habit.id] === true,
    streak: calculateHabitDisplayStreak(checks, habit.id, day),
  }));
}

export function getHabitCompletion(habits: Habit[], checks: HabitChecks, day: string): { done: number; total: number } {
  const visibleHabits = getVisibleHabits(habits);
  return {
    done: visibleHabits.filter((habit) => checks[day]?.[habit.id] === true).length,
    total: visibleHabits.length,
  };
}

export function canEditHabitDate(day: string, today: string): boolean {
  return day <= today;
}

export function toggleHabitCheckForDay(checks: HabitChecks, day: string, habitId: string, today: string): HabitChecks {
  if (!canEditHabitDate(day, today)) return checks;
  const dayChecks = { ...(checks[day] ?? {}) };
  if (dayChecks[habitId]) {
    delete dayChecks[habitId];
  } else {
    dayChecks[habitId] = true;
  }
  const nextChecks = { ...checks };
  if (Object.keys(dayChecks).length) {
    nextChecks[day] = dayChecks;
  } else {
    delete nextChecks[day];
  }
  return nextChecks;
}

export function setHabitCheckForDay(checks: HabitChecks, day: string, habitId: string, today: string, checked: boolean): HabitChecks {
  if (!canEditHabitDate(day, today)) return checks;
  const dayChecks = { ...(checks[day] ?? {}) };
  if (checked) {
    dayChecks[habitId] = true;
  } else {
    delete dayChecks[habitId];
  }
  const nextChecks = { ...checks };
  if (Object.keys(dayChecks).length) {
    nextChecks[day] = dayChecks;
  } else {
    delete nextChecks[day];
  }
  return nextChecks;
}

function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
