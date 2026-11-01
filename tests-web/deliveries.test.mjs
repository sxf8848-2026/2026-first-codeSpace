import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findDeliveryBySequence,
  getVisibleDeliveries,
  normalizeDeliverySequence,
  normalizeDeliveryStatus,
  sortDeliveriesBySequence,
} from "../src/services/deliveries.ts";

const baseDelivery = {
  id: "delivery-1",
  sequence: null,
  name: "书籍",
  platform: "淘宝",
  note: "",
  purchased_at: "2026-10-01",
  status: "pending",
  created_at: "2026-10-01T00:00:00.000Z",
  picked_at: null,
};

test("sorts positive then negative sequences descending and keeps unnumbered deliveries stable at the end", () => {
  const deliveries = [
    { ...baseDelivery, id: "unassigned-1", name: "未编号一" },
    { ...baseDelivery, id: "negative-3", sequence: -3 },
    { ...baseDelivery, id: "numbered-8", sequence: 8 },
    { ...baseDelivery, id: "numbered-21", sequence: 21 },
    { ...baseDelivery, id: "negative-1", sequence: -1 },
    { ...baseDelivery, id: "unassigned-2", name: "未编号二" },
  ];

  const sorted = sortDeliveriesBySequence(deliveries);

  assert.deepEqual(sorted.map((delivery) => delivery.id), [
    "numbered-21",
    "numbered-8",
    "negative-1",
    "negative-3",
    "unassigned-1",
    "unassigned-2",
  ]);
  assert.deepEqual(deliveries.map((delivery) => delivery.id), [
    "unassigned-1",
    "negative-3",
    "numbered-8",
    "numbered-21",
    "negative-1",
    "unassigned-2",
  ]);
});

test("filters by name and delivery status before applying sequence order", () => {
  const deliveries = [
    { ...baseDelivery, id: "pending-low", sequence: 2, name: "USB Cable" },
    { ...baseDelivery, id: "picked-high", sequence: 8, name: "usb hub", status: "picked" },
    { ...baseDelivery, id: "returned-middle", sequence: 6, name: "USB charger", status: "returned" },
    { ...baseDelivery, id: "note-only", sequence: 12, name: "纸巾", note: "USB" },
  ];

  assert.deepEqual(getVisibleDeliveries(deliveries, "all", "  USB ").map((item) => item.id), ["picked-high", "returned-middle", "pending-low"]);
  assert.deepEqual(getVisibleDeliveries(deliveries, "pending", "usb").map((item) => item.id), ["pending-low"]);
  assert.deepEqual(getVisibleDeliveries(deliveries, "picked", "usb").map((item) => item.id), ["picked-high"]);
  assert.deepEqual(getVisibleDeliveries(deliveries, "returned", "usb").map((item) => item.id), ["returned-middle"]);
  assert.deepEqual(deliveries.map((item) => item.id), ["pending-low", "picked-high", "returned-middle", "note-only"]);
});

test("normalizes legacy picked flags and keeps the returned status", () => {
  assert.equal(normalizeDeliveryStatus(undefined, false), "pending");
  assert.equal(normalizeDeliveryStatus(undefined, true), "picked");
  assert.equal(normalizeDeliveryStatus("returned", false), "returned");
  assert.equal(normalizeDeliveryStatus("invalid", true), "picked");
});

test("normalizes invalid sequences and finds global conflicts", () => {
  for (const sequence of [undefined, null, 0, 1.5, "128", Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(normalizeDeliverySequence(sequence), null);
  }
  for (const sequence of [128, -1, -20, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]) {
    assert.equal(normalizeDeliverySequence(sequence), sequence);
  }

  const deliveries = [
    { ...baseDelivery, id: "older", sequence: 12 },
    { ...baseDelivery, id: "negative", sequence: -1 },
    { ...baseDelivery, id: "current", sequence: 20 },
  ];
  assert.equal(findDeliveryBySequence(deliveries, 12)?.id, "older");
  assert.equal(findDeliveryBySequence(deliveries, -1)?.id, "negative");
  assert.equal(findDeliveryBySequence(deliveries, 20, "current"), undefined);
});

test("delivery management exposes global search, totals and missing purchase date text", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /getVisibleDeliveries\(deliveryTasks, deliveryFilter, deliveryQuery\)/);
  assert.match(component, /<h1>快递管理<\/h1>/);
  assert.match(component, /placeholder="搜索快递名称"/);
  assert.match(component, /\{query \? \(/);
  assert.match(component, /onClick=\{\(\) => onQueryChange\(""\)\} aria-label="清空快递搜索"/);
  assert.match(component, /<option value="returned">退货<\/option>/);
  assert.match(component, /task\.status === "pending"/);
  assert.match(component, /task\.status === "picked"/);
  assert.match(component, /购买时间未填写/);
  assert.match(component, /type="number"\s+step="1"\s+required\s+value=\{draft\.sequence\}/);
  assert.match(component, /type="number"\s+step="1"\s+value=\{editingDraft\.sequence\}/);
  assert.match(app, /快递序号只能填写非 0 整数。/);
  assert.doesNotMatch(component, /继承未取快递|每周快递历史查询/);
  assert.match(styles, /\.delivery-search-clear\s*{[^}]*min-height:\s*28px/s);
  assert.match(styles, /\.delivery-item\.picked strong\s*{[^}]*color:\s*var\(--text\);[^}]*text-decoration:\s*line-through;/s);
});
