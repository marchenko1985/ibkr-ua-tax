import { useMemo, useState } from "react";
import type { Statement } from "@/lib/statement";
import { tradesTotals } from "@/lib/totals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { filterTrades, type TradesFilter } from "./filter-trades";
import { TradesFilters } from "./trades-filters";
import { TradesTable } from "./trades-table";

export function TradesCard({ statement }: { statement: Statement }) {
  const { trades } = statement;
  const [filter, setFilter] = useState<TradesFilter>({ search: "", showStocks: true, showOptions: true });

  const filtered = useMemo(() => filterTrades(trades, filter), [trades, filter]);
  // totals only from taxable trades — assigned/exercised options are not taxable events
  const total = useMemo(() => tradesTotals(filtered.filter((t) => !(t.is_assignment || t.is_exercise))), [filtered]);

  if (trades.length === 0) {
    return (
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Угоди</CardTitle>
        </CardHeader>
        <CardContent>Звіт не містить інформації про закриті угоди за вибраний період.</CardContent>
      </Card>
    );
  }

  const closeDates = trades.map((t) => t.close_date).sort((a, b) => a.localeCompare(b));
  const convertedCount = trades.filter((t) => t.is_assignment || t.is_exercise).length;

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Угоди</CardTitle>
        <CardDescription>
          Усього {trades.length} позицій було закрито у проміжку між {closeDates.at(0)} та {closeDates.at(-1)}
          {convertedCount > 0 && <span className="text-muted-foreground"> (з них {convertedCount} — конвертовані опціони, не включені до Ф1)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TradesFilters filter={filter} onChange={setFilter} />
        <TradesTable trades={filtered} total={total} />
      </CardContent>
    </Card>
  );
}
