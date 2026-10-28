import assert from "node:assert/strict";
import test from "node:test";
import {
  canReorderDailyTasks,
  moveDailyTaskBeforeWithinStatus,
  moveDailyTaskWithinStatus,
  sortDailyTasksByStatus,
} from "../src/services/dailyTasks.ts";

const task = (id, status, overrides = {}) => ({
  id,
  text: id,
  status,
  priority: "medium",
  created_at: "2026-10-28T00:00:00.000Z",
  done_at: status === 0 ? "2026-10-28T01:00:00.000Z" : null,
  description: "",
  tag: 0,
  ...overrides,
});

test("sorts daily tasks by in-progress, todo, then done while keeping each group stable", () => {
  const tasks = [task("done-a", 0), task("todo-a", 1), task("doing-a", 2), task("done-b", 0), task("todo-b", 1), task("doing-b", 2)];
  const sorted = sortDailyTasksByStatus(tasks);

  assert.deepEqual(sorted.map((item) => item.id), ["doing-a", "doing-b", "todo-a", "todo-b", "done-a", "done-b"]);
  assert.deepEqual(tasks.map((item) => item.id), ["done-a", "todo-a", "doing-a", "done-b", "todo-b", "doing-b"]);
  assert.notStrictEqual(sorted, tasks);
});

test("completed tasks sink and return to their original manual position when reopened", () => {
  const tasks = [task("first", 1), task("second", 1), task("done", 0)];
  const completed = tasks.map((item) => item.id === "first" ? { ...item, status: 0 } : item);
  assert.deepEqual(sortDailyTasksByStatus(completed).map((item) => item.id), ["second", "first", "done"]);

  const reopened = completed.map((item) => item.id === "first" ? { ...item, status: 1 } : item);
  assert.deepEqual(sortDailyTasksByStatus(reopened).map((item) => item.id), ["first", "second", "done"]);
});

test("status sorting composes with keyword, category, and priority filtering", () => {
  const tasks = [
    task("done", 0, { text: "阅读资料", tag: 1, priority: "high" }),
    task("todo", 1, { text: "阅读文章", tag: 1, priority: "high" }),
    task("doing", 2, { text: "阅读书籍", tag: 1, priority: "high" }),
    task("other", 2, { text: "跑步", tag: 2, priority: "low" }),
  ];
  const matched = tasks.filter((item) => item.text.includes("阅读") && item.tag === 1 && item.priority === "high");
  assert.deepEqual(sortDailyTasksByStatus(matched).map((item) => item.id), ["doing", "todo", "done"]);
});

test("only allows drag reordering within the same status group", () => {
  const todoA = task("todo-a", 1);
  const todoB = task("todo-b", 1);
  const done = task("done", 0);
  assert.equal(canReorderDailyTasks(todoA, todoB), true);
  assert.equal(canReorderDailyTasks(todoA, done), false);
  assert.equal(canReorderDailyTasks(todoA, todoA), false);

  const tasks = [todoA, done, todoB];
  const reordered = moveDailyTaskBeforeWithinStatus(tasks, "todo-b", "todo-a");
  assert.deepEqual(sortDailyTasksByStatus(reordered).map((item) => item.id), ["todo-b", "todo-a", "done"]);
  assert.strictEqual(moveDailyTaskBeforeWithinStatus(tasks, "todo-a", "done"), tasks);
});

test("keyboard movement skips other status groups and stays inside the current group", () => {
  const tasks = [task("todo-a", 1), task("done", 0), task("todo-b", 1)];
  const moved = moveDailyTaskWithinStatus(tasks, "todo-b", -1);
  assert.deepEqual(sortDailyTasksByStatus(moved).map((item) => item.id), ["todo-b", "todo-a", "done"]);
  assert.strictEqual(moveDailyTaskWithinStatus(tasks, "todo-a", -1), tasks);
  assert.strictEqual(moveDailyTaskWithinStatus(tasks, "done", 1), tasks);
});
