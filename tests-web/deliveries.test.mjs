import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findDeliveryBySequence,
  getArchivedDeliveries,
  getDeliveryStatusColumns,
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
  archived_at: null,
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

test("groups name search results into status columns and applies sequence order within each column", () => {
  const deliveries = [
    { ...baseDelivery, id: "pending-low", sequence: 2, name: "USB Cable" },
    { ...baseDelivery, id: "picked-high", sequence: 8, name: "usb hub", status: "picked" },
    { ...baseDelivery, id: "returned-middle", sequence: 6, name: "USB charger", status: "returned" },
    { ...baseDelivery, id: "note-only", sequence: 12, name: "纸巾", note: "USB" },
  ];

  const columns = getDeliveryStatusColumns(deliveries, "  USB ");

  assert.deepEqual(columns.pending.map((item) => item.id), ["pending-low"]);
  assert.deepEqual(columns.picked.map((item) => item.id), ["picked-high"]);
  assert.deepEqual(columns.returned.map((item) => item.id), ["returned-middle"]);
  assert.deepEqual(getDeliveryStatusColumns(deliveries, "不存在").pending, []);
  assert.deepEqual(getDeliveryStatusColumns(deliveries, "").pending.map((item) => item.id), ["note-only", "pending-low"]);
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

test("lists archived deliveries by archive time and searches only their names", () => {
  const deliveries = [
    { ...baseDelivery, id: "active", name: "当前快递", status: "picked" },
    { ...baseDelivery, id: "first", name: "旧书", status: "picked", archived_at: "2026-11-01T08:00:00.000Z" },
    { ...baseDelivery, id: "latest", name: "新书", status: "returned", archived_at: "2026-11-02T08:00:00.000Z" },
    { ...baseDelivery, id: "same-time", name: "相同时间", status: "picked", archived_at: "2026-11-02T08:00:00.000Z" },
  ];

  assert.deepEqual(getArchivedDeliveries(deliveries, "书").map((delivery) => delivery.id), ["latest", "first"]);
  assert.deepEqual(getArchivedDeliveries(deliveries, "  新书 ").map((delivery) => delivery.id), ["latest"]);
  assert.deepEqual(getArchivedDeliveries(deliveries, "当前").map((delivery) => delivery.id), []);
  assert.deepEqual(getArchivedDeliveries(deliveries, "").map((delivery) => delivery.id), ["latest", "same-time", "first"]);
  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["active", "first", "latest", "same-time"]);
});

test("delivery management exposes a three-column status board, global search and missing purchase date text", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /getDeliveryStatusColumns\(deliveryTasks, deliveryQuery\)/);
  assert.match(app, /getArchivedDeliveries\(allDeliveries, deliveryQuery\)/);
  assert.match(app, /function archiveDelivery\(deliveryId: string\)/);
  assert.match(app, /function restoreDelivery\(deliveryId: string\)/);
  assert.doesNotMatch(app, /deliveryFilter/);
  assert.match(component, /<h1>快递管理<\/h1>/);
  assert.match(component, /\["current", "当前快递"\]/);
  assert.match(component, /\["archived", `已归档（\$\{archivedTotalCount\}）`\]/);
  assert.match(component, /title="归档快递"/);
  assert.match(component, /title="恢复快递"/);
  assert.match(component, /归档时间：/);
  assert.match(component, /placeholder="搜索快递名称"/);
  assert.match(component, /\{query \? \(/);
  assert.match(component, /onClick=\{\(\) => onQueryChange\(""\)\} aria-label="清空快递搜索"/);
  assert.match(component, /<option value="returned">退货<\/option>/);
  assert.match(component, /task\.status === "pending"/);
  assert.match(component, /task\.status === "picked"/);
  assert.match(component, /task\.status === "returned"/);
  assert.match(component, /delivery-status-board/);
  assert.match(component, /title: "未取"/);
  assert.match(component, /title: "已取"/);
  assert.match(component, /title: "退货"/);
  assert.match(component, /returnedCount/);
  assert.match(component, /购买时间未填写/);
  assert.match(component, /type="number"\s+step="1"\s+required\s+value=\{draft\.sequence\}/);
  assert.match(component, /type="number"\s+step="1"\s+value=\{editingDraft\.sequence\}/);
  assert.match(app, /快递序号只能填写非 0 整数。/);
  assert.doesNotMatch(component, /继承未取快递|每周快递历史查询/);
  assert.match(styles, /\.delivery-search-clear\s*{[^}]*min-height:\s*28px/s);
  assert.match(styles, /\.delivery-status-board\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(320px, 1fr\)\);[^}]*overflow-x:\s*auto;/s);
  assert.match(styles, /\.delivery-status-column\s*{[^}]*align-content:\s*start;[^}]*min-width:\s*320px;/s);
  assert.match(styles, /\.delivery-item\.picked strong\s*{[^}]*color:\s*var\(--text\);[^}]*text-decoration:\s*line-through;/s);
  assert.match(styles, /\.delivery-archive-list\s*{[^}]*display:\s*grid;/s);
  assert.match(styles, /\.delivery-status-label\.returned\s*{[^}]*color:\s*var\(--danger\);/s);
});
