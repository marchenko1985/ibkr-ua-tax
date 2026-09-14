import { formatMonth } from "../lib/format";
import { groupBy } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";
import { DistributionBarCard } from "./distribution-bar-card";

// Ported from optionslab app/stats/components/PnlByMonth.tsx

export function PnlByMonth({ setups }: { setups: readonly Setup[] }) {
  return <DistributionBarCard title="P/L за місяцями" description="Реалізований P/L за місяцем відкриття позиції." groups={groupBy(setups, (s) => s.openYearMonth)} label={formatMonth} />;
}
