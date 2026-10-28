export type RewardRuleStatusFilter = "active" | "all" | "inactive";

export type SortableRewardTier = {
  name: string;
  amount_cents: number;
};

export type SortableRewardRule = {
  id: string;
  name: string;
  mode: "fixed" | "tiered";
  amount_cents: number | null;
  tiers: SortableRewardTier[];
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
  tier_name: string | null;
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
      const mode: SortableRewardRule["mode"] = record.mode === "tiered" ? "tiered" : "fixed";
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        name: typeof record.name === "string" ? record.name.trim() : "",
        mode,
        amount_cents: mode === "fixed" && isPositiveCents(record.amount_cents) ? record.amount_cents : null,
        tiers: mode === "tiered" ? normalizeRewardTiers(record.tiers) : [],
        description: typeof record.description === "string" ? record.description.trim() : "",
        active: typeof record.active === "boolean" ? record.active : true,
        created_at: createdAt,
        updated_at: isDateTimeStamp(record.updated_at) ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.name && (
      record.mode === "fixed"
        ? record.amount_cents !== null
        : record.tiers.length >= 2 && hasStrictlyIncreasingAmounts(record.tiers)
    ));
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
      tier_name: record.tier_name === null || record.tier_name === undefined
        ? null
        : typeof record.tier_name === "string" ? record.tier_name.trim() : "",
      claimed_at: typeof record.claimed_at === "string" ? record.claimed_at : "",
    }))
    .filter((record) => record.rule_id && record.rule_name && record.amount_cents > 0 && record.tier_name !== "" && isLocalDateTime(record.claimed_at));
}

export function buildRewardClaim(
  rule: SortableRewardRule,
  claimedAt: string,
  tier: SortableRewardTier | null = null,
  createId: () => string = () => crypto.randomUUID(),
): SortableRewardClaim {
  if (rule.mode === "tiered" && (!tier || !hasTier(rule, tier))) throw new Error("阶梯奖励必须选择有效档位");
  if (rule.mode === "fixed" && !isPositiveCents(rule.amount_cents)) throw new Error("固定奖励金额无效");
  return {
    id: createId(),
    rule_id: rule.id,
    rule_name: rule.name,
    amount_cents: rule.mode === "tiered" ? tier!.amount_cents : rule.amount_cents!,
    tier_name: rule.mode === "tiered" ? tier!.name : null,
    claimed_at: claimedAt,
  };
}

export function applyRewardClaim<T extends SortableRewardClaim>(
  rule: SortableRewardRule,
  claims: T[],
  claimedAt: string,
  tier: SortableRewardTier | null = null,
  createId: () => string = () => crypto.randomUUID(),
): { claims: Array<T | SortableRewardClaim>; added_cents: number } | null {
  const localDay = claimedAt.slice(0, 10);
  if (!canClaimReward(rule, claims, localDay, tier)) return null;
  const existing = getRewardClaimForDay(claims, rule.id, localDay);
  if (!existing) {
    const claim = buildRewardClaim(rule, claimedAt, tier, createId);
    return { claims: [claim, ...claims], added_cents: claim.amount_cents };
  }
  const updated = {
    ...existing,
    rule_name: rule.name,
    amount_cents: tier!.amount_cents,
    tier_name: tier!.name,
    claimed_at: claimedAt,
  };
  return {
    claims: claims.map((claim) => claim.id === existing.id ? updated : claim),
    added_cents: updated.amount_cents - existing.amount_cents,
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
    .filter((claim) => !normalizedQuery || `${claim.rule_name} ${claim.tier_name ?? ""}`.toLowerCase().includes(normalizedQuery))
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

export function getRewardClaimForDay<T extends SortableRewardClaim>(claims: T[], ruleId: string, localDay: string): T | undefined {
  return claims.find((claim) => claim.rule_id === ruleId && claim.claimed_at.slice(0, 10) === localDay);
}

export function canClaimReward(
  rule: SortableRewardRule,
  claims: SortableRewardClaim[],
  localDay: string,
  tier: SortableRewardTier | null = null,
): boolean {
  if (!rule.active) return false;
  const existing = getRewardClaimForDay(claims, rule.id, localDay);
  if (rule.mode === "fixed") return !existing;
  if (!tier || !hasTier(rule, tier)) return false;
  if (!existing) return true;
  return existing.tier_name !== null && tier.amount_cents > existing.amount_cents;
}

function normalizeRewardTiers(raw: unknown): SortableRewardTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((tier): tier is Partial<SortableRewardTier> => Boolean(tier) && typeof tier === "object")
    .map((tier) => ({
      name: typeof tier.name === "string" ? tier.name.trim() : "",
      amount_cents: isPositiveCents(tier.amount_cents) ? tier.amount_cents : 0,
    }))
    .filter((tier) => tier.name && tier.amount_cents > 0);
}

function hasStrictlyIncreasingAmounts(tiers: SortableRewardTier[]): boolean {
  return tiers.every((tier, index) => index === 0 || tier.amount_cents > tiers[index - 1].amount_cents);
}

function hasTier(rule: SortableRewardRule, tier: SortableRewardTier): boolean {
  return rule.tiers.some((item) => item.name === tier.name && item.amount_cents === tier.amount_cents);
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
