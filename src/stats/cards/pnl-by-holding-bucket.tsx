import { holdingDaysLabel } from "../lib/labels";
import { groupBy } from "../lib/metrics/grouping";
import { HOLDING_DAYS_BUCKETS, type Setup } from "../lib/setups";
import { DistributionBarCard } from "./distribution-bar-card";

// Ported from optionslab app/stats/components/PnlByHoldingBucket.tsx

/** DTE is how long theta could work, holding is how long it was allowed to */
export function PnlByHoldingBucket({ setups }: { setups: readonly Setup[] }) {
  const groups = groupBy(
    setups,
    (s) => s.holdingDaysBucket,
    HOLDING_DAYS_BUCKETS.map((b) => b.label),
  );
  return <DistributionBarCard title="P/L за тривалістю утримання" description="Чи давали theta попрацювати, чи виходили рано?" groups={groups} label={holdingDaysLabel} />;
}
