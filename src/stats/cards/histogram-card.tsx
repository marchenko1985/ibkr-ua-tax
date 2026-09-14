import { Bar, BarChart, type BarShapeProps, CartesianGrid, Rectangle, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt } from "../lib/format";
import type { HistogramBucket } from "../lib/metrics/distributions";

// Shared by the P/L histogram and return on risk distribution cards

const CORNER = 2;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];

const chartConfig = { count: { label: "Позицій" } } satisfies ChartConfig;

/** Setups count per bucket, buckets below zero red */
export function HistogramCard({ title, description, buckets, formatEdge }: { title: string; description: string; buckets: readonly HistogramBucket[]; formatEdge: (value: number) => string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-4">
        <BarChart data={[...buckets]} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="from" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={formatEdge} />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={(v: number) => formatInt(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[200px]" hideLabel={true} formatter={(_value, _name, item) => <BucketTooltip bucket={item.payload} formatEdge={formatEdge} />} />} />
          <Bar dataKey="count" radius={TOP_RADIUS} isAnimationActive={false} shape={BucketBar} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function BucketBar(props: BarShapeProps) {
  const bucket: HistogramBucket = props.payload;
  return <Rectangle {...props} fill={bucket.from + bucket.to >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"} />;
}

function BucketTooltip({ bucket, formatEdge }: { bucket: HistogramBucket; formatEdge: (value: number) => string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tabular-nums">позицій: {formatInt(bucket.count)}</span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatEdge(bucket.from)} → {formatEdge(bucket.to)}
      </span>
    </div>
  );
}
