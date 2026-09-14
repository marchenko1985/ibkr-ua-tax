import type { Setup } from "../setups";
import { mean } from "./math";

// Ported from optionslab app/stats/lib/metrics/grouping.ts

export interface GroupStat {
  key: string;
  count: number;
  sumPnl: number;
  winners: number;
  losers: number;
  winRate: number | null;
  avgPnl: number | null;
}

/**
 * Stats of setups grouped by keyFn (null skips a setup). Keys listed in order come first
 * in that order (ordinal buckets like DTE), the rest follow sorted.
 */
export function groupBy(setups: readonly Setup[], keyFn: (s: Setup) => string | null, order: readonly string[] = []): GroupStat[] {
  const buckets = new Map<string, Setup[]>();
  for (const setup of setups) {
    const key = keyFn(setup);
    if (key !== null) {
      buckets.set(key, [...(buckets.get(key) ?? []), setup]);
    }
  }

  const ordered = order.filter((key) => buckets.has(key));
  const rest = [...buckets.keys()].filter((key) => !order.includes(key)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest].map((key) => groupStat(key, buckets.get(key) ?? []));
}

function groupStat(key: string, rows: readonly Setup[]): GroupStat {
  const count = rows.length;
  const sumPnl = rows.reduce((acc, s) => acc + s.realizedPnl, 0);
  const winners = rows.filter((s) => s.isWinner).length;
  return {
    key,
    count,
    sumPnl,
    winners,
    losers: rows.filter((s) => s.isLoser).length,
    winRate: count > 0 ? winners / count : null,
    avgPnl: count > 0 ? sumPnl / count : null,
  };
}

export interface StrategyStat extends GroupStat {
  name: string;
  slug: string;
}

/** Per-strategy stats sorted by setups count, most used first */
export function perStrategyStats(setups: readonly Setup[]): StrategyStat[] {
  return groupBy(setups, (s) => s.strategyName)
    .map((stat) => {
      const first = setups.find((s) => s.strategyName === stat.key);
      return { ...stat, name: stat.key, slug: first?.strategySlug ?? "" };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export interface SymbolStat extends GroupStat {
  avgHoldingDays: number | null;
}

/** Per-underlying stats, largest absolute P/L first */
export function perSymbolStats(setups: readonly Setup[]): SymbolStat[] {
  return groupBy(setups, (s) => s.underlyingSymbol)
    .map((stat) => ({ ...stat, avgHoldingDays: mean(setups.filter((s) => s.underlyingSymbol === stat.key).map((s) => s.holdingDays)) }))
    .sort((a, b) => Math.abs(b.sumPnl) - Math.abs(a.sumPnl));
}

export interface WaterfallPoint {
  symbol: string;
  /** invisible stacked bar lifting the visible one to the running total */
  base: number;
  /** visible bar height, always positive */
  delta: number;
  pnl: number;
  /** running total after this symbol */
  cumulative: number;
}

/** Largest-impact symbols, winners first, each bar floating at the running total */
export function waterfallBySymbol(setups: readonly Setup[], limit: number): WaterfallPoint[] {
  const top = perSymbolStats(setups)
    .slice(0, limit)
    .sort((a, b) => b.sumPnl - a.sumPnl);
  const points: WaterfallPoint[] = [];
  let running = 0;
  for (const stat of top) {
    // a loss bar hangs down from the previous total, so it starts at the new, lower total
    const base = stat.sumPnl >= 0 ? running : running + stat.sumPnl;
    running += stat.sumPnl;
    points.push({ symbol: stat.key, base, delta: Math.abs(stat.sumPnl), pnl: stat.sumPnl, cumulative: running });
  }
  return points;
}
