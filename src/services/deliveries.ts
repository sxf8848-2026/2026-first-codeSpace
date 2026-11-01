import type { DeliveryRecord, DeliveryStatus } from "../types";

export type DeliveryStatusFilter = "all" | DeliveryStatus;

export function normalizeDeliveryStatus(status: unknown, legacyPicked: unknown): DeliveryStatus {
  if (status === "pending" || status === "picked" || status === "returned") return status;
  return legacyPicked === true ? "picked" : "pending";
}

export function normalizeDeliverySequence(sequence: unknown): number | null {
  return typeof sequence === "number" && Number.isInteger(sequence) && sequence > 0 ? sequence : null;
}

export function migrateLegacyWeeklyDeliveries(weeklyDeliveries: unknown): unknown[] {
  if (!weeklyDeliveries || typeof weeklyDeliveries !== "object" || Array.isArray(weeklyDeliveries)) return [];
  return Object.entries(weeklyDeliveries as Record<string, unknown>)
    .sort(([leftWeek], [rightWeek]) => rightWeek.localeCompare(leftWeek))
    .flatMap(([, deliveries]) => (Array.isArray(deliveries) ? deliveries : []));
}

export function sortDeliveriesBySequence<T extends DeliveryRecord>(deliveries: T[]): T[] {
  return deliveries
    .map((delivery, index) => ({ delivery, index }))
    .sort((left, right) => {
      const leftSequence = left.delivery.sequence;
      const rightSequence = right.delivery.sequence;
      if (leftSequence !== null && rightSequence !== null) return rightSequence - leftSequence || left.index - right.index;
      if (leftSequence !== null) return -1;
      if (rightSequence !== null) return 1;
      return left.index - right.index;
    })
    .map(({ delivery }) => delivery);
}

export function findDeliveryBySequence(
  deliveries: DeliveryRecord[],
  sequence: number,
  excludeId: string | null = null,
): DeliveryRecord | undefined {
  return deliveries.find((delivery) => delivery.sequence === sequence && delivery.id !== excludeId);
}

export function getVisibleDeliveries(
  deliveries: DeliveryRecord[],
  filter: DeliveryStatusFilter,
  query: string,
): DeliveryRecord[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return sortDeliveriesBySequence(
    deliveries.filter((delivery) => {
      if (filter !== "all" && delivery.status !== filter) return false;
      return !normalizedQuery || delivery.name.toLocaleLowerCase().includes(normalizedQuery);
    }),
  );
}
