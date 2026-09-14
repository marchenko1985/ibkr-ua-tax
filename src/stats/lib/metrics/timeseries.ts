import type { Setup } from "../setups";
import { summarize } from "./summary";

// Ported from optionslab app/stats/lib/metrics/timeseries.ts

export interface EquityPoint {
  /** YYYY-MM-DD */
  date: string;
  /** realized P/L of the day */
  pnl: number;
  cumulative: number;
  /** running maximum of cumulative */
  peak: number;
  /** peak - cumulative, always >= 0 */
  drawdown: number;
}

/** Cumulative P/L by close date, one point per day with closes */
export function cumulativePnlSeries(setups: readonly Setup[]): EquityPoint[] {
  let cumulative = 0;
  let peak = 0;
  return dailyPnlSeries(setups).map(({ date, pnl }) => {
    cumulative += pnl;
    peak = Math.max(peak, cumulative);
    return { date, pnl, cumulative, peak, drawdown: peak - cumulative };
  });
}

export interface DailyPnlPoint {
  /** YYYY-MM-DD */
  date: string;
  pnl: number;
  count: number;
}

/** P/L and number of closed setups per close date, days without closes are skipped */
export function dailyPnlSeries(setups: readonly Setup[]): DailyPnlPoint[] {
  const byDate = new Map<string, DailyPnlPoint>();
  for (const setup of setups) {
    const day = byDate.get(setup.closeDate) ?? { date: setup.closeDate, pnl: 0, count: 0 };
    byDate.set(setup.closeDate, { date: day.date, pnl: day.pnl + setup.realizedPnl, count: day.count + 1 });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface RollingPoint {
  /** 1-based number of the last setup in the window */
  index: number;
  /** close date of the last setup in the window */
  date: string;
  winRate: number | null;
  profitFactor: number | null;
  expectancy: number | null;
}

export interface RollingMetricsResult {
  window: number;
  /** one point per setup starting from the first full window */
  points: RollingPoint[];
  /** whole period values, reference lines */
  baseline: Omit<RollingPoint, "index" | "date">;
}

/**
 * Win rate, profit factor and expectancy over a window of the last `window` setups, moving one
 * setup at a time (by count, not calendar, so idle periods do not bend the curves).
 */
export function rollingMetrics(setups: readonly Setup[], window: number): RollingMetricsResult {
  const ordered = [...setups].sort((a, b) => a.closedAt.localeCompare(b.closedAt));
  const all = summarize(ordered);
  const points = ordered.slice(window - 1).map((last, i) => {
    const summary = summarize(ordered.slice(i, i + window));
    return { index: i + window, date: last.closeDate, winRate: summary.winRate, profitFactor: finiteOrNull(summary.profitFactor), expectancy: summary.expectancy };
  });
  return { window, points, baseline: { winRate: all.winRate, profitFactor: finiteOrNull(all.profitFactor), expectancy: all.expectancy } };
}

function finiteOrNull(value: number | null) {
  return value !== null && Number.isFinite(value) ? value : null;
}

export interface DrawdownEpisode {
  /** 1-based chronological number */
  index: number;
  peakDate: string;
  peakPnl: number;
  /** deepest point of the episode */
  troughDate: string;
  troughPnl: number;
  /** peakPnl - troughPnl, always >= 0 */
  depth: number;
  /** calendar days from peak to trough */
  durationDays: number;
  /** first day above the peak again, null while the episode is open */
  recoveryDate: string | null;
  recoveryDays: number | null;
  open: boolean;
}

const DAY_MS = 86_400_000;

/**
 * Every peak → trough → recovery cycle of the equity curve, deepest first.
 * An episode still below its peak at the end of the period is open.
 */
export function drawdownEpisodes(setups: readonly Setup[]): DrawdownEpisode[] {
  const series = cumulativePnlSeries(setups);
  const [first] = series;
  if (!first) {
    return [];
  }

  const episodes: DrawdownEpisode[] = [];
  let peak = { date: first.date, pnl: 0 };
  let trough = { date: first.date, pnl: 0 };
  let inEpisode = false;

  const close = (recoveryDate: string | null) => {
    episodes.push({
      index: episodes.length + 1,
      peakDate: peak.date,
      peakPnl: peak.pnl,
      troughDate: trough.date,
      troughPnl: trough.pnl,
      depth: peak.pnl - trough.pnl,
      durationDays: daysBetween(peak.date, trough.date),
      recoveryDate,
      recoveryDays: recoveryDate === null ? null : daysBetween(trough.date, recoveryDate),
      open: recoveryDate === null,
    });
  };

  for (const point of series) {
    if (point.cumulative > peak.pnl) {
      if (inEpisode) {
        close(point.date);
        inEpisode = false;
      }
      peak = { date: point.date, pnl: point.cumulative };
      trough = peak;
    } else if (point.cumulative < peak.pnl) {
      inEpisode = true;
      if (point.cumulative < trough.pnl) {
        trough = { date: point.date, pnl: point.cumulative };
      }
    }
  }
  if (inEpisode) {
    close(null);
  }

  return episodes.sort((a, b) => b.depth - a.depth);
}

function daysBetween(from: string, to: string) {
  return Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS));
}
