import { formatInt, formatPercent, formatUsd, pnlClass, toneClass } from "../lib/format";
import { creditCapturedStats, type Summary, summarize } from "../lib/metrics/summary";
import type { Setup } from "../lib/setups";
import { KpiCard, PairedValue } from "./kpi-card";

// Ported from optionslab app/stats/components/KpiRowSecondary.tsx

export function KpiRowSecondary({ setups }: { setups: readonly Setup[] }) {
  const summary = summarize(setups);
  const credit = creditCapturedStats(setups);

  return (
    <div className="grid @4xl:grid-cols-4 @md:grid-cols-2 grid-cols-1 gap-4">
      <KpiCard description="Максимальне просідання" value={formatUsd(-summary.maxDrawdown)} valueClass={summary.maxDrawdown > 0 ? toneClass("bad") : ""} footerPrimary="найбільше падіння від піку" footerSecondary={drawdownHint(summary)} />
      <KpiCard
        description="Найбільший прибуток · збиток"
        value={<PairedValue first={formatUsd(summary.largestWin)} second={formatUsd(summary.largestLoss)} firstClass={toneClass("good")} secondClass={toneClass("bad")} />}
        footerPrimary="найкраща та найгірша позиція"
        footerSecondary="хвости важливі для розміру позиції"
      />
      <KpiCard
        description="Серії"
        value={<PairedValue first={`${formatInt(summary.maxWinStreak)}W`} second={`${formatInt(summary.maxLossStreak)}L`} firstClass={toneClass("good")} secondClass={toneClass("bad")} />}
        footerPrimary="найдовші серії прибутків / збитків"
        footerSecondary={streakLabel(summary.currentStreak)}
      />
      <KpiCard
        description="% утриманої премії"
        value={formatPercent(credit.weightedCaptured)}
        valueClass={pnlClass(credit.weightedCaptured)}
        footerPrimary={credit.sampleSize === 0 ? "кредитних позицій немає" : `${formatUsd(credit.totalRealizedPnl)} / ${formatUsd(credit.totalCreditReceived)}`}
        footerSecondary={credit.sampleSize === 0 ? "" : `${formatInt(credit.sampleSize)} кредитних позицій · в середньому ${formatPercent(credit.simpleMeanCaptured)}`}
      />
    </div>
  );
}

function drawdownHint({ netPnl, maxDrawdown }: Summary) {
  if (netPnl > 0 && maxDrawdown > 0) {
    return `${formatPercent(maxDrawdown / netPnl, 0)} від чистого прибутку`;
  }
  return "—";
}

function streakLabel(streak: Summary["currentStreak"]) {
  const labels: Record<Summary["currentStreak"]["kind"], string> = {
    win: `поточна ${formatInt(streak.length)}W`,
    loss: `поточна ${formatInt(streak.length)}L`,
    flat: "поточна: без результату",
    none: "—",
  };
  return labels[streak.kind];
}
