import type { Setup } from "../setups";
import { type GroupStat, groupBy } from "./grouping";
import { median, sum } from "./math";

// Ported from optionslab app/stats/lib/metrics/options.ts

export interface HoldingAsPctDteStats {
  sampleSize: number;
  meanRatio: number | null;
  medianRatio: number | null;
  meanHoldingDays: number | null;
  meanDteAtOpen: number | null;
}

/** holdingDays / DTE at open: did the trader let theta work or exit early? Setups opened on expiration day are skipped */
export function holdingAsPctDteStats(setups: readonly Setup[]): HoldingAsPctDteStats {
  const comparable = setups.filter((s) => s.dteAtOpenMin > 0);
  const ratios = comparable.map((s) => s.holdingDays / s.dteAtOpenMin);
  const count = comparable.length;
  return {
    sampleSize: count,
    meanRatio: count > 0 ? sum(ratios) / count : null,
    medianRatio: median(ratios),
    meanHoldingDays: count > 0 ? sum(comparable.map((s) => s.holdingDays)) / count : null,
    meanDteAtOpen: count > 0 ? sum(comparable.map((s) => s.dteAtOpenMin)) / count : null,
  };
}

export interface SingleMultiExpiryStats {
  singleCount: number;
  singlePnl: number;
  singleWinRate: number | null;
  multiCount: number;
  multiPnl: number;
  multiWinRate: number | null;
}

/** Single-expiry setups vs multi-expiry ones (calendars, diagonals) */
export function singleMultiExpiryStats(setups: readonly Setup[]): SingleMultiExpiryStats {
  const single = setups.filter((s) => s.singleExpiry);
  const multi = setups.filter((s) => !s.singleExpiry);
  return {
    singleCount: single.length,
    singlePnl: sum(single.map((s) => s.realizedPnl)),
    singleWinRate: single.length > 0 ? single.filter((s) => s.isWinner).length / single.length : null,
    multiCount: multi.length,
    multiPnl: sum(multi.map((s) => s.realizedPnl)),
    multiWinRate: multi.length > 0 ? multi.filter((s) => s.isWinner).length / multi.length : null,
  };
}

export interface ExpiryWeek extends GroupStat {
  /** Monday, YYYY-MM-DD */
  weekStart: string;
  /** Friday, YYYY-MM-DD */
  weekEnd: string;
}

const FRIDAY_OFFSET = 4;

/** Setups by the week of their earliest expiration: how much of the book rides on a single Friday */
export function expiryWeekExposure(setups: readonly Setup[]): ExpiryWeek[] {
  // groupBy sorts unordered keys, YYYY-MM-DD keys sort by date
  return groupBy(setups, (s) => mondayOf(s.minExpiry)).map((stat) => ({ ...stat, weekStart: stat.key, weekEnd: addDays(stat.key, FRIDAY_OFFSET) }));
}

const SUNDAY_TO_MONDAY = -6;

function mondayOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, day === 0 ? SUNDAY_TO_MONDAY : 1 - day);
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, "YYYY-MM-DD".length);
}
