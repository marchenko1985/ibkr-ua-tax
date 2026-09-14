import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDays, formatInt, formatPercent, formatUsd, pnlClass } from "../lib/format";
import { perSymbolStats } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/TopSymbolsTable.tsx

const LIMIT = 10;

export function TopSymbolsTable({ setups }: { setups: readonly Setup[] }) {
  const rows = perSymbolStats(setups).slice(0, LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ-{rows.length} базових активів за впливом на P/L</CardTitle>
        <CardDescription>Активи з найбільшим за модулем реалізованим P/L.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Актив</TableHead>
              <TableHead className="text-right">Позицій</TableHead>
              <TableHead className="text-right">Win rate</TableHead>
              <TableHead className="text-right">Сер. утримання</TableHead>
              <TableHead className="text-right">P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.key}</TableCell>
                <TableCell className="text-right tabular-nums">{formatInt(row.count)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(row.winRate)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatDays(row.avgHoldingDays)}</TableCell>
                <TableCell className={`text-right tabular-nums ${pnlClass(row.sumPnl)}`}>{formatUsd(row.sumPnl)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
