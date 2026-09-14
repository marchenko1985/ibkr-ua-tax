import { strategyCrosstab } from "../lib/metrics/strategy";
import { DTE_BUCKETS, type Setup } from "../lib/setups";
import { StrategyCrosstabHeatmap } from "./strategy-crosstab-heatmap";

// Ported from optionslab app/stats/components/StrategyDteHeatmap.tsx

const LIMIT = 10;

/** The most actionable options cut: e.g. short straddles work at 22–45 DTE but lose at 0 DTE */
export function StrategyDteHeatmap({ setups }: { setups: readonly Setup[] }) {
  const crosstab = strategyCrosstab(
    setups,
    (s) => s.dteAtOpenBucket,
    DTE_BUCKETS.map((b) => b.label),
    LIMIT,
  );
  return <StrategyCrosstabHeatmap title="Стратегія × DTE" description="P/L за стратегією та кількістю днів до експірації на момент відкриття." columnHeader="DTE при відкритті →" crosstab={crosstab} columnLabel={(column) => column} />;
}
