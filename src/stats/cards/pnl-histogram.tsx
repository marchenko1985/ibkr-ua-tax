import { formatUsd } from "../lib/format";
import { pnlHistogram } from "../lib/metrics/distributions";
import type { Setup } from "../lib/setups";
import { HistogramCard } from "./histogram-card";

// Ported from optionslab app/stats/components/PnlHistogram.tsx

const TARGET_BUCKETS = 18;

/** Fat tails: a high win rate can hide a few large losses that eat many small wins */
export function PnlHistogram({ setups }: { setups: readonly Setup[] }) {
  return <HistogramCard title="Розподіл P/L" description="Реалізований P/L позицій по кошиках — стежте за товстим хвостом збитків." buckets={pnlHistogram(setups, TARGET_BUCKETS)} formatEdge={(v) => formatUsd(v)} />;
}
