import type { DeliveryRecord, DeliveryStatus } from "../types";

export type DeliveryStatusColumns = Record<DeliveryStatus, DeliveryRecord[]>;

export function normalizeDeliveryStatus(status: unknown, legacyPicked: unknown): DeliveryStatus {
  if (status === "pending" || status === "picked" || status === "returned") return status;
  return legacyPicked === true ? "picked" : "pending";
}

export function normalizeDeliverySequence(sequence: unknown): number | null {
  return typeof sequence === "number" && Number.isSafeInteger(sequence) && sequence !== 0 ? sequence : null;
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

export function getDeliveryStatusColumns(deliveries: DeliveryRecord[], query: string): DeliveryStatusColumns {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchedDeliveries = deliveries.filter(
    (delivery) => !normalizedQuery || delivery.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  return {
    pending: sortDeliveriesBySequence(matchedDeliveries.filter((delivery) => delivery.status === "pending")),
    picked: sortDeliveriesBySequence(matchedDeliveries.filter((delivery) => delivery.status === "picked")),
    returned: sortDeliveriesBySequence(matchedDeliveries.filter((delivery) => delivery.status === "returned")),
  };
}

export function getArchivedDeliveries(deliveries: DeliveryRecord[], query: string): DeliveryRecord[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return deliveries
    .map((delivery, index) => ({ delivery, index }))
    .filter(({ delivery }) => Boolean(delivery.archived_at))
    .filter(({ delivery }) => !normalizedQuery || delivery.name.toLocaleLowerCase().includes(normalizedQuery))
    .sort((left, right) => {
      const leftArchivedAt = left.delivery.archived_at ?? "";
      const rightArchivedAt = right.delivery.archived_at ?? "";
      return rightArchivedAt.localeCompare(leftArchivedAt) || left.index - right.index;
    })
    .map(({ delivery }) => delivery);
}
