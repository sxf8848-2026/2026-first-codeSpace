import assert from "node:assert/strict";
import test from "node:test";
import {
  getSidebarGroupLabel,
  SIDEBAR_GROUPS,
  SIDEBAR_PRIMARY_ITEM,
} from "../src/services/sidebarNavigation.ts";

test("groups sidebar views by user intent in the expected order", () => {
  assert.deepEqual(
    SIDEBAR_GROUPS.map((group) => ({
      label: group.label,
      views: group.items.map((item) => item.view),
    })),
    [
      { label: "日常计划", views: ["habits", "daily", "monthly", "delivery"] },
      { label: "阅读灵感", views: ["inspiration", "videoInspiration", "videoNotes", "dailyReading", "books"] },
      { label: "成长经验", views: ["metaLearning", "workExperience"] },
      { label: "私人复盘", views: ["argumentReflection", "divorcePlan"] },
    ],
  );
});

test("keeps dashboard independent and sidebar views unique", () => {
  assert.deepEqual(SIDEBAR_PRIMARY_ITEM, {
    view: "dashboard",
    label: "总控台",
    icon: "dashboard",
    count: "dashboardCount",
  });
  const items = [SIDEBAR_PRIMARY_ITEM, ...SIDEBAR_GROUPS.flatMap((group) => group.items)];
  const views = items.map((item) => item.view);
  assert.equal(new Set(views).size, views.length);
  assert.deepEqual(
    items.filter((item) => "count" in item).map((item) => item.view),
    ["dashboard", "daily", "monthly", "delivery"],
  );
});

test("finds the group that should expand for the active view", () => {
  assert.equal(getSidebarGroupLabel("dashboard"), null);
  assert.equal(getSidebarGroupLabel("habits"), "日常计划");
  assert.equal(getSidebarGroupLabel("dailyReading"), "阅读灵感");
  assert.equal(getSidebarGroupLabel("videoNotes"), "阅读灵感");
  assert.equal(getSidebarGroupLabel("workExperience"), "成长经验");
  assert.equal(getSidebarGroupLabel("divorcePlan"), "私人复盘");
});
