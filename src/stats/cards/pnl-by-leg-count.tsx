import { legCountLabel } from "../lib/labels";
import { groupBy } from "../lib/metrics/grouping";
import { LEG_COUNT_BUCKETS, type Setup } from "../lib/setups";
import { DistributionBarCard } from "./distribution-bar-card";

// Ported from optionslab app/stats/components/PnlByLegCount.tsx

export function PnlByLegCount({ setups }: { setups: readonly Setup[] }) {
  const groups = groupBy(
    setups,
    (s) => s.legCountBucket,
    LEG_COUNT_BUCKETS.map((b) => b.label),
  );
  return <DistributionBarCard title="P/L за кількістю ніг" description="Одиночні опціони, спреди, кондори." groups={groups} label={legCountLabel} vertical={true} />;
}
