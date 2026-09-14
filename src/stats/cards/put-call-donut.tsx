import type { Setup } from "../lib/setups";
import { DonutCard, type DonutSlot } from "./donut-card";

// Ported from optionslab app/stats/components/PutCallDonut.tsx

const SLOTS: readonly DonutSlot[] = [
  { key: "puts", label: "Puts", fill: "var(--chart-2)" },
  { key: "calls", label: "Calls", fill: "var(--chart-4)" },
  { key: "mixed", label: "Змішані", fill: "var(--chart-1)" },
];

export function PutCallDonut({ setups }: { setups: readonly Setup[] }) {
  return <DonutCard title="Puts vs calls" description="Лише puts, лише calls або обидва в одній позиції (стренгли, кондори)." setups={setups} slots={SLOTS} keyOf={(s) => s.putCall} />;
}
