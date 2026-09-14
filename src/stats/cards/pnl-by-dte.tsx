import { useState } from "react";
import { Bar, BarChart, type BarShapeProps, CartesianGrid, Rectangle, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatUsd } from "../lib/format";
import { type GroupStat, groupBy } from "../lib/metrics/grouping";
import { classifySampleSize, SAMPLE_SIZE_OPACITY } from "../lib/metrics/sample-size";
import { DTE_BUCKETS, type Setup } from "../lib/setups";
import { GroupTooltip } from "./distribution-bar-card";
import { MetricSwitcherHeader } from "./metric-switcher-header";
import { SampleSizeLegend } from "./sample-size-badge";

// Ported from optionslab app/stats/components/PnlByDte.tsx

type Metric = "sumPnl" | "count" | "winRate";

const METRICS: readonly { key: Metric; label: string; format: (v: number | null) => string }[] = [
  { key: "sumPnl", label: "P/L", format: (v) => formatUsd(v) },
  { key: "count", label: "Позицій", format: formatInt },
  { key: "winRate", label: "Win rate", format: (v) => formatPercent(v, 0) },
];

const CORNER = 3;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];

const chartConfig = { value: { label: "Значення", color: "var(--chart-2)" } } satisfies ChartConfig;

/** The main options-only performance cut, with a switch between P/L, count and win rate */
export function PnlByDte({ setups }: { setups: readonly Setup[] }) {
  const [metric, setMetric] = useState<Metric>("sumPnl");
  const meta = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  if (!meta) {
    return null;
  }
  const groups = groupBy(
    setups,
    (s) => s.dteAtOpenBucket,
    DTE_BUCKETS.map((b) => b.label),
  );
  const totalCount = setups.length;
  const totals: Record<Metric, number | null> = {
    sumPnl: setups.reduce((acc, s) => acc + s.realizedPnl, 0),
    count: totalCount,
    winRate: totalCount > 0 ? setups.filter((s) => s.isWinner).length / totalCount : null,
  };
  const data = groups.map((group) => ({ ...group, value: group[metric] }));

  return (
    <Card className="py-0">
      <MetricSwitcherHeader
        title="P/L за DTE"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>Днів до експірації на момент відкриття</span>
            <SampleSizeLegend />
          </span>
        }
        options={METRICS.map((m) => ({ key: m.key, label: m.label, value: m.format(totals[m.key]) }))}
        active={metric}
        onChange={setMetric}
      />
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-2 pt-4 pb-4 sm:px-6">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(v: number) => meta.format(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" formatter={(value, _name, item) => <GroupTooltip group={item.payload} value={meta.format(Number(value))} totalCount={totalCount} />} />} />
          <Bar dataKey="value" radius={TOP_RADIUS} isAnimationActive={false} shape={(props: BarShapeProps) => <FadedBar {...props} totalCount={totalCount} />} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function FadedBar(props: BarShapeProps & { totalCount: number }) {
  const group: GroupStat = props.payload;
  return <Rectangle {...props} fill="var(--color-value)" fillOpacity={SAMPLE_SIZE_OPACITY[classifySampleSize(group.count, props.totalCount)]} />;
}
