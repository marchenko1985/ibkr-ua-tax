import { Bar, BarChart, type BarShapeProps, CartesianGrid, Rectangle, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatShortDate, formatUsd, pnlClass } from "../lib/format";
import { type ExpiryWeek, expiryWeekExposure } from "../lib/metrics/options";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/ExpiryWeekHeatmap.tsx

const CORNER = 3;
const TOP_RADIUS: [number, number, number, number] = [CORNER, CORNER, 0, 0];

const chartConfig = { count: { label: "Позицій" } } satisfies ChartConfig;

/** Tall red bars are the scary ones: many setups tied to one expiration week that went wrong */
export function ExpiryWeekExposure({ setups }: { setups: readonly Setup[] }) {
  const data = expiryWeekExposure(setups);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Експозиція за тижнями експірації</CardTitle>
        <CardDescription>Позиції за тижнем найближчої експірації; колір — P/L тижня. Високі стовпці — ризик, зосереджений на одній п'ятниці.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full px-4">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="weekStart" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} tickFormatter={formatShortDate} />
          <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} tickFormatter={(v: number) => formatInt(v)} />
          <ChartTooltip content={<ChartTooltipContent className="w-[220px]" labelFormatter={(_label, payload) => weekLabel(payload[0]?.payload)} formatter={(_value, _name, item) => <WeekTooltip week={item.payload} />} />} />
          <Bar dataKey="count" radius={TOP_RADIUS} isAnimationActive={false} shape={WeekBar} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function weekLabel(week: ExpiryWeek | undefined) {
  return week ? `Тиждень ${formatShortDate(week.weekStart)} – ${formatShortDate(week.weekEnd)}` : "";
}

function WeekBar(props: BarShapeProps) {
  const week: ExpiryWeek = props.payload;
  return <Rectangle {...props} fill={week.sumPnl >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"} />;
}

function WeekTooltip({ week }: { week: ExpiryWeek }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tabular-nums">позицій: {formatInt(week.count)}</span>
      <span className={`text-xs tabular-nums ${pnlClass(week.sumPnl)}`}>
        {formatUsd(week.sumPnl)} · win rate {formatPercent(week.winRate)}
      </span>
    </div>
  );
}
