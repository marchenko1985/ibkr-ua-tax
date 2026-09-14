import { formatDays, formatInt, formatPercent, formatUsd } from "../lib/format";
import { holdingAsPctDteStats, singleMultiExpiryStats } from "../lib/metrics/options";
import type { Setup } from "../lib/setups";
import { KpiCard, PairedValue } from "./kpi-card";

// Ported from optionslab app/stats/components/OptionsKpiRow.tsx

/** Holding as % of DTE (did theta work?) and single- vs multi-expiry split */
export function OptionsKpiRow({ setups }: { setups: readonly Setup[] }) {
  const holding = holdingAsPctDteStats(setups);
  const expiry = singleMultiExpiryStats(setups);

  return (
    <div className="grid @md:grid-cols-2 grid-cols-1 gap-4">
      <KpiCard description="Утримання як % від DTE" value={formatPercent(holding.meanRatio)} footerPrimary={holdingLabel(holding.meanRatio)} footerSecondary={holding.sampleSize === 0 ? "" : `${formatDays(holding.meanHoldingDays)} утримання / ${formatDays(holding.meanDteAtOpen)} DTE в середньому`} />
      <KpiCard
        description="Одна vs кілька експірацій"
        value={<PairedValue first={`${formatInt(expiry.singleCount)} одна`} second={`/ ${formatInt(expiry.multiCount)} кілька`} />}
        footerPrimary={`${formatUsd(expiry.singlePnl)} одна · ${formatUsd(expiry.multiPnl)} кілька`}
        footerSecondary={`прибуткових ${formatPercent(expiry.singleWinRate)} / ${formatPercent(expiry.multiWinRate)}`}
      />
    </div>
  );
}

/** held at least half of the time to expiration */
const THETA_WORKING_RATIO = 0.5;

function holdingLabel(ratio: number | null) {
  if (ratio === null) {
    return "немає позицій для порівняння";
  }
  return ratio >= THETA_WORKING_RATIO ? "тета встигає працювати" : "вихід задовго до експірації";
}
