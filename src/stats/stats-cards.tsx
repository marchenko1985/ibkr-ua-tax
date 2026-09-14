import { Insights } from "./cards/insights";
import { KpiRow } from "./cards/kpi-row";
import { KpiRowSecondary } from "./cards/kpi-row-secondary";
import { OptionsKpiRow } from "./cards/options-kpi-row";
import { RecentVsBaseline } from "./cards/recent-vs-baseline";
import { SectionHeader } from "./cards/section-header";
import { TraderProfile } from "./cards/trader-profile";
import type { Setup } from "./lib/setups";

/**
 * Stat cards in order. Every card takes all setups and computes its own metric,
 * so adding or removing a card is one line here.
 */
export function StatsCards({ setups }: { setups: readonly Setup[] }) {
  return (
    <>
      <SectionHeader title="Огляд" description="Загальний результат опціонних позицій за період звіту: P/L, якість перемог і збитків, серії та просідання." />
      <KpiRow setups={setups} />
      <KpiRowSecondary setups={setups} />
      <OptionsKpiRow setups={setups} />
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        <TraderProfile setups={setups} />
        <Insights setups={setups} />
      </div>
      <RecentVsBaseline setups={setups} />
    </>
  );
}
