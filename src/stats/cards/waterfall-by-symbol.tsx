import { Bar, BarChart, type BarShapeProps, CartesianGrid, Rectangle, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatUsd } from "../lib/format";
import { type WaterfallPoint, waterfallBySymbol } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/WaterfallBySymbol.tsx

const LIMIT = 15;
const CORNER = 3;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];
const BOTTOM_RADIUS: [number, number, number, number] = [0, 0, CORNER, CORNER];
/** symbols are slanted so all of them fit */
const LABEL_ANGLE = -40;
const LABEL_HEIGHT = 60;

const chartConfig = { delta: { label: "Внесок" } } satisfies ChartConfig;

/** How each underlying moved the total: bars float between the running totals before and after it */
export function WaterfallBySymbol({ setups }: { setups: readonly Setup[] }) {
  const data = waterfallBySymbol(setups, LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Внесок у P/L за базовими активами</CardTitle>
        <CardDescription>Активи ({data.length}) з найбільшим за модулем P/L: кожен стовпець показує, як актив змінив накопичений результат.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full px-4">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="symbol" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={LABEL_ANGLE} textAnchor="end" height={LABEL_HEIGHT} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(v: number) => formatUsd(v)} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" hideLabel={true} formatter={(_value, _name, item) => <PointTooltip point={item.payload} />} />} />
          {/* stack order is child order: the transparent base lifts the visible delta */}
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="delta" stackId="waterfall" isAnimationActive={false} shape={WaterfallBar} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

/** rounded on the far end from the previous total: up for gains, down for losses */
function WaterfallBar(props: BarShapeProps) {
  const point: WaterfallPoint = props.payload;
  const gain = point.pnl >= 0;
  return <Rectangle {...props} fill={gain ? "var(--chart-positive)" : "var(--chart-negative)"} radius={gain ? TOP_RADIUS : BOTTOM_RADIUS} />;
}

function PointTooltip({ point }: { point: WaterfallPoint }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{point.symbol}</span>
      <span className="tabular-nums">
        {point.pnl > 0 ? "+" : ""}
        {formatUsd(point.pnl)} <span className="text-muted-foreground">внесок</span>
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">накопичено {formatUsd(point.cumulative)}</span>
    </div>
  );
}
