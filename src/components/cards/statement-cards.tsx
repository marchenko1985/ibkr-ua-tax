import type { Statement } from "@/lib/statement";
import { StatsSection } from "@/stats/stats-section";
import { DividendsCard } from "./dividends/dividends-card";
import { EstimatedRatesCard } from "./estimated-rates-card";
import { F1Card } from "./f1-card";
import { PreviewCard } from "./preview/preview-card";
import { TradesCard } from "./trades/trades-card";

/**
 * Cards shown for a loaded statement, in order.
 * Every card receives the whole statement and decides itself whether it has something to show,
 * so adding or removing a card is one line here.
 */
export function StatementCards({ statement }: { statement: Statement }) {
  return (
    <>
      <EstimatedRatesCard statement={statement} />
      <TradesCard statement={statement} />
      <F1Card statement={statement} />
      <DividendsCard statement={statement} />
      <PreviewCard statement={statement} />
      <StatsSection statement={statement} />
    </>
  );
}
