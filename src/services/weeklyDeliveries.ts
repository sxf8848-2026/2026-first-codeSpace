import type { WeeklyDelivery } from "../types";

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
  return sourceWeek[1].filter((delivery) => !delivery.picked && !existing.has(deliveryKey(delivery)));
}

function deliveryKey(delivery: Pick<WeeklyDelivery, "name" | "platform">): string {
  return `${delivery.name.trim().toLowerCase()}::${delivery.platform.trim().toLowerCase()}`;
}
