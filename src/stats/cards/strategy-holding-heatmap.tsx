import { holdingDaysLabel } from "../lib/labels";
import { strategyCrosstab } from "../lib/metrics/strategy";
import { HOLDING_DAYS_BUCKETS, type Setup } from "../lib/setups";
import { StrategyCrosstabHeatmap } from "./strategy-crosstab-heatmap";

// Ported from optionslab app/stats/components/StrategyHoldingHeatmap.tsx

const LIMIT = 10;

/** DTE is the theta window, holding period is how long the position was actually kept */
export function StrategyHoldingHeatmap({ setups }: { setups: readonly Setup[] }) {
  const crosstab = strategyCrosstab(
    setups,
    (s) => s.holdingDaysBucket,
    HOLDING_DAYS_BUCKETS.map((b) => b.label),
    LIMIT,
  );
  return <StrategyCrosstabHeatmap title="Стратегія × тривалість утримання" description="P/L за стратегією та тим, скільки днів позиція була відкрита." columnHeader="Утримання →" crosstab={crosstab} columnLabel={holdingDaysLabel} />;
}
