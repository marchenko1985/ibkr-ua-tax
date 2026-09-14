import { daysBetween, type Setup } from "../setups";
import { mean, median } from "./math";

// Ported from optionslab app/stats/lib/metrics/behavioral.ts

export interface DispositionStats {
  winnerCount: number;
  loserCount: number;
  winnerMeanHoldingDays: number | null;
  loserMeanHoldingDays: number | null;
  winnerMedianHoldingDays: number | null;
  loserMedianHoldingDays: number | null;
  /** winner mean hold / loser mean hold: above 1 winners are held longer, below 1 is the disposition effect */
  ratio: number | null;
}

/** Do winners get cut short while losers run? */
export function dispositionStats(setups: readonly Setup[]): DispositionStats {
  const winners = setups.filter((s) => s.isWinner).map((s) => s.holdingDays);
  const losers = setups.filter((s) => s.isLoser).map((s) => s.holdingDays);
  const winnerMean = mean(winners);
  const loserMean = mean(losers);
  return {
    winnerCount: winners.length,
    loserCount: losers.length,
    winnerMeanHoldingDays: winnerMean,
    loserMeanHoldingDays: loserMean,
    winnerMedianHoldingDays: median(winners),
    loserMedianHoldingDays: median(losers),
    ratio: winnerMean !== null && loserMean !== null && loserMean > 0 ? winnerMean / loserMean : null,
  };
}

export type ConcentrationVerdict = "diversified" | "moderate" | "concentrated" | "none";

interface SymbolExposure {
  symbol: string;
  exposure: number;
  share: number;
}

export interface ConcentrationStats {
  distinctSymbols: number;
  /** Herfindahl–Hirschman index of exposure shares: 1/N when even, 1 for a single symbol */
  hhi: number | null;
  topOneShare: number | null;
  topThreeShare: number | null;
  topThree: SymbolExposure[];
  totalExposure: number;
  verdict: ConcentrationVerdict;
}

/** HHI bounds of the verdicts, as antitrust market concentration buckets */
const DIVERSIFIED_HHI = 0.15;
const MODERATE_HHI = 0.25;
const TOP = 3;

/** Concentration of exposure, |open value| of setups, across underlyings */
export function concentrationStats(setups: readonly Setup[]): ConcentrationStats {
  const bySymbol = new Map<string, number>();
  for (const setup of setups) {
    bySymbol.set(setup.underlyingSymbol, (bySymbol.get(setup.underlyingSymbol) ?? 0) + Math.abs(setup.openNetValue));
  }
  const totalExposure = [...bySymbol.values()].reduce((acc, exposure) => acc + exposure, 0);
  if (totalExposure === 0) {
    return { distinctSymbols: 0, hhi: null, topOneShare: null, topThreeShare: null, topThree: [], totalExposure: 0, verdict: "none" };
  }

  const exposures = [...bySymbol.entries()].map(([symbol, exposure]) => ({ symbol, exposure, share: exposure / totalExposure })).sort((a, b) => b.exposure - a.exposure);
  const hhi = exposures.reduce((acc, e) => acc + e.share * e.share, 0);
  const topThree = exposures.slice(0, TOP);
  return {
    distinctSymbols: exposures.length,
    hhi,
    topOneShare: exposures[0]?.share ?? null,
    topThreeShare: topThree.reduce((acc, e) => acc + e.share, 0),
    topThree,
    totalExposure,
    verdict: concentrationVerdict(hhi),
  };
}

function concentrationVerdict(hhi: number): ConcentrationVerdict {
  if (hhi <= DIVERSIFIED_HHI) {
    return "diversified";
  }
  return hhi <= MODERATE_HHI ? "moderate" : "concentrated";
}

export type RevengeVerdict = "revenge" | "neutral" | "disciplined" | "insufficient";

export interface RevengeTradeStats {
  afterLossCount: number;
  afterWinCount: number;
  afterLossAvgPnl: number | null;
  afterWinAvgPnl: number | null;
  afterLossWinRate: number | null;
  afterWinWinRate: number | null;
  baselineAvgPnl: number | null;
  verdict: RevengeVerdict;
}

/** fewer setups opened after a loss than this is coincidence */
const MIN_AFTER_LOSS = 5;
/** after-loss average this much (share of |baseline|) below baseline is a revenge profile */
const REVENGE_GAP = 0.25;

/**
 * Do setups opened right after a losing close do worse than the rest? The statement has no open
 * time, so "right after" is: the last setup closed on an earlier day, at most windowDays before the
 * open date. Closes on the open day itself are ignored, they may have happened after the open.
 */
export function revengeTradeStats(setups: readonly Setup[], windowDays: number): RevengeTradeStats {
  const byClose = setups.toSorted((a, b) => a.closedAt.localeCompare(b.closedAt));
  const afterLoss: Setup[] = [];
  const afterWin: Setup[] = [];
  for (const opened of setups) {
    const previous = previousClose(byClose, opened.openDate, windowDays);
    if (previous?.isLoser) {
      afterLoss.push(opened);
    }
    if (previous?.isWinner) {
      afterWin.push(opened);
    }
  }

  const afterLossAvgPnl = mean(afterLoss.map((s) => s.realizedPnl));
  const baselineAvgPnl = mean(setups.map((s) => s.realizedPnl));
  return {
    afterLossCount: afterLoss.length,
    afterWinCount: afterWin.length,
    afterLossAvgPnl,
    afterWinAvgPnl: mean(afterWin.map((s) => s.realizedPnl)),
    afterLossWinRate: winRate(afterLoss),
    afterWinWinRate: winRate(afterWin),
    baselineAvgPnl,
    verdict: revengeVerdict(afterLoss.length, afterLossAvgPnl, baselineAvgPnl),
  };
}

/** last setup closed before the open date, when it closed within windowDays */
function previousClose(byClose: readonly Setup[], openDate: string, windowDays: number): Setup | undefined {
  const previous = byClose.findLast((s) => s.closeDate < openDate);
  return previous && daysBetween(previous.closeDate, openDate) <= windowDays ? previous : undefined;
}

function winRate(setups: readonly Setup[]) {
  return setups.length > 0 ? setups.filter((s) => s.isWinner).length / setups.length : null;
}

function revengeVerdict(afterLossCount: number, afterLossAvgPnl: number | null, baselineAvgPnl: number | null): RevengeVerdict {
  if (afterLossCount < MIN_AFTER_LOSS || afterLossAvgPnl === null || baselineAvgPnl === null) {
    return "insufficient";
  }
  if (afterLossAvgPnl < baselineAvgPnl - Math.abs(baselineAvgPnl) * REVENGE_GAP) {
    return "revenge";
  }
  return afterLossAvgPnl >= baselineAvgPnl ? "disciplined" : "neutral";
}
