import { WEEKDAY_ORDER, weekdayLabel } from "../lib/labels";
import { groupBy } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";
import { DistributionBarCard } from "./distribution-bar-card";

// Ported from optionslab app/stats/components/PnlByWeekday.tsx

/** A popular cut, but buckets are usually too small to claim an edge */
export function PnlByWeekday({ setups }: { setups: readonly Setup[] }) {
  return <DistributionBarCard title="P/L за днем відкриття" description="Малі вибірки в кожному дні — обережно з висновками." groups={groupBy(setups, (s) => s.openWeekday, WEEKDAY_ORDER)} label={weekdayLabel} />;
}
