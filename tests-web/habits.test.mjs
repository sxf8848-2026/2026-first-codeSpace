import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHabitTotalCompletions,
  getHabitCompletion,
  getHabitViews,
  getVisibleHabits,
  normalizeHabit,
  setHabitCheckForDay,
  toggleHabitCheckForDay,
} from "../src/services/habits.ts";

test("counts all checked days through the selected day", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-11": { reading: true },
        "2026-09-12": { reading: true },
        "2026-09-13": { reading: true },
      },
      "reading",
      "2026-09-13",
    ),
    3,
  );
});

test("keeps cumulative completions after missed days", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-10": { reading: true },
        "2026-09-11": { reading: true },
        "2026-09-13": { reading: true },
      },
      "reading",
      "2026-09-13",
    ),
    3,
  );
});

test("keeps prior cumulative completions when selected day is not checked", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-12": { reading: true },
      },
      "reading",
      "2026-09-13",
    ),
    1,
  );
});

test("does not count a check after the selected day", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-11": { reading: true },
        "2026-09-13": { reading: true },
      },
      "reading",
      "2026-09-12",
    ),
    1,
  );
});

test("counts a selected-day check in cumulative completions", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-11": { reading: true },
        "2026-09-12": { reading: true },
        "2026-09-13": { reading: true },
      },
      "reading",
      "2026-09-13",
    ),
    3,
  );
});

test("counts historical checks for archived habits", () => {
  assert.equal(
    calculateHabitTotalCompletions(
      {
        "2026-09-12": { archivedHabit: true },
        "2026-09-13": { archivedHabit: true },
      },
      "archivedHabit",
      "2026-09-13",
    ),
    2,
  );
});

test("filters archived habits from visible habit lists", () => {
  assert.deepEqual(
    getVisibleHabits([
      { id: "reading", name: "阅读", note: "", created_at: "2026-09-12T08:00:00.000Z", archived_at: null },
      { id: "sleep", name: "早睡", note: "", created_at: "2026-09-12T09:00:00.000Z", archived_at: "2026-09-13T09:00:00.000Z" },
    ]).map((habit) => habit.id),
    ["reading"],
  );
});

test("builds habit views for the selected day", () => {
  const views = getHabitViews(
    [{ id: "reading", name: "阅读", note: "10min", created_at: "2026-09-12T08:00:00.000Z", archived_at: null }],
    {
      "2026-09-12": { reading: true },
      "2026-09-13": { reading: true },
    },
    "2026-09-13",
  );

  assert.equal(views[0].checked, true);
  assert.equal(views[0].totalCompletions, 2);
  assert.equal(views[0].note, "10min");
});

test("habit views keep cumulative completions when selected day is not checked", () => {
  const views = getHabitViews(
    [{ id: "reading", name: "阅读", note: "10min", created_at: "2026-09-12T08:00:00.000Z", archived_at: null }],
    {
      "2026-09-11": { reading: true },
      "2026-09-12": { reading: true },
    },
    "2026-09-13",
  );

  assert.equal(views[0].checked, false);
  assert.equal(views[0].totalCompletions, 2);
});

test("next day inherits active habit and increments cumulative completions after check", () => {
  const habits = [{ id: "reading", name: "阅读", note: "10min", created_at: "2026-09-14T08:00:00.000Z", archived_at: null }];
  const inheritedViews = getHabitViews(habits, { "2026-09-14": { reading: true } }, "2026-09-15");

  assert.equal(inheritedViews[0].checked, false);
  assert.equal(inheritedViews[0].totalCompletions, 1);

  const checkedTomorrow = setHabitCheckForDay({ "2026-09-14": { reading: true } }, "2026-09-15", "reading", "2026-09-15", true);
  const completedViews = getHabitViews(habits, checkedTomorrow, "2026-09-15");

  assert.equal(completedViews[0].checked, true);
  assert.equal(completedViews[0].totalCompletions, 2);
});

test("counts selected-day habit completion", () => {
  assert.deepEqual(
    getHabitCompletion(
      [
        { id: "reading", name: "阅读", note: "", created_at: "2026-09-12T08:00:00.000Z", archived_at: null },
        { id: "sleep", name: "早睡", note: "", created_at: "2026-09-12T09:00:00.000Z", archived_at: null },
        { id: "archived", name: "归档", note: "", created_at: "2026-09-12T10:00:00.000Z", archived_at: "2026-09-13T10:00:00.000Z" },
      ],
      {
        "2026-09-13": { reading: true, archived: true },
      },
      "2026-09-13",
    ),
    { done: 1, total: 2 },
  );
});

test("toggles today habit check", () => {
  const checked = toggleHabitCheckForDay({}, "2026-09-13", "reading", "2026-09-13");
  assert.deepEqual(checked, { "2026-09-13": { reading: true } });

  const unchecked = toggleHabitCheckForDay(checked, "2026-09-13", "reading", "2026-09-13");
  assert.deepEqual(unchecked, {});
});

test("toggles historical habit check for backfill", () => {
  assert.deepEqual(toggleHabitCheckForDay({}, "2026-09-10", "reading", "2026-09-13"), {
    "2026-09-10": { reading: true },
  });
});

test("sets historical habit check for duplicate-name backfill shortcut", () => {
  assert.deepEqual(setHabitCheckForDay({}, "2026-09-10", "reading", "2026-09-13", true), {
    "2026-09-10": { reading: true },
  });
});

test("setting an already checked habit keeps it checked", () => {
  const checks = { "2026-09-10": { reading: true } };
  assert.deepEqual(setHabitCheckForDay(checks, "2026-09-10", "reading", "2026-09-13", true), checks);
});

test("does not write future habit checks", () => {
  const checks = { "2026-09-13": { reading: true } };
  assert.strictEqual(toggleHabitCheckForDay(checks, "2026-09-14", "reading", "2026-09-13"), checks);
});

test("normalizes old habits without note", () => {
  assert.deepEqual(
    normalizeHabit(
      {
        id: "habit-1",
        name: " 阅读 ",
        created_at: "2026-09-13T08:00:00.000Z",
        archived_at: null,
      },
      () => "generated",
      () => "2026-09-14T08:00:00.000Z",
    ),
    {
      id: "habit-1",
      name: "阅读",
      note: "",
      created_at: "2026-09-13T08:00:00.000Z",
      archived_at: null,
    },
  );
});

test("historical backfill updates cumulative completions for the selected day", () => {
  const checks = toggleHabitCheckForDay(
    {
      "2026-09-11": { reading: true },
      "2026-09-13": { reading: true },
    },
    "2026-09-12",
    "reading",
    "2026-09-13",
  );

  assert.equal(calculateHabitTotalCompletions(checks, "reading", "2026-09-13"), 3);
});
