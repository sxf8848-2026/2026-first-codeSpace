import assert from "node:assert/strict";
import test from "node:test";
import { getCarryOverDeliveries } from "../src/services/weeklyDeliveries.ts";

const baseDelivery = {
  id: "delivery-1",
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
      "2026-09-14": [{ ...baseDelivery, id: "old", name: "纸巾" }],
      "2026-09-21": [{ ...baseDelivery, id: "picked", name: "牙刷", picked: true }],
      "2026-09-28": [],
    },
    "2026-10-05",
    [],
  );

  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["old"]);
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
