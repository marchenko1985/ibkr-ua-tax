import { formatPercent, formatSignedUsdShort } from "./format";
import { holdingDaysLabel, sentimentLabel } from "./labels";
import { type GroupStat, groupBy, perStrategyStats, type StrategyStat } from "./metrics/grouping";
import { DTE_BUCKETS, HOLDING_DAYS_BUCKETS, type Setup } from "./setups";

// Ported from optionslab app/stats/lib/insights.ts

export interface ProfileStrategy {
  name: string;
  count: number;
  /** share of all setups */
  pct: number;
  sumPnl: number;
  winRate: number | null;
}

export interface TraderProfile {
  tradeCount: number;
  /** open dates range, months rounded, at least 1 */
  period: { from: string; to: string; months: number } | null;
  /** most used strategies */
  topByVolume: ProfileStrategy[];
  /** biggest profitable strategies, sample of at least 3 */
  topWinners: ProfileStrategy[];
  /** biggest losing strategies, sample of at least 3 */
  topLosers: ProfileStrategy[];
}

const TOP = 3;
const MIN_STRATEGY_SAMPLE = 3;
const DAYS_IN_MONTH = 30.44;
const DAY_MS = 86_400_000;

/** Bio-style summary of how the trader actually trades */
export function traderProfile(setups: readonly Setup[]): TraderProfile {
  const tradeCount = setups.length;
  const stats = perStrategyStats(setups);
  const toProfile = (s: StrategyStat): ProfileStrategy => ({ name: s.name, count: s.count, pct: s.count / tradeCount, sumPnl: s.sumPnl, winRate: s.winRate });
  const sampled = stats.filter((s) => s.count >= MIN_STRATEGY_SAMPLE);

  return {
    tradeCount,
    period: period(setups),
    topByVolume: stats.slice(0, TOP).map(toProfile),
    topWinners: sampled
      .filter((s) => s.sumPnl > 0)
      .sort((a, b) => b.sumPnl - a.sumPnl)
      .slice(0, TOP)
      .map(toProfile),
    topLosers: sampled
      .filter((s) => s.sumPnl < 0)
      .sort((a, b) => a.sumPnl - b.sumPnl)
      .slice(0, TOP)
      .map(toProfile),
  };
}

function period(setups: readonly Setup[]): TraderProfile["period"] {
  const dates = setups.map((s) => s.openDate).sort((a, b) => a.localeCompare(b));
  const from = dates.at(0);
  const to = dates.at(-1);
  if (!(from && to)) {
    return null;
  }
  const months = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS / DAYS_IN_MONTH);
  return { from, to, months: Math.max(1, months) };
}

export type InsightKind = "continue" | "avoid" | "observe";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  detail: string;
  /** ranking only, larger is more important */
  priority: number;
}

/** Ranked observations: what works (continue), what bleeds money (avoid), what is notable (observe) */
export function generateInsights(setups: readonly Setup[]): Insight[] {
  if (setups.length === 0) {
    return [];
  }
  const minSample = minSampleFor(setups.length);
  return [...strategyInsights(setups, minSample), ...dteInsights(setups, minSample), ...holdingInsights(setups, minSample), ...sentimentInsights(setups, minSample), ...creditDebitInsights(setups, minSample)].sort((a, b) => b.priority - a.priority);
}

const MIN_SAMPLE = { floor: 3, cap: 10, share: 0.05 };

/** 3 for up to 60 setups, 5 for ~100, 10 for 200+ */
function minSampleFor(total: number) {
  return Math.max(MIN_SAMPLE.floor, Math.min(MIN_SAMPLE.cap, Math.ceil(total * MIN_SAMPLE.share)));
}

/** |P/L| weighted by log of sample size, so bigger samples win without drowning the rest */
function score(sumPnl: number, count: number) {
  return count > 0 ? Math.abs(sumPnl) * Math.log10(count + 1) : 0;
}

const WEIGHT = { strategy: 1.2, holdingWorst: 0.9, holdingBest: 0.8, sentiment: 0.7, debitDrag: 0.7 };

function extremes<T extends GroupStat>(rows: readonly T[], minSample: number) {
  const sampled = rows.filter((row) => row.count >= minSample);
  const best = sampled.reduce<T | null>((acc, row) => (acc === null || row.sumPnl > acc.sumPnl ? row : acc), null);
  const worst = sampled.reduce<T | null>((acc, row) => (acc === null || row.sumPnl < acc.sumPnl ? row : acc), null);
  return { best: best && best.sumPnl > 0 ? best : null, worst: worst && worst.sumPnl < 0 ? worst : null };
}

function strategyInsights(setups: readonly Setup[], minSample: number): Insight[] {
  const { best, worst } = extremes(perStrategyStats(setups), minSample);
  const insights: Insight[] = [];
  if (best) {
    insights.push({
      id: `strategy-winner-${best.slug}`,
      kind: "continue",
      title: `${best.name} — ваша найкраща стратегія`,
      detail: `Результат ${formatSignedUsdShort(best.sumPnl)}, позицій: ${best.count}, прибуткових ${formatPercent(best.winRate)} — продовжуйте.`,
      priority: score(best.sumPnl, best.count) * WEIGHT.strategy,
    });
  }
  if (worst) {
    insights.push({
      id: `strategy-loser-${worst.slug}`,
      kind: "avoid",
      title: `${worst.name} втрачає гроші`,
      detail: `Результат ${formatSignedUsdShort(worst.sumPnl)}, позицій: ${worst.count}, попри ${formatPercent(worst.winRate)} прибуткових — перегляньте критерії входу або припиніть цю стратегію.`,
      priority: score(worst.sumPnl, worst.count) * WEIGHT.strategy,
    });
  }
  return insights;
}

