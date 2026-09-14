import { formatPercent } from "../lib/format";
import { rocDistribution } from "../lib/metrics/distributions";
import type { Setup } from "../lib/setups";
import { HistogramCard } from "./histogram-card";

// Ported from optionslab app/stats/components/RocDistribution.tsx

const BUCKET_WIDTH = 0.1;

/** Return per dollar at risk, the P/L histogram without position size */
export function RocDistribution({ setups }: { setups: readonly Setup[] }) {
  return <HistogramCard title="Розподіл доходності на ризик" description="P/L позиції відносно вартості відкриття, обрізано до ±200%." buckets={rocDistribution(setups, BUCKET_WIDTH)} formatEdge={(v) => formatPercent(v, 0)} />;
}
