import type { WeeklyDelivery } from "../types";

export function normalizeWeeklyDeliverySequence(sequence: unknown): number | null {
  return typeof sequence === "number" && Number.isInteger(sequence) && sequence > 0 ? sequence : null;
}

export function sortWeeklyDeliveriesBySequence<T extends WeeklyDelivery>(deliveries: T[]): T[] {
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

export function findWeeklyDeliveryBySequence(
  weeklyDeliveries: Record<string, WeeklyDelivery[]>,
  sequence: number,
  excludeId: string | null = null,
): WeeklyDelivery | undefined {
  return Object.values(weeklyDeliveries)
    .flat()
    .find((delivery) => delivery.sequence === sequence && delivery.id !== excludeId);
}

export function getCarryOverDeliveries(
  weeklyDeliveries: Record<string, WeeklyDelivery[]>,
  currentWeek: string,
  currentDeliveries: WeeklyDelivery[],
): WeeklyDelivery[] {
  const sourceWeek = Object.entries(weeklyDeliveries)
    .filter(([week, deliveries]) => week < currentWeek && deliveries.some((delivery) => !delivery.picked))
    .sort(([leftWeek], [rightWeek]) => rightWeek.localeCompare(leftWeek))[0];
  if (!sourceWeek) return [];

  const existing = new Set(currentDeliveries.map(deliveryKey));
  return sourceWeek[1]
    .filter((delivery) => !delivery.picked && !existing.has(deliveryKey(delivery)))
    .map((delivery) => ({ ...delivery, sequence: null }));
}

function deliveryKey(delivery: Pick<WeeklyDelivery, "name" | "platform">): string {
  return `${delivery.name.trim().toLowerCase()}::${delivery.platform.trim().toLowerCase()}`;
}
