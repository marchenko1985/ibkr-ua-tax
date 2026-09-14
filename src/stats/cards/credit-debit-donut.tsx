import type { Setup } from "../lib/setups";
import { DonutCard, type DonutSlot } from "./donut-card";

// Ported from optionslab app/stats/components/CreditDebitDonut.tsx

const SLOTS: readonly DonutSlot[] = [
  { key: "credit", label: "Кредит", fill: "var(--chart-2)" },
  { key: "debit", label: "Дебет", fill: "var(--chart-1)" },
];

export function CreditDebitDonut({ setups }: { setups: readonly Setup[] }) {
  return <DonutCard title="Кредит vs дебет" description="Частка позицій за тим, отримали чи заплатили премію при відкритті." setups={setups} slots={SLOTS} keyOf={creditOrDebit} />;
}

function creditOrDebit(setup: Setup) {
  if (setup.isCredit) {
    return "credit";
  }
  return setup.isDebit ? "debit" : null;
}
