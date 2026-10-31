import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findWeeklyDeliveryBySequence,
  getCarryOverDeliveries,
  normalizeWeeklyDeliverySequence,
  sortWeeklyDeliveriesBySequence,
} from "../src/services/weeklyDeliveries.ts";

const baseDelivery = {
  id: "delivery-1",
  sequence: null,
  name: "书籍",
  platform: "淘宝",
  note: "",
  purchased_at: "2026-10-01",
  picked: false,
  created_at: "2026-10-01T00:00:00.000Z",
  picked_at: null,
};

test("inherits pending deliveries from the closest earlier week with pending records", () => {
  const deliveries = getCarryOverDeliveries(
    {
      "2026-09-14": [{ ...baseDelivery, id: "old", sequence: 99, name: "纸巾" }],
      "2026-09-21": [{ ...baseDelivery, id: "picked", name: "牙刷", picked: true }],
      "2026-09-28": [],
    },
    "2026-10-05",
    [],
  );

  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["old"]);
  assert.equal(deliveries[0].sequence, null);
});

test("does not inherit picked deliveries or duplicates already in the current week", () => {
  const deliveries = getCarryOverDeliveries(
    {
      "2026-09-28": [
        { ...baseDelivery, id: "pending" },
        { ...baseDelivery, id: "picked", name: "牙刷", picked: true },
      ],
    },
    "2026-10-05",
    [{ ...baseDelivery, id: "current", name: " 书籍 ", platform: " 淘宝 " }],
  );

  assert.deepEqual(deliveries, []);
});

test("returns no deliveries when no earlier week has pending records", () => {
  const deliveries = getCarryOverDeliveries(
    {
      "2026-09-21": [{ ...baseDelivery, picked: true }],
      "2026-09-28": [],
    },
    "2026-10-05",
    [],
  );

  assert.deepEqual(deliveries, []);
});

test("sorts numbered deliveries descending and keeps unnumbered deliveries stable at the end", () => {
  const deliveries = [
    { ...baseDelivery, id: "unassigned-1", name: "未编号一" },
    { ...baseDelivery, id: "numbered-8", sequence: 8 },
    { ...baseDelivery, id: "numbered-21", sequence: 21 },
    { ...baseDelivery, id: "unassigned-2", name: "未编号二" },
  ];

  const sorted = sortWeeklyDeliveriesBySequence(deliveries);

  assert.deepEqual(sorted.map((delivery) => delivery.id), ["numbered-21", "numbered-8", "unassigned-1", "unassigned-2"]);
  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["unassigned-1", "numbered-8", "numbered-21", "unassigned-2"]);
});

test("normalizes old or invalid sequences to null without assigning a number", () => {
  assert.equal(normalizeWeeklyDeliverySequence(undefined), null);
  assert.equal(normalizeWeeklyDeliverySequence(0), null);
  assert.equal(normalizeWeeklyDeliverySequence(-1), null);
  assert.equal(normalizeWeeklyDeliverySequence(1.5), null);
  assert.equal(normalizeWeeklyDeliverySequence("128"), null);
  assert.equal(normalizeWeeklyDeliverySequence(128), 128);
});

test("finds sequence conflicts across all weeks and can exclude the edited delivery", () => {
  const weeklyDeliveries = {
    "2026-09-28": [{ ...baseDelivery, id: "older", sequence: 12, name: "旧快递" }],
    "2026-10-05": [{ ...baseDelivery, id: "current", sequence: 20, name: "当前快递" }],
  };

  assert.equal(findWeeklyDeliveryBySequence(weeklyDeliveries, 12)?.id, "older");
  assert.equal(findWeeklyDeliveryBySequence(weeklyDeliveries, 20, "current"), undefined);
});

test("weekly delivery panel exposes sequence inputs and numbered badges", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /sortWeeklyDeliveriesBySequence\(deliveryTasks\.filter\(\(task\) => matchesDeliveryFilter\(task, deliveryFilter\)\)\)/);
  assert.match(component, /aria-label="快递序号"/);
  assert.match(component, /aria-label="编辑快递序号"/);
  assert.match(component, /task\.sequence === null \? "未编号" : `#\$\{task\.sequence\}`/);
  assert.match(styles, /\.delivery-sequence-chip\s*\{/);
  assert.match(styles, /\.delivery-sequence-chip\.unassigned\s*\{/);
});
