import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPercent, formatRatio, formatUsd } from "../lib/format";
import { type RollingPoint, rollingMetrics } from "../lib/metrics/timeseries";
import type { Setup } from "../lib/setups";
import { ChoiceToggle } from "./choice-toggle";
import { MetricSwitcherHeader } from "./metric-switcher-header";

// Ported from optionslab app/stats/components/RollingMetrics.tsx

type Metric = "winRate" | "profitFactor" | "expectancy";
type WindowSize = "20" | "50";

const METRICS: readonly { key: Metric; label: string; color: string; format: (v: number | null) => string; tick: (v: number) => string; domain: [number | "auto", number | "auto"] }[] = [
  { key: "winRate", label: "Win rate", color: "var(--chart-3)", format: (v) => formatPercent(v), tick: (v) => formatPercent(v, 0), domain: [0, 1] },
  { key: "profitFactor", label: "Profit factor", color: "var(--chart-2)", format: formatRatio, tick: (v) => formatRatio(v), domain: ["auto", "auto"] },
  { key: "expectancy", label: "Expectancy", color: "var(--chart-4)", format: (v) => formatUsd(v), tick: (v) => formatUsd(v), domain: ["auto", "auto"] },
];

const WINDOWS: readonly { key: WindowSize; label: string }[] = [
  { key: "20", label: "20" },
  { key: "50", label: "50" },
];

const chartConfig = { value: { label: "Значення" } } satisfies ChartConfig;

/** Is the edge decaying? Rolling window over the last setups with the whole period value as reference */
export function RollingMetrics({ setups }: { setups: readonly Setup[] }) {
  const [metric, setMetric] = useState<Metric>("winRate");
  const [windowSize, setWindowSize] = useState<WindowSize>("20");
  const rolling = rollingMetrics(setups, Number(windowSize));
  const meta = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  if (!meta) {
    return null;
  }
  const data = rolling.points.map((p: RollingPoint) => ({ index: p.index, date: p.date, value: p[metric] }));
  const baseline = rolling.baseline[metric];

  return (
    <Card className="py-0">
      <MetricSwitcherHeader title="Ковзні показники" description="Вікно з останніх позицій · пунктир — значення за весь період" options={METRICS.map((m) => ({ key: m.key, label: m.label, value: m.format(rolling.baseline[m.key]) }))} active={metric} onChange={setMetric} />
      <div className="flex items-center gap-3 px-6 pt-4">
        <span className="font-medium text-muted-foreground text-xs">Вікно</span>
        <ChoiceToggle choices={WINDOWS} value={windowSize} onChange={setWindowSize} />
        <span className="text-muted-foreground text-xs">{rolling.points.length === 0 ? `Потрібно щонайменше ${windowSize} позицій` : `точок: ${rolling.points.length}`}</span>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full px-2 pt-2 pb-4 sm:px-6">
        <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: number) => `#${v}`} />
          <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={meta.tick} domain={meta.domain} />
          {baseline === null ? null : <ReferenceLine y={baseline} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />}
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" labelFormatter={(label, payload) => `Позиція #${String(label)} · ${String(payload[0]?.payload?.date ?? "")}`} formatter={(value) => meta.format(Number(value))} />} />
          <Line dataKey="value" type="monotone" stroke={meta.color} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={true} />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
