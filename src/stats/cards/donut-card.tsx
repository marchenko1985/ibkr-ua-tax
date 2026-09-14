import { Label, Pie, PieChart } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatUsd } from "../lib/format";
import { groupBy } from "../lib/metrics/grouping";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/DonutCard.tsx

export interface DonutSlot {
  key: string;
  label: string;
  fill: string;
}

interface Slice extends DonutSlot {
  count: number;
  pnl: number;
}

const INNER_RADIUS = 64;
const OUTER_RADIUS = 96;
const CENTER_VALUE_OFFSET = 8;
const CENTER_LABEL_OFFSET = 12;

/** Share of setups by slot, the largest slot share in the center. Setups with a null key are left out */
export function DonutCard({ title, description, setups, slots, keyOf }: { title: string; description: string; setups: readonly Setup[]; slots: readonly DonutSlot[]; keyOf: (s: Setup) => string | null }) {
  const groups = groupBy(setups, keyOf);
  const slices: Slice[] = [];
  for (const slot of slots) {
    const group = groups.find((g) => g.key === slot.key);
    if (group) {
      slices.push({ ...slot, count: group.count, pnl: group.sumPnl });
    }
  }
  const total = slices.reduce((acc, slice) => acc + slice.count, 0);
  const dominant = slices.toSorted((a, b) => b.count - a.count).at(0);
  const chartConfig: ChartConfig = Object.fromEntries(slices.map((slice) => [slice.key, { label: slice.label, color: slice.fill }]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[240px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel={true} formatter={(_value, _name, item) => <SliceTooltip slice={item.payload} />} />} />
          <Pie data={slices} dataKey="count" nameKey="label" innerRadius={INNER_RADIUS} outerRadius={OUTER_RADIUS} strokeWidth={2} isAnimationActive={false}>
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox && viewBox.cx !== undefined && viewBox.cy !== undefined ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy - CENTER_VALUE_OFFSET} className="fill-foreground font-semibold text-2xl tabular-nums">
                      {dominant && total > 0 ? formatPercent(dominant.count / total, 0) : "—"}
                    </tspan>
                    <tspan x={viewBox.cx} y={viewBox.cy + CENTER_LABEL_OFFSET} className="fill-muted-foreground text-xs">
                      {dominant?.label.toLowerCase() ?? "немає даних"}
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </Card>
  );
}

function SliceTooltip({ slice }: { slice: Slice }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span>{slice.label}</span>
      <span className="tabular-nums">
        позицій: {formatInt(slice.count)} · {formatUsd(slice.pnl)}
      </span>
    </div>
  );
}
