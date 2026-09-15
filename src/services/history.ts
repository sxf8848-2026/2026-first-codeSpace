import type { TodoData } from "../types";

const HISTORY_STATUS_DONE = 0;

export type DailyHistoryEntry = {
  day: string;
  doneCount: number;
  totalCount: number;
  awesomeCount: number;
  summary: string;
};

export type MonthlyHistoryEntry = {
  month: string;
  doneCount: number;
  totalCount: number;
  summary: string;
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
