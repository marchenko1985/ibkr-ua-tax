import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatRatio, formatUsd, toneClass } from "../lib/format";
import { type DiffRow, type RecentVsBaseline as RecentVsBaselineData, recentVsBaseline } from "../lib/metrics/summary";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/RecentVsBaseline.tsx

export function RecentVsBaseline({ setups }: { setups: readonly Setup[] }) {
  const diff = recentVsBaseline(setups);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Останні позиції проти попередніх</CardTitle>
        <CardDescription>{description(diff)}</CardDescription>
      </CardHeader>
      <CardContent>
        {diff.rows.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">Потрібно щонайменше 20 закритих позицій.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground text-xs">
                <th className="py-2 font-medium">Показник</th>
                <th className="py-2 text-right font-medium">Раніше</th>
                <th className="py-2 text-right font-medium">Останні</th>
                <th className="py-2 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {diff.rows.map((row) => (
                <DiffTableRow key={row.label} row={row} />
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function description(diff: RecentVsBaselineData) {
  if (diff.rows.length === 0) {
    return "Замало позицій для порівняння";
  }
  if (diff.baselineCount === 0) {
    return `Останні ${diff.recentCount} позицій (немає з чим порівняти)`;
  }
  return `Останні ${diff.recentCount} позицій проти ${diff.baselineCount} перед ними`;
}

function formatValue(value: number | null, format: DiffRow["format"]) {
  const formatters: Record<DiffRow["format"], (n: number | null) => string> = { usd: formatUsd, percent: formatPercent, ratio: formatRatio };
  return formatters[format](value);
}

function deltaTone({ delta, higherIsBetter }: DiffRow) {
  if (delta === null || delta === 0) {
    return toneClass("muted");
  }
  return delta > 0 === higherIsBetter ? toneClass("good") : toneClass("bad");
}

function deltaText({ delta, format }: DiffRow) {
  if (delta === null) {
    return "—";
  }
  if (delta === 0) {
    return `→ ${formatValue(delta, format)}`;
  }
  return delta > 0 ? `↑ +${formatValue(delta, format)}` : `↓ ${formatValue(delta, format)}`;
}

function DiffTableRow({ row }: { row: DiffRow }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 font-medium">{row.label}</td>
      <td className="py-2 text-right tabular-nums">{formatValue(row.baseline, row.format)}</td>
      <td className="py-2 text-right tabular-nums">{formatValue(row.recent, row.format)}</td>
      <td className={`py-2 text-right tabular-nums ${deltaTone(row)}`}>{deltaText(row)}</td>
    </tr>
  );
}
