import { STATUS_DONE, STATUS_IN_PROGRESS, STATUS_TODO } from "../types.ts";
import type { TodoTask } from "../types.ts";

const DAILY_TASK_STATUS_ORDER = [STATUS_IN_PROGRESS, STATUS_TODO, STATUS_DONE];

export function sortDailyTasksByStatus(tasks: TodoTask[]): TodoTask[] {
  return DAILY_TASK_STATUS_ORDER.flatMap((status) => tasks.filter((task) => task.status === status));
}

export function canReorderDailyTasks(source: TodoTask | undefined, target: TodoTask | undefined): boolean {
  return Boolean(source && target && source.id !== target.id && source.status === target.status);
}

export function moveDailyTaskWithinStatus(tasks: TodoTask[], taskId: string, delta: number): TodoTask[] {
  const source = tasks.find((task) => task.id === taskId);
  if (!source) return tasks;
  const peers = tasks.filter((task) => task.status === source.status);
  const sourcePosition = peers.findIndex((task) => task.id === taskId);
  const target = peers[sourcePosition + delta];
  if (!target) return tasks;

  const sourceIndex = tasks.findIndex((task) => task.id === source.id);
  const targetIndex = tasks.findIndex((task) => task.id === target.id);
  const next = [...tasks];
  [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
  return next;
}

export function moveDailyTaskBeforeWithinStatus(tasks: TodoTask[], sourceId: string, targetId: string): TodoTask[] {
  const source = tasks.find((task) => task.id === sourceId);
  const target = tasks.find((task) => task.id === targetId);
  if (!canReorderDailyTasks(source, target)) return tasks;

  const positions = tasks
    .map((task, index) => task.status === source!.status ? index : -1)
    .filter((index) => index >= 0);
  const peers = positions.map((index) => tasks[index]);
  const sourcePosition = peers.findIndex((task) => task.id === sourceId);
  const [moved] = peers.splice(sourcePosition, 1);
  peers.splice(peers.findIndex((task) => task.id === targetId), 0, moved);

  if (positions.every((position, index) => tasks[position].id === peers[index].id)) return tasks;
  const next = [...tasks];
  positions.forEach((position, index) => {
    next[position] = peers[index];
  });
  return next;
}
