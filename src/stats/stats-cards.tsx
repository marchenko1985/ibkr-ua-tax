import { CreditDebitDonut } from "./cards/credit-debit-donut";
import { DrawdownEpisodes } from "./cards/drawdown-episodes";
import { EquityCurve } from "./cards/equity-curve";
import { Insights } from "./cards/insights";
import { KpiRow } from "./cards/kpi-row";
import { KpiRowSecondary } from "./cards/kpi-row-secondary";
import { OptionsKpiRow } from "./cards/options-kpi-row";
import { PnlByDte } from "./cards/pnl-by-dte";
import { PnlByHoldingBucket } from "./cards/pnl-by-holding-bucket";
import { PnlByLegCount } from "./cards/pnl-by-leg-count";
import { PnlByMonth } from "./cards/pnl-by-month";
import { PnlByStrategy } from "./cards/pnl-by-strategy";
import { PnlByWeekday } from "./cards/pnl-by-weekday";
import { PnlCalendarHeatmap } from "./cards/pnl-calendar-heatmap";
import { PnlCdf } from "./cards/pnl-cdf";
import { PnlHistogram } from "./cards/pnl-histogram";
import { PutCallDonut } from "./cards/put-call-donut";
import { RecentVsBaseline } from "./cards/recent-vs-baseline";
import { RocDistribution } from "./cards/roc-distribution";
import { RollingMetrics } from "./cards/rolling-metrics";
import { SectionHeader } from "./cards/section-header";
import { SentimentDonut } from "./cards/sentiment-donut";
import { StrategyDteHeatmap } from "./cards/strategy-dte-heatmap";
import { StrategyFrontier } from "./cards/strategy-frontier";
import { StrategyHoldingHeatmap } from "./cards/strategy-holding-heatmap";
import { TradeScatter } from "./cards/trade-scatter";
import { TraderProfile } from "./cards/trader-profile";
import { TradesPerMonth } from "./cards/trades-per-month";
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

      <SectionHeader title="Динаміка" description="Як рухався рахунок: крива капіталу, ковзні показники, епізоди просідання та календар результатів за днями." />
      <EquityCurve setups={setups} />
      <RollingMetrics setups={setups} />
      <DrawdownEpisodes setups={setups} />
      <PnlCalendarHeatmap setups={setups} />

      <SectionHeader title="Стратегії" description="Які стратегії приносять результат: P/L, співвідношення win rate і payoff, розподіл позицій та розрізи за DTE і тривалістю утримання." />
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        <PnlByStrategy setups={setups} />
        <StrategyFrontier setups={setups} />
      </div>
      <TradeScatter setups={setups} />
      <StrategyDteHeatmap setups={setups} />
      <StrategyHoldingHeatmap setups={setups} />
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        <PnlByDte setups={setups} />
        <PnlByHoldingBucket setups={setups} />
      </div>

      <SectionHeader title="Форма результатів" description="Високий win rate нічого не каже без форми хвоста: розподіл P/L, доходність на ризик, CDF та результат за місяцями." />
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        <PnlHistogram setups={setups} />
        <RocDistribution setups={setups} />
        <PnlCdf setups={setups} />
        <PnlByMonth setups={setups} />
      </div>

      <SectionHeader title="Детальні розрізи" description="Дрібні розрізи для перевірки гіпотез: дні тижня, активність за місяцями, кількість ніг, кредит/дебет, puts/calls, настрій. На малих вибірках — шум." />
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        <PnlByWeekday setups={setups} />
        <TradesPerMonth setups={setups} />
        <PnlByLegCount setups={setups} />
        <CreditDebitDonut setups={setups} />
        <PutCallDonut setups={setups} />
        <SentimentDonut setups={setups} />
      </div>
    </>
  );
}
