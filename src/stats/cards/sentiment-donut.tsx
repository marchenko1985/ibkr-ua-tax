import { sentimentLabel } from "../lib/labels";
import type { Setup } from "../lib/setups";
import { DonutCard, type DonutSlot } from "./donut-card";

// Ported from optionslab app/stats/components/SentimentDonut.tsx

const COLORS: Record<string, string> = {
  bullish: "var(--chart-positive)",
  bearish: "var(--chart-negative)",
  neutral: "var(--chart-2)",
  directional: "var(--chart-4)",
  income: "var(--chart-1)",
  unknown: "var(--muted-foreground)",
};

const SLOTS: readonly DonutSlot[] = Object.entries(COLORS).map(([key, fill]) => ({ key, label: sentimentLabel(key), fill }));

/** by the first sentiment of the detected strategy */
export function SentimentDonut({ setups }: { setups: readonly Setup[] }) {
  return <DonutCard title="Настрій позицій" description="Частка позицій за основним настроєм стратегії." setups={setups} slots={SLOTS} keyOf={(s) => s.strategySentiment[0] ?? "unknown"} />;
}
