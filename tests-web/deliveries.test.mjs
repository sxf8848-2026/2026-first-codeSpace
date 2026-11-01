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

test("sorts numbered deliveries descending and keeps unnumbered deliveries stable at the end", () => {
  const deliveries = [
    { ...baseDelivery, id: "unassigned-1", name: "未编号一" },
    { ...baseDelivery, id: "numbered-8", sequence: 8 },
    { ...baseDelivery, id: "numbered-21", sequence: 21 },
    { ...baseDelivery, id: "unassigned-2", name: "未编号二" },
  ];

  const sorted = sortDeliveriesBySequence(deliveries);

  assert.deepEqual(sorted.map((delivery) => delivery.id), ["numbered-21", "numbered-8", "unassigned-1", "unassigned-2"]);
  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["unassigned-1", "numbered-8", "numbered-21", "unassigned-2"]);
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
  for (const sequence of [undefined, 0, -1, 1.5, "128"]) assert.equal(normalizeDeliverySequence(sequence), null);
  assert.equal(normalizeDeliverySequence(128), 128);

  const deliveries = [
    { ...baseDelivery, id: "older", sequence: 12 },
    { ...baseDelivery, id: "current", sequence: 20 },
  ];
  assert.equal(findDeliveryBySequence(deliveries, 12)?.id, "older");
  assert.equal(findDeliveryBySequence(deliveries, 20, "current"), undefined);
});

test("delivery management exposes global search, totals and missing purchase date text", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /getVisibleDeliveries\(deliveryTasks, deliveryFilter, deliveryQuery\)/);
  assert.match(component, /<h1>快递管理<\/h1>/);
  assert.match(component, /placeholder="搜索快递名称"/);
  assert.match(component, /<option value="returned">退货<\/option>/);
  assert.match(component, /task\.status === "pending"/);
  assert.match(component, /task\.status === "picked"/);
  assert.match(component, /购买时间未填写/);
  assert.doesNotMatch(component, /继承未取快递|每周快递历史查询/);
  assert.match(styles, /\.delivery-item\.picked strong\s*{[^}]*color:\s*var\(--text\);[^}]*text-decoration:\s*line-through;/s);
});
