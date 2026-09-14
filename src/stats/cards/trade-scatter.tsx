import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, type ScatterShapeProps, Symbols, XAxis, YAxis, ZAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDays, formatUsd } from "../lib/format";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/TradeScatter.tsx

/** all dots are the same size */
const DOT_AREA = 32;
const DOT_SIZE: [number, number] = [DOT_AREA, DOT_AREA];

const chartConfig = { realizedPnl: { label: "P/L" } } satisfies ChartConfig;

/** Every setup as a point: outliers, clusters, and for credit sellers losers bunched near expiration */
export function TradeScatter({ setups }: { setups: readonly Setup[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Кожна позиція · утримання × P/L</CardTitle>
        <CardDescription>Точок: {setups.length} · x — днів утримання · y — реалізований P/L · зелені прибуткові</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full px-4">
        <ScatterChart margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis type="number" dataKey="holdingDays" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} дн.`} />
          <YAxis type="number" dataKey="realizedPnl" tickLine={false} axisLine={false} width={70} tickFormatter={(v: number) => formatUsd(v)} />
          <ZAxis range={DOT_SIZE} />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" hideLabel={true} formatter={(_value, _name, item) => <SetupTooltip setup={item.payload} />} />} />
          <Scatter data={[...setups]} shape={SetupPoint} />
        </ScatterChart>
      </ChartContainer>
    </Card>
  );
}

function SetupPoint(props: ScatterShapeProps) {
  const setup: Setup = props.payload;
  return <Symbols type="circle" cx={props.cx} cy={props.cy} size={props.size} fill={setup.realizedPnl >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"} fillOpacity={0.7} />;
}

function SetupTooltip({ setup }: { setup: Setup }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">
        {setup.underlyingSymbol} · {setup.strategyName}
      </span>
      <span className="tabular-nums">{formatUsd(setup.realizedPnl, 2)}</span>
      <span className="text-muted-foreground text-xs">
        {formatDays(setup.holdingDays)} · ніг: {setup.legCount} · {setup.openDate}
      </span>
    </div>
  );
}
