import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPercent, formatUsd } from "../lib/format";
import { pnlCdf } from "../lib/metrics/distributions";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/PnlCdf.tsx

const chartConfig = { fraction: { label: "Частка позицій", color: "var(--chart-2)" } } satisfies ChartConfig;

/** y is the share of setups with P/L at most x, at x = 0 it is the loss rate */
export function PnlCdf({ setups }: { setups: readonly Setup[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Розподіл P/L (CDF)</CardTitle>
        <CardDescription>Y — частка позицій з P/L ≤ X; на нулі крива показує частку збиткових.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-4">
        <LineChart data={pnlCdf(setups)} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="pnl" type="number" domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: number) => formatUsd(v)} />
          <YAxis tickLine={false} axisLine={false} width={48} domain={[0, 1]} tickFormatter={(v: number) => formatPercent(v, 0)} />
          <ReferenceLine x={0} stroke="var(--border)" strokeDasharray="3 3" />
          <ChartTooltip content={<ChartTooltipContent className="w-[200px]" labelFormatter={(_label, payload) => `P/L ≤ ${formatUsd(Number(payload[0]?.payload?.pnl), 2)}`} formatter={(value) => `${formatPercent(Number(value))} позицій`} />} />
          <Line dataKey="fraction" type="stepAfter" stroke="var(--color-fraction)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
