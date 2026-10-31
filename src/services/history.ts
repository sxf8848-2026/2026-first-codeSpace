import type { TodoData, TodoTask, WeeklyDelivery } from "../types";
import { sortWeeklyDeliveriesBySequence } from "./weeklyDeliveries.ts";

const HISTORY_STATUS_DONE = 0;
const HISTORY_STATUS_IN_PROGRESS = 2;

export type DailyHistoryEntry = {
  day: string;
  doneCount: number;
  totalCount: number;
  awesomeCount: number;
  summary: string;
};

export type DailyHistoryCalendarDay = DailyHistoryEntry & {
  inMonth: boolean;
  hasData: boolean;
};

export type DailyHistoryDetail = DailyHistoryEntry & {
  todoTasks: TodoTask[];
  inProgressTasks: TodoTask[];
  doneTasks: TodoTask[];
  awesomeRecords: TodoData["awesomeRecords"][string];
};

export type MonthlyHistoryEntry = {
  month: string;
  doneCount: number;
  totalCount: number;
  summary: string;
};

export type WeeklyDeliveryHistoryEntry = {
  week: string;
  pendingCount: number;
  pickedCount: number;
  totalCount: number;
  summary: string;
};

export type WeeklyDeliveryHistoryDetail = WeeklyDelivery & {
  week: string;
};

export function getDailyHistoryEntries(data: Pick<TodoData, "todos" | "awesomeRecords">): DailyHistoryEntry[] {
  return Array.from(new Set([...Object.keys(data.todos), ...Object.keys(data.awesomeRecords)]))
    .filter((day) => (data.todos[day]?.length ?? 0) > 0 || (data.awesomeRecords[day]?.length ?? 0) > 0)
    .sort()
    .reverse()
    .map((day) => {
      const tasks = data.todos[day] ?? [];
      const records = data.awesomeRecords[day] ?? [];
      const done = tasks.filter((task) => task.status === HISTORY_STATUS_DONE);
      const summary =
        done
          .slice(0, 3)
          .map((task) => task.text)
          .join("、") ||
        records
          .slice(0, 3)
          .map((record) => record.text)
          .join("、") ||
        "这一天还没有完成项";

      return {
        day,
        doneCount: done.length,
        totalCount: tasks.length,
        awesomeCount: records.length,
        summary,
      };
    });
}

export function getDailyHistoryCalendarDays(data: Pick<TodoData, "todos" | "awesomeRecords">, month: string): DailyHistoryCalendarDay[] {
  const entriesByDay = new Map(getDailyHistoryEntries(data).map((entry) => [entry.day, entry]));
  const start = startOfCalendarMonth(month);
  const targetMonth = month;

  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(start, index);
    const key = historyDateKey(day);
    const entry = entriesByDay.get(key);

    return {
      day: key,
      doneCount: entry?.doneCount ?? 0,
      totalCount: entry?.totalCount ?? 0,
      awesomeCount: entry?.awesomeCount ?? 0,
      summary: entry?.summary ?? "这一天还没有记录",
      inMonth: historyMonthKey(day) === targetMonth,
      hasData: Boolean(entry),
    };
  });
}

export function getDailyHistoryDetail(data: Pick<TodoData, "todos" | "awesomeRecords">, day: string): DailyHistoryDetail {
  const tasks = data.todos[day] ?? [];
  const awesomeRecords = data.awesomeRecords[day] ?? [];
  const doneTasks = tasks.filter((task) => task.status === HISTORY_STATUS_DONE);
  const inProgressTasks = tasks.filter((task) => task.status === HISTORY_STATUS_IN_PROGRESS);
  const todoTasks = tasks.filter((task) => task.status !== HISTORY_STATUS_DONE && task.status !== HISTORY_STATUS_IN_PROGRESS);
  const summary =
    doneTasks
      .slice(0, 3)
      .map((task) => task.text)
      .join("、") ||
    awesomeRecords
      .slice(0, 3)
      .map((record) => record.text)
      .join("、") ||
    "这一天还没有完成项";

  return {
    day,
    doneCount: doneTasks.length,
    totalCount: tasks.length,
    awesomeCount: awesomeRecords.length,
    summary,
    todoTasks,
    inProgressTasks,
    doneTasks,
    awesomeRecords,
  };
}

export function getMonthlyHistoryEntries(data: Pick<TodoData, "monthlyTodos">): MonthlyHistoryEntry[] {
  return Object.entries(data.monthlyTodos)
    .filter(([, tasks]) => tasks.length > 0)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([month, tasks]) => {
      const done = tasks.filter((task) => task.done);
      const summary =
        tasks
          .slice(0, 3)
          .map((task) => task.text)
          .join("、") || "这个月还没有待办事项";

      return {
        month,
        doneCount: done.length,
        totalCount: tasks.length,
        summary,
      };
    });
}

export function getWeeklyDeliveryHistoryEntries(data: Pick<TodoData, "weeklyDeliveries">): WeeklyDeliveryHistoryEntry[] {
  return Object.entries(data.weeklyDeliveries)
    .filter(([, deliveries]) => deliveries.length > 0)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([week, deliveries]) => {
      const pending = deliveries.filter((delivery) => !delivery.picked);
      const summary =
        deliveries
          .slice(0, 3)
          .map((delivery) => delivery.name)
          .join("、") || "这一周还没有快递记录";

      return {
        week,
        pendingCount: pending.length,
        pickedCount: deliveries.length - pending.length,
        totalCount: deliveries.length,
        summary,
      };
    });
}

export function getWeeklyDeliveryHistoryDetails(
  data: Pick<TodoData, "weeklyDeliveries">,
  query = "",
): WeeklyDeliveryHistoryDetail[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const deliveries = Object.entries(data.weeklyDeliveries)
    .sort(([left], [right]) => right.localeCompare(left))
    .flatMap(([week, weekDeliveries]) => weekDeliveries.map((delivery) => ({ ...delivery, week })))
    .filter((delivery) => !normalizedQuery || delivery.name.toLocaleLowerCase().includes(normalizedQuery));

  return sortWeeklyDeliveriesBySequence(deliveries);
}

function startOfCalendarMonth(month: string): Date {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  return addDays(firstDay, -offset);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function historyDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function historyMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
