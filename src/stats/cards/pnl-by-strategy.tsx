import { Bar, BarChart, type BarShapeProps, CartesianGrid, LabelList, Rectangle, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatUsd } from "../lib/format";
import { perStrategyStats, type StrategyStat } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/PnlByStrategy.tsx

const LIMIT = 12;
const CORNER = 3;
/** horizontal bar rounded on the right: top-left, top-right, bottom-right, bottom-left */
const BAR_RADIUS: [number, number, number, number] = [0, CORNER, CORNER, 0];

const chartConfig = { sumPnl: { label: "P/L" } } satisfies ChartConfig;

/** Most used strategies by P/L, the count label tells a bread-and-butter strategy from a two-time try */
export function PnlByStrategy({ setups }: { setups: readonly Setup[] }) {
  const data = perStrategyStats(setups)
    .slice(0, LIMIT)
    .sort((a, b) => b.sumPnl - a.sumPnl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>P/L за стратегіями</CardTitle>
        <CardDescription>Найчастіші стратегії ({data.length}), від найприбутковішої. Число на стовпці — кількість позицій.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[340px] w-full px-4">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={160} fontSize={11} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatUsd(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" hideLabel={true} formatter={(_value, _name, item) => <StrategyTooltip stat={item.payload} />} />} />
          <Bar dataKey="sumPnl" radius={BAR_RADIUS} isAnimationActive={false} shape={StrategyBar}>
            <LabelList dataKey="count" position="insideRight" className="fill-background text-xs tabular-nums" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function StrategyBar(props: BarShapeProps) {
  const stat: StrategyStat = props.payload;
  return <Rectangle {...props} fill={stat.sumPnl >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"} />;
}

function StrategyTooltip({ stat }: { stat: StrategyStat }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{stat.name}</span>
      <span className="tabular-nums">{formatUsd(stat.sumPnl)}</span>
      <span className="text-muted-foreground text-xs">
        позицій: {formatInt(stat.count)} · win rate {formatPercent(stat.winRate)}
      </span>
    </div>
  );
}
