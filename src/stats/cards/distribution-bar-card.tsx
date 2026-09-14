import { Bar, BarChart, type BarShapeProps, CartesianGrid, LabelList, Rectangle, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatUsd } from "../lib/format";
import type { GroupStat } from "../lib/metrics/grouping";
import { classifySampleSize, SAMPLE_SIZE_OPACITY } from "../lib/metrics/sample-size";
import { SampleSizeBadge, SampleSizeLegend } from "./sample-size-badge";

// Ported from optionslab app/stats/components/DistributionBarCard.tsx

const CORNER = 3;
/** room for the count label on the longest horizontal bar */
const VERTICAL_RIGHT_MARGIN = 24;
const MARGIN = 12;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];
const RIGHT_RADIUS: [number, number, number, number] = [0, CORNER, CORNER, 0];

const chartConfig = { sumPnl: { label: "P/L" } } satisfies ChartConfig;

interface Row extends GroupStat {
  label: string;
}

/** P/L per bucket, green or red by sign, faded by sample size. Vertical layout puts buckets on the y axis with counts on bars */
export function DistributionBarCard({ title, description, groups, label, vertical = false }: { title: string; description: string; groups: readonly GroupStat[]; label: (key: string) => string; vertical?: boolean }) {
  const rows: Row[] = groups.map((group) => ({ ...group, label: label(group.key) }));
  const totalCount = rows.reduce((acc, row) => acc + row.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{description}</span>
          <SampleSizeLegend />
        </CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-4">
        <BarChart data={rows} layout={vertical ? "vertical" : "horizontal"} margin={{ left: MARGIN, right: vertical ? VERTICAL_RIGHT_MARGIN : MARGIN, top: 8, bottom: 0 }}>
          {vertical ? <CartesianGrid horizontal={false} /> : <CartesianGrid vertical={false} />}
          {vertical ? <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={70} /> : <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />}
          {vertical ? <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => formatUsd(v)} /> : <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => formatUsd(v)} />}
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" formatter={(_value, _name, item) => <GroupTooltip group={item.payload} value={formatUsd(item.payload.sumPnl)} totalCount={totalCount} />} />} />
          <Bar dataKey="sumPnl" radius={vertical ? RIGHT_RADIUS : TOP_RADIUS} isAnimationActive={false} shape={(props: BarShapeProps) => <SampleSizeBar {...props} totalCount={totalCount} />}>
            {vertical ? <LabelList dataKey="count" position="insideRight" className="fill-background text-xs tabular-nums" /> : null}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function SampleSizeBar(props: BarShapeProps & { totalCount: number }) {
  const group: GroupStat = props.payload;
  return <Rectangle {...props} fill={group.sumPnl >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"} fillOpacity={SAMPLE_SIZE_OPACITY[classifySampleSize(group.count, props.totalCount)]} />;
}

/** value of the shown metric, sample size, count and win rate */
export function GroupTooltip({ group, value, totalCount }: { group: GroupStat; value: string; totalCount: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{value}</span>
        <SampleSizeBadge bucketCount={group.count} totalCount={totalCount} />
      </div>
      <span className="text-muted-foreground text-xs">
        позицій: {formatInt(group.count)} · win rate {formatPercent(group.winRate)}
      </span>
    </div>
  );
}
