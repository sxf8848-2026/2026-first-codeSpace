export type RewardRuleStatusFilter = "active" | "all" | "inactive";

export type SortableRewardRule = {
  id: string;
  name: string;
  amount_cents: number;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SortableRewardClaim = {
  id: string;
  rule_id: string;
  rule_name: string;
  amount_cents: number;
  claimed_at: string;
};

export function normalizeRewardRules(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableRewardRule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableRewardRule> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isDateTimeStamp(record.created_at) ? record.created_at : createStamp();
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        name: typeof record.name === "string" ? record.name.trim() : "",
        amount_cents: isPositiveCents(record.amount_cents) ? record.amount_cents : 0,
        description: typeof record.description === "string" ? record.description.trim() : "",
        active: typeof record.active === "boolean" ? record.active : true,
        created_at: createdAt,
        updated_at: isDateTimeStamp(record.updated_at) ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.name && record.amount_cents > 0);
}

export function normalizeRewardClaims(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
): SortableRewardClaim[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableRewardClaim> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      rule_id: typeof record.rule_id === "string" ? record.rule_id : "",
      rule_name: typeof record.rule_name === "string" ? record.rule_name.trim() : "",
      amount_cents: isPositiveCents(record.amount_cents) ? record.amount_cents : 0,
      claimed_at: typeof record.claimed_at === "string" ? record.claimed_at : "",
    }))
    .filter((record) => record.rule_id && record.rule_name && record.amount_cents > 0 && isLocalDateTime(record.claimed_at));
}

export function buildRewardClaim(
  rule: SortableRewardRule,
  claimedAt: string,
  createId: () => string = () => crypto.randomUUID(),
): SortableRewardClaim {
  return {
    id: createId(),
    rule_id: rule.id,
    rule_name: rule.name,
    amount_cents: rule.amount_cents,
    claimed_at: claimedAt,
  };
}

export function getVisibleRewardRules<T extends SortableRewardRule>(
  rules: T[],
  query = "",
  statusFilter: RewardRuleStatusFilter = "active",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return rules
    .filter((rule) => statusFilter === "all" || (statusFilter === "active" ? rule.active : !rule.active))
    .filter((rule) => !normalizedQuery || `${rule.name} ${rule.description}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => Number(second.active) - Number(first.active) || timestamp(second.created_at) - timestamp(first.created_at));
}

export function getVisibleRewardClaims<T extends SortableRewardClaim>(claims: T[], query = "", monthFilter = "all"): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return claims
    .filter((claim) => monthFilter === "all" || claim.claimed_at.startsWith(monthFilter))
    .filter((claim) => !normalizedQuery || claim.rule_name.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => second.claimed_at.localeCompare(first.claimed_at));
}

export function getRewardClaimMonths(claims: SortableRewardClaim[]): string[] {
  return Array.from(new Set(claims.map((claim) => claim.claimed_at.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month))))
    .sort((first, second) => second.localeCompare(first));
}

export function getRewardTotals(claims: SortableRewardClaim[], currentMonth: string): { monthCents: number; totalCents: number } {
  return claims.reduce((totals, claim) => ({
    monthCents: totals.monthCents + (claim.claimed_at.startsWith(currentMonth) ? claim.amount_cents : 0),
    totalCents: totals.totalCents + claim.amount_cents,
  }), { monthCents: 0, totalCents: 0 });
}

export function canClaimReward(rule: SortableRewardRule, claims: SortableRewardClaim[], localDay: string): boolean {
  return rule.active && !claims.some((claim) => claim.rule_id === rule.id && claim.claimed_at.slice(0, 10) === localDay);
}

function isPositiveCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isLocalDateTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