function dteInsights(setups: readonly Setup[], minSample: number): Insight[] {
  const order = DTE_BUCKETS.map((b) => b.label);
  const { best, worst } = extremes(
    groupBy(setups, (s) => s.dteAtOpenBucket, order),
    minSample,
  );
  const insights: Insight[] = [];
  if (best) {
    insights.push({
      id: `dte-best-${best.key}`,
      kind: "continue",
      title: `DTE ${best.key} — ваша найкраща зона`,
      detail: `Результат ${formatSignedUsdShort(best.sumPnl)}, позицій: ${best.count}, прибуткових ${formatPercent(best.winRate)}. Варто віддавати перевагу цьому діапазону.`,
      priority: score(best.sumPnl, best.count),
    });
  }
  if (worst) {
    insights.push({ id: `dte-worst-${worst.key}`, kind: "avoid", title: `DTE ${worst.key} не працює`, detail: `Результат ${formatSignedUsdShort(worst.sumPnl)}, позицій: ${worst.count}. Перевіряйте ідею двічі, відкриваючись тут.`, priority: score(worst.sumPnl, worst.count) });
  }
  return insights;
}

function holdingInsights(setups: readonly Setup[], minSample: number): Insight[] {
  const order = HOLDING_DAYS_BUCKETS.map((b) => b.label);
  const { best, worst } = extremes(
    groupBy(setups, (s) => s.holdingDaysBucket, order),
    minSample,
  );
  const insights: Insight[] = [];
  if (worst) {
    insights.push({
      id: `holding-worst-${worst.key}`,
      kind: "avoid",
      title: `Утримання ${holdingDaysLabel(worst.key)} шкодить`,
      detail: `Результат ${formatSignedUsdShort(worst.sumPnl)}, позицій: ${worst.count} — розгляньте ранніший вихід.`,
      priority: score(worst.sumPnl, worst.count) * WEIGHT.holdingWorst,
    });
  }
  if (best) {
    insights.push({ id: `holding-best-${best.key}`, kind: "continue", title: `Утримання ${holdingDaysLabel(best.key)} вам підходить`, detail: `Результат ${formatSignedUsdShort(best.sumPnl)}, позицій: ${best.count} — ваш природний ритм.`, priority: score(best.sumPnl, best.count) * WEIGHT.holdingBest });
  }
  return insights;
}

function sentimentInsights(setups: readonly Setup[], minSample: number): Insight[] {
  const sampled = groupBy(setups, (s) => s.strategySentiment[0] ?? null).filter((row) => row.count >= minSample);
  const best = sampled.reduce<GroupStat | null>((acc, row) => (acc === null || row.sumPnl > acc.sumPnl ? row : acc), null);
  const worst = sampled.reduce<GroupStat | null>((acc, row) => (acc === null || row.sumPnl < acc.sumPnl ? row : acc), null);
  if (!(best && worst) || best.key === worst.key || best.sumPnl <= 0 || worst.sumPnl > 0) {
    return [];
  }
  return [
    {
      id: `sentiment-${best.key}-vs-${worst.key}`,
      kind: "observe",
      title: `${capitalize(sentimentLabel(best.key))} позиції кращі за ${sentimentLabel(worst.key)}`,
      detail: `${capitalize(sentimentLabel(best.key))}: ${formatSignedUsdShort(best.sumPnl / best.count)} на позицію (позицій: ${best.count}), ${sentimentLabel(worst.key)}: ${formatSignedUsdShort(worst.sumPnl / worst.count)} на позицію (позицій: ${worst.count}).`,
      priority: score(best.sumPnl - worst.sumPnl, best.count) * WEIGHT.sentiment,
    },
  ];
}

/** win rate gap between credit and debit setups worth mentioning */
const CREDIT_DEBIT_GAP = 0.15;

function creditDebitInsights(setups: readonly Setup[], minSample: number): Insight[] {
  const credit = side(
    setups.filter((s) => s.isCredit),
    "кредитні",
  );
  const debit = side(
    setups.filter((s) => s.isDebit),
    "дебетові",
  );

  if (credit.count >= minSample && debit.count >= minSample) {
    const gap = credit.winRate - debit.winRate;
    if (Math.abs(gap) < CREDIT_DEBIT_GAP) {
      return [];
    }
    const [better, worse] = gap > 0 ? [credit, debit] : [debit, credit];
    return [
      {
        id: "credit-vs-debit",
        kind: worse.pnl < 0 ? "avoid" : "observe",
        title: `Ваші ${better.label} позиції значно кращі за ${worse.label}`,
        detail: `Прибуткових: ${better.label} ${formatPercent(better.winRate)}, ${worse.label} ${formatPercent(worse.winRate)}. ${capitalize(worse.label)}: результат ${formatSignedUsdShort(worse.pnl)}, позицій: ${worse.count}.`,
        priority: score(credit.pnl - debit.pnl, Math.min(credit.count, debit.count)),
      },
    ];
  }

  if (debit.count >= minSample && debit.pnl < 0) {
    return [{ id: "debit-drag", kind: "avoid", title: "Дебетові позиції тягнуть результат вниз", detail: `Результат ${formatSignedUsdShort(debit.pnl)}, позицій: ${debit.count} — здебільшого хеджі чи коригування?`, priority: score(debit.pnl, debit.count) * WEIGHT.debitDrag }];
  }
  return [];
}

function side(setups: readonly Setup[], label: string) {
  const count = setups.length;
  return { label, count, pnl: setups.reduce((acc, s) => acc + s.realizedPnl, 0), winRate: count > 0 ? setups.filter((s) => s.isWinner).length / count : 0 };
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
