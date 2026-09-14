import { formatDays, formatInt, formatPercent, formatRatio, formatUsd, pnlClass } from "../lib/format";
import { summarize } from "../lib/metrics/summary";
import type { Setup } from "../lib/setups";
import { KpiCard, PairedValue } from "./kpi-card";

// Ported from optionslab app/stats/components/KpiRow.tsx

export function KpiRow({ setups }: { setups: readonly Setup[] }) {
  const summary = summarize(setups);
  const quality = qualifyProfitFactor(summary.profitFactor);

  return (
    <div className="grid @4xl:grid-cols-4 @md:grid-cols-2 grid-cols-1 gap-4">
      <KpiCard description="Чистий P/L" value={formatUsd(summary.netPnl)} valueClass={pnlClass(summary.netPnl)} footerPrimary={`${formatInt(summary.count)} закритих позицій`} footerSecondary={`середнє утримання ${formatDays(summary.avgHoldingDays)}`} />
      <KpiCard description="Profit factor" value={formatRatio(summary.profitFactor)} footerPrimary={quality.label} footerSecondary={quality.hint} />
      <KpiCard description="Expectancy на позицію" value={formatUsd(summary.expectancy, 2)} valueClass={pnlClass(summary.expectancy)} footerPrimary={edgeLabel(summary.expectancy)} footerSecondary="середній результат однієї позиції" />
      <KpiCard
        description="Win rate · payoff"
        value={<PairedValue first={formatPercent(summary.winRate)} second={`× ${formatRatio(summary.payoffRatio)}`} />}
        footerPrimary={`найдовші серії ${formatInt(summary.maxWinStreak)}W / ${formatInt(summary.maxLossStreak)}L`}
        footerSecondary="win rate без payoff нічого не каже"
      />
    </div>
  );
}

function edgeLabel(expectancy: number | null) {
  if (expectancy === null) {
    return "";
  }
  return expectancy > 0 ? "позитивна перевага" : "негативна перевага";
}

/** profit factor levels: strong edge, healthy, break even */
const PROFIT_FACTOR = { excellent: 2, good: 1.5, breakEven: 1 };

function qualifyProfitFactor(pf: number | null): { label: string; hint: string } {
  if (pf === null) {
    return { label: "збитків ще немає", hint: "замала вибірка" };
  }
  if (!Number.isFinite(pf)) {
    return { label: "збитків ще немає", hint: "лише прибуткові позиції" };
  }
  if (pf >= PROFIT_FACTOR.excellent) {
    return { label: "відмінно", hint: "понад 2 — сильна перевага" };
  }
  if (pf >= PROFIT_FACTOR.good) {
    return { label: "добре", hint: "1.5–2 — здоровий рівень" };
  }
  if (pf >= PROFIT_FACTOR.breakEven) {
    return { label: "на межі", hint: "ледь вище беззбитковості" };
  }
  return { label: "збитково", hint: "прибутки не покривають збитки" };
}
