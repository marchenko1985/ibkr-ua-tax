import { useId, useState } from "react";
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDate, formatShortDate, formatUsd } from "../lib/format";
import { cumulativePnlSeries, type EquityPoint } from "../lib/metrics/timeseries";
import type { Setup } from "../lib/setups";
import { ChoiceToggle } from "./choice-toggle";

// Ported from optionslab app/stats/components/EquityCurve.tsx

type Range = "1m" | "3m" | "all";

const RANGES: readonly { key: Range; label: string; months: number | null }[] = [
  { key: "1m", label: "1М", months: 1 },
  { key: "3m", label: "3М", months: 3 },
  { key: "all", label: "Усе", months: null },
];

const chartConfig = {
  cumulative: { label: "Накопичено", color: "var(--chart-2)" },
  peak: { label: "Пік", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

export function EquityCurve({ setups }: { setups: readonly Setup[] }) {
  const [range, setRange] = useState<Range>("all");
  const id = useId().replaceAll(/[^a-zA-Z0-9]/g, "");
  const series = inRange(cumulativePnlSeries(setups), RANGES.find((r) => r.key === range)?.months ?? null);
  const last = series.at(-1);
  const first = series.at(0);
  const headline = last?.cumulative ?? 0;
  const delta = headline - (first ? first.cumulative - first.pnl : 0);
  const maxDrawdown = Math.max(0, ...series.map((p) => p.drawdown));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Крива капіталу</CardTitle>
          <CardDescription>
            Накопичений реалізований P/L. <span className="tabular-nums">{formatUsd(headline)}</span>{" "}
            <span className="text-muted-foreground">
              (за вибраний період {formatUsd(delta)} · макс. просідання {formatUsd(-maxDrawdown)})
            </span>
          </CardDescription>
        </div>
        <ChoiceToggle choices={RANGES} value={range} onChange={setRange} />
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full px-4">
        {/* peak area drawn first, cumulative on top covers it, so red shows only between them — the drawdown */}
        <ComposedChart data={series} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`${id}-equity`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cumulative)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--color-cumulative)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id={`${id}-drawdown`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-negative)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-negative)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} tickFormatter={formatShortDate} />
          <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(v: number) => formatUsd(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[200px]" labelFormatter={(value) => (typeof value === "string" ? formatDate(value) : "")} formatter={(value, name) => `${name === "peak" ? "Пік" : "Накопичено"}: ${formatUsd(Number(value))}`} />} />
          <Area dataKey="peak" type="stepAfter" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} fill={`url(#${id}-drawdown)`} isAnimationActive={false} />
          <Area dataKey="cumulative" type="monotone" stroke="var(--color-cumulative)" fill={`url(#${id}-equity)`} strokeWidth={2} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>
    </Card>
  );
}

/** points of the last `months` months before the last point, all when null */
function inRange(series: EquityPoint[], months: number | null) {
  const last = series.at(-1);
  if (months === null || !last) {
    return series;
  }
  const cutoff = new Date(`${last.date}T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const cutoffDate = cutoff.toISOString().slice(0, "YYYY-MM-DD".length);
  return series.filter((p) => p.date >= cutoffDate);
}
