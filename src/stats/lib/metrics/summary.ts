import type { Setup } from "../setups";

// Ported from optionslab app/stats/lib/metrics/summary.ts

export interface Summary {
  count: number;
  netPnl: number;
  winners: number;
  losers: number;
  flats: number;
  winRate: number | null;
  lossRate: number | null;
  grossWin: number;
  /** absolute value, always >= 0 */
  grossLoss: number;
  avgWin: number | null;
  /** absolute value */
  avgLoss: number | null;
  largestWin: number | null;
  /** signed, most negative */
  largestLoss: number | null;
  profitFactor: number | null;
  payoffRatio: number | null;
  expectancy: number | null;
  avgHoldingDays: number | null;
  maxDrawdown: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { kind: "win" | "loss" | "flat" | "none"; length: number };
}

/** Headline KPIs of closed setups */
export function summarize(setups: readonly Setup[]): Summary {
  const count = setups.length;
  const wins = setups.map((s) => s.realizedPnl).filter((pnl) => pnl > 0);
  const losses = setups.map((s) => s.realizedPnl).filter((pnl) => pnl < 0);
  const grossWin = sum(wins);
  const grossLoss = Math.abs(sum(losses));
  const winRate = count > 0 ? wins.length / count : null;
  const lossRate = count > 0 ? losses.length / count : null;
  const avgWin = wins.length > 0 ? grossWin / wins.length : null;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : null;

  return {
    count,
    netPnl: sum(setups.map((s) => s.realizedPnl)),
    winners: wins.length,
    losers: losses.length,
    flats: count - wins.length - losses.length,
    winRate,
    lossRate,
    grossWin,
    grossLoss,
    avgWin,
    avgLoss,
    largestWin: wins.length > 0 ? Math.max(...wins) : null,
    largestLoss: losses.length > 0 ? Math.min(...losses) : null,
    profitFactor: profitFactor(grossWin, grossLoss),
    payoffRatio: avgWin !== null && avgLoss !== null && avgLoss > 0 ? avgWin / avgLoss : null,
    expectancy: winRate !== null && lossRate !== null && avgWin !== null && avgLoss !== null ? winRate * avgWin - lossRate * avgLoss : null,
    avgHoldingDays: count > 0 ? sum(setups.map((s) => s.holdingDays)) / count : null,
    ...streakAndDrawdown(setups),
  };
}

/** Infinity when there are wins but no losses, null when there is neither */
function profitFactor(grossWin: number, grossLoss: number) {
  if (grossLoss > 0) {
    return grossWin / grossLoss;
  }
  return grossWin > 0 ? Number.POSITIVE_INFINITY : null;
}

function sum(values: readonly number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

/**
 * Walks setups ordered by close time: max drawdown of the cumulative P/L curve,
 * longest win and loss streaks (flats break streaks) and the streak as of the last close.
 */
function streakAndDrawdown(setups: readonly Setup[]) {
  const ordered = [...setups].sort((a, b) => a.closedAt.localeCompare(b.closedAt));

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let current: Summary["currentStreak"] = { kind: "none", length: 0 };

  for (const setup of ordered) {
    cumulative += setup.realizedPnl;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.max(maxDrawdown, peak - cumulative);
    current = nextStreak(current, setup.realizedPnl);
    if (current.kind === "win") {
      maxWinStreak = Math.max(maxWinStreak, current.length);
    }
    if (current.kind === "loss") {
      maxLossStreak = Math.max(maxLossStreak, current.length);
    }
  }

  return { maxDrawdown, maxWinStreak, maxLossStreak, currentStreak: current };
}

function nextStreak(current: Summary["currentStreak"], pnl: number): Summary["currentStreak"] {
  let kind: Summary["currentStreak"]["kind"] = "flat";
  if (pnl > 0) {
    kind = "win";
  } else if (pnl < 0) {
    kind = "loss";
  }
  if (kind === "flat") {
    return { kind, length: 1 };
  }
  return { kind, length: current.kind === kind ? current.length + 1 : 1 };
}

export interface CreditCapturedStats {
  /** credit setups contributing to the stats */
  sampleSize: number;
  /**
   * Value-weighted share of credit kept: total P/L of credit trades / total credit received.
   * 1 — kept every dollar, 0.5 — "managed at 50%", 0 — break even, negative — losses exceeded credit.
   */
  weightedCaptured: number | null;
  /** unweighted mean of per-trade realizedPnl / credit, sensitive to tiny credits */
  simpleMeanCaptured: number | null;
  /** always >= 0 */
  totalCreditReceived: number;
  totalRealizedPnl: number;
}

/** "% of credit captured" across credit setups only, debit setups have no credit to capture */
export function creditCapturedStats(setups: readonly Setup[]): CreditCapturedStats {
  const credits = setups.filter((s) => s.isCredit && s.openNetValue !== 0);
  const totalCreditReceived = sum(credits.map((s) => Math.abs(s.openNetValue)));
  const totalRealizedPnl = sum(credits.map((s) => s.realizedPnl));
  return {
    sampleSize: credits.length,
    weightedCaptured: totalCreditReceived > 0 ? totalRealizedPnl / totalCreditReceived : null,
    simpleMeanCaptured: credits.length > 0 ? sum(credits.map((s) => s.realizedPnl / Math.abs(s.openNetValue))) / credits.length : null,
    totalCreditReceived,
    totalRealizedPnl,
  };
}
