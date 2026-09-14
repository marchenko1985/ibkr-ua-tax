import type { Setup } from "../setups";
import { perStrategyStats } from "./grouping";

// Ported from optionslab app/stats/lib/metrics/options.ts

export interface CrosstabCell {
  count: number;
  sumPnl: number;
  winRate: number | null;
}

export interface StrategyCrosstab {
  /** rows, most used strategies first */
  strategies: string[];
  columns: string[];
  /** cells[row][column], empty cells have count 0 */
  cells: CrosstabCell[][];
  maxAbsPnl: number;
  totalCount: number;
}

/** P/L of the most used strategies split by a bucket, e.g. DTE at open or holding period */
export function strategyCrosstab(setups: readonly Setup[], columnKey: (s: Setup) => string, columns: readonly string[], limit: number): StrategyCrosstab {
  const strategies = perStrategyStats(setups)
    .slice(0, limit)
    .map((stat) => stat.name);
  const cells = strategies.map((strategy) => columns.map((column) => crosstabCell(setups.filter((s) => s.strategyName === strategy && columnKey(s) === column))));
  const flat = cells.flat();
  return {
    strategies,
    columns: [...columns],
    cells,
    maxAbsPnl: Math.max(0, ...flat.map((cell) => Math.abs(cell.sumPnl))),
    totalCount: flat.reduce((acc, cell) => acc + cell.count, 0),
  };
}

function crosstabCell(setups: readonly Setup[]): CrosstabCell {
  const count = setups.length;
  return {
    count,
    sumPnl: setups.reduce((acc, s) => acc + s.realizedPnl, 0),
    winRate: count > 0 ? setups.filter((s) => s.isWinner).length / count : null,
  };
}

export interface FrontierPoint {
  name: string;
  count: number;
  sumPnl: number;
  winRate: number;
  /** average win / average loss */
  payoffRatio: number;
  /** above the break-even curve: profitable by structure */
  aboveBreakeven: boolean;
}

/**
 * Strategies as win rate × payoff ratio points. Strategies with fewer than minCount setups, or
 * without both winners and losers, have no meaningful payoff ratio and are skipped.
 */
export function strategyFrontierPoints(setups: readonly Setup[], minCount: number): FrontierPoint[] {
  const points: FrontierPoint[] = [];
  for (const stat of perStrategyStats(setups).filter((s) => s.count >= minCount && s.winners > 0 && s.losers > 0)) {
    const pnls = setups.filter((s) => s.strategyName === stat.name).map((s) => s.realizedPnl);
    const averageWin = sum(pnls.filter((pnl) => pnl > 0)) / stat.winners;
    const averageLoss = -sum(pnls.filter((pnl) => pnl < 0)) / stat.losers;
    const winRate = stat.winners / stat.count;
    const payoffRatio = averageWin / averageLoss;
    points.push({ name: stat.name, count: stat.count, sumPnl: stat.sumPnl, winRate, payoffRatio, aboveBreakeven: payoffRatio > breakEvenPayoff(winRate) });
  }
  return points;
}

/** payoff ratio at which a strategy with this win rate makes zero: winRate·payoff = 1 − winRate */
export function breakEvenPayoff(winRate: number): number {
  return (1 - winRate) / winRate;
}

function sum(values: readonly number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}
