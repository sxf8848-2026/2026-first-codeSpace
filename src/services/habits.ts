import type { Habit } from "../types";

export type HabitChecks = Record<string, Record<string, boolean>>;

export type HabitView = Habit & {
  checked: boolean;
  totalCompletions: number;
};

export function calculateHabitTotalCompletions(checks: HabitChecks, habitId: string, day: string): number {
  return Object.entries(checks).filter(([checkDay, dayChecks]) => checkDay <= day && dayChecks[habitId] === true).length;
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
    totalCompletions: calculateHabitTotalCompletions(checks, habit.id, day),
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
