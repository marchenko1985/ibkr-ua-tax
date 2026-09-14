import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatMonth } from "../lib/format";
import { groupBy } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/TradesPerMonth.tsx

const CORNER = 3;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];

const chartConfig = { count: { label: "Позицій", color: "var(--chart-2)" } } satisfies ChartConfig;

/** How active: positions opened per month, volume rather than P/L */
export function TradesPerMonth({ setups }: { setups: readonly Setup[] }) {
  const data = groupBy(setups, (s) => s.openYearMonth).map((group) => ({ ...group, label: formatMonth(group.key) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Позицій за місяць</CardTitle>
        <CardDescription>Наскільки активною була торгівля: кількість відкритих позицій, не P/L.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-4">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatInt(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[160px]" formatter={(value) => `позицій: ${formatInt(Number(value))}`} />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={TOP_RADIUS} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
