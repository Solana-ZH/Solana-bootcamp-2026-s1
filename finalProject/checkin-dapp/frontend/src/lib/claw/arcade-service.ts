import type { Prize, RoundResult } from "@/types/claw";

const STORAGE_KEY_PREFIX = "claw_arcade_v1";
const SECONDS_PER_DAY = 86400;

export type QuotaInfo = {
  remaining: number;
  dailyLimit: number;
  dayIndex: number;
};

export type ArcadeQuotaPolicy = {
  guestDailyLimit: number;
  uncheckedDailyLimit: number;
  checkedDailyLimit: number;
};

export interface ArcadeService {
  getQuota(params: { address: string | null; checkedInToday: boolean }): QuotaInfo;
  consumeQuota(params: { address: string | null; checkedInToday: boolean }): QuotaInfo;
  /**
   * 重置当天的已用次数（仅影响本机 localStorage，不会上链）。
   */
  resetQuota(params: { address: string | null; dayIndex?: number }): void;
  getInventory(params: { address: string | null }): Prize[];
  addPrize(params: { address: string | null; prize: Prize }): Prize[];
  getHistory(params: { address: string | null }): RoundResult[];
  addHistory(params: { address: string | null; round: RoundResult; max: number }): RoundResult[];
}

function getUtcDayIndexFromMs(timestampMs: number): number {
  return Math.floor(timestampMs / 1000 / SECONDS_PER_DAY);
}

function getNowUtcDayIndex(): number {
  return getUtcDayIndexFromMs(Date.now());
}

function getAddressKey(address: string | null): string {
  return address?.trim() ? address.trim() : "guest";
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export class LocalStorageArcadeService implements ArcadeService {
  private policy: ArcadeQuotaPolicy;

  constructor(policy?: Partial<ArcadeQuotaPolicy>) {
    this.policy = {
      guestDailyLimit: 1,
      uncheckedDailyLimit: 1,
      checkedDailyLimit: 3,
      ...policy,
    };
  }

  getQuota(params: { address: string | null; checkedInToday: boolean }): QuotaInfo {
    const addressKey = getAddressKey(params.address);
    const dayIndex = getNowUtcDayIndex();
    const dailyLimit = this.getDailyLimit({ addressKey, checkedInToday: params.checkedInToday });
    const used = this.getUsedCount({ addressKey, dayIndex });
    const remaining = Math.max(0, dailyLimit - used);
    return { remaining, dailyLimit, dayIndex };
  }

  consumeQuota(params: { address: string | null; checkedInToday: boolean }): QuotaInfo {
    const quota = this.getQuota(params);
    if (quota.remaining <= 0) return quota;
    const addressKey = getAddressKey(params.address);
    this.setUsedCount({ addressKey, dayIndex: quota.dayIndex, used: quota.dailyLimit - quota.remaining + 1 });
    return this.getQuota(params);
  }

  resetQuota(params: { address: string | null; dayIndex?: number }): void {
    const addressKey = getAddressKey(params.address);
    const dayIndex = params.dayIndex ?? getNowUtcDayIndex();
    const key = `${STORAGE_KEY_PREFIX}:quota_used:${addressKey}:${dayIndex}`;
    if (!isBrowser()) return;
    localStorage.removeItem(key);
  }

  getInventory(params: { address: string | null }): Prize[] {
    const addressKey = getAddressKey(params.address);
    const key = `${STORAGE_KEY_PREFIX}:inventory:${addressKey}`;
    if (!isBrowser()) return [];
    return safeJsonParse<Prize[]>(localStorage.getItem(key), []);
  }

  addPrize(params: { address: string | null; prize: Prize }): Prize[] {
    const addressKey = getAddressKey(params.address);
    const key = `${STORAGE_KEY_PREFIX}:inventory:${addressKey}`;
    const existing = this.getInventory({ address: params.address });
    const next = [params.prize, ...existing];
    if (isBrowser()) localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  getHistory(params: { address: string | null }): RoundResult[] {
    const addressKey = getAddressKey(params.address);
    const key = `${STORAGE_KEY_PREFIX}:history:${addressKey}`;
    if (!isBrowser()) return [];
    const result = safeJsonParse<RoundResult[]>(localStorage.getItem(key), []);
    return Array.isArray(result) ? result : [];
  }

  addHistory(params: { address: string | null; round: RoundResult; max: number }): RoundResult[] {
    const addressKey = getAddressKey(params.address);
    const key = `${STORAGE_KEY_PREFIX}:history:${addressKey}`;
    const existing = this.getHistory({ address: params.address });
    const next = [params.round, ...existing].slice(0, Math.max(1, params.max));
    if (isBrowser()) localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  private getDailyLimit(params: { addressKey: string; checkedInToday: boolean }): number {
    if (params.addressKey === "guest") return this.policy.guestDailyLimit;
    return params.checkedInToday ? this.policy.checkedDailyLimit : this.policy.uncheckedDailyLimit;
  }

  private getUsedCount(params: { addressKey: string; dayIndex: number }): number {
    const key = `${STORAGE_KEY_PREFIX}:quota_used:${params.addressKey}:${params.dayIndex}`;
    if (!isBrowser()) return 0;
    const raw = localStorage.getItem(key);
    const parsed = raw ? Number(raw) : 0;
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  }

  private setUsedCount(params: { addressKey: string; dayIndex: number; used: number }): void {
    const key = `${STORAGE_KEY_PREFIX}:quota_used:${params.addressKey}:${params.dayIndex}`;
    if (!isBrowser()) return;
    localStorage.setItem(key, String(Math.max(0, Math.floor(params.used))));
  }
}

export const localStorageArcadeService = new LocalStorageArcadeService();
