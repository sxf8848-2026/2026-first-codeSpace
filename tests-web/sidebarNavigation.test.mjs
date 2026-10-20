import assert from "node:assert/strict";
import test from "node:test";
import { SIDEBAR_GROUPS } from "../src/services/sidebarNavigation.ts";

test("groups sidebar views by user intent in the expected order", () => {
  assert.deepEqual(
    SIDEBAR_GROUPS.map((group) => ({
      label: group.label,
      views: group.items.map((item) => item.view),
    })),
    [
      { label: "日常计划", views: ["dashboard", "habits", "daily", "monthly", "delivery"] },
      { label: "阅读灵感", views: ["inspiration", "videoInspiration", "dailyReading", "books"] },
      { label: "成长经验", views: ["metaLearning", "workExperience"] },
      { label: "私人复盘", views: ["argumentReflection", "divorcePlan"] },
    ],
  );
});

test("keeps sidebar views unique and counts only the four summary entries", () => {
  const items = SIDEBAR_GROUPS.flatMap((group) => group.items);
  const views = items.map((item) => item.view);
  assert.equal(new Set(views).size, views.length);
  assert.deepEqual(
    items.filter((item) => "count" in item).map((item) => item.view),
    ["dashboard", "daily", "monthly", "delivery"],
  );
});
