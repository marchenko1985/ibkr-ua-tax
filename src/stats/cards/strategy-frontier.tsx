import { CartesianGrid, ComposedChart, Label, Line, ReferenceLine, Scatter, type ScatterShapeProps, Symbols, XAxis, YAxis, ZAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatInt, formatPercent, formatRatio, formatUsd, toneClass } from "../lib/format";
import { breakEvenPayoff, type FrontierPoint, strategyFrontierPoints } from "../lib/metrics/strategy";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/StrategyFrontier.tsx

const MIN_COUNT = 3;
/** y axis shows at least payoff 3 and leaves 15% headroom above the highest point */
const MIN_Y_MAX = 3;
const Y_HEADROOM = 1.15;
/** the curve goes to infinity near zero win rate, start it just left of the leftmost point */
const CURVE_MIN_X = 0.1;
const CURVE_MARGIN_X = 0.05;
const CURVE_STEP = 0.01;
/** dot area grows with the number of setups */
const DOT_AREA_MIN = 60;
const DOT_AREA_MAX = 240;
const DOT_SIZE: [number, number] = [DOT_AREA_MIN, DOT_AREA_MAX];

const chartConfig = { payoffRatio: { label: "Payoff ratio" } } satisfies ChartConfig;

/**
 * Which strategies have an edge by structure: a 90% win rate with a 0.2 payoff ratio is still below
 * the break-even curve and loses money.
 */
export function StrategyFrontier({ setups }: { setups: readonly Setup[] }) {
  const points = strategyFrontierPoints(setups, MIN_COUNT);
  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Межа стратегій</CardTitle>
          <CardDescription>Замало даних: потрібна стратегія з {MIN_COUNT}+ позиціями, серед яких є і прибуткові, і збиткові.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const yMax = Math.max(MIN_Y_MAX, Math.ceil(Math.max(...points.map((p) => p.payoffRatio)) * Y_HEADROOM));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Межа стратегій · win rate × payoff</CardTitle>
        <CardDescription>Кожна точка — стратегія з {MIN_COUNT}+ позиціями. Вище пунктирної кривої беззбитковості — прибуткова за структурою.</CardDescription>
      </CardHeader>
      <ChartContainer config={chartConfig} className="aspect-auto h-[340px] w-full px-4">
        <ComposedChart margin={{ left: 12, right: 24, top: 16, bottom: 8 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="winRate" domain={[0, 1]} tickFormatter={(v: number) => formatPercent(v, 0)} tickLine={false} axisLine={false}>
            <Label value="Win rate →" position="insideBottom" offset={-4} className="fill-muted-foreground text-xs" />
          </XAxis>
          <YAxis type="number" dataKey="payoffRatio" domain={[0, yMax]} tickLine={false} axisLine={false} width={50}>
            <Label value="Payoff ↑" angle={-90} position="insideLeft" className="fill-muted-foreground text-xs" />
          </YAxis>
          <ZAxis range={DOT_SIZE} dataKey="count" />
          <ReferenceLine y={1} stroke="var(--border)" strokeDasharray="2 2" />
          <Line data={breakEvenCurve(points, yMax)} dataKey="breakEven" type="monotone" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} legendType="none" />
          <ChartTooltip content={<ChartTooltipContent className="w-[240px]" hideLabel={true} formatter={(_value, _name, item) => <FrontierTooltip point={item.payload} />} />} />
          <Scatter data={points} shape={StrategyDot} />
        </ComposedChart>
      </ChartContainer>
    </Card>
  );
}

/** payoff = (1 − winRate) / winRate from the leftmost point to 100%, cut at the top of the chart */
function breakEvenCurve(points: readonly FrontierPoint[], yMax: number) {
  const curve: { winRate: number; breakEven: number }[] = [];
  const minX = Math.max(CURVE_MIN_X, Math.min(...points.map((p) => p.winRate)) - CURVE_MARGIN_X);
  for (let step = Math.ceil(minX / CURVE_STEP); step * CURVE_STEP <= 1; step += 1) {
    const winRate = step * CURVE_STEP;
    const breakEven = breakEvenPayoff(winRate);
    if (breakEven <= yMax) {
      curve.push({ winRate, breakEven });
    }
  }
  return curve;
}

function StrategyDot(props: ScatterShapeProps) {
  const point: FrontierPoint = props.payload;
  return <Symbols type="circle" cx={props.cx} cy={props.cy} size={props.size} fill={point.aboveBreakeven ? "var(--chart-positive)" : "var(--chart-negative)"} fillOpacity={0.75} />;
}

/** the break-even line shares the tooltip, its rows have no strategy */
function FrontierTooltip({ point }: { point: FrontierPoint | { name?: undefined } }) {
  if (point.name === undefined) {
    return null;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{point.name}</span>
      <span className="tabular-nums">
        win rate {formatPercent(point.winRate)} × payoff {formatRatio(point.payoffRatio)}
      </span>
      <span className="text-muted-foreground text-xs">
        позицій: {formatInt(point.count)} · {formatUsd(point.sumPnl)}
      </span>
      <span className={`text-xs ${toneClass(point.aboveBreakeven ? "good" : "bad")}`}>{point.aboveBreakeven ? "прибуткова за структурою" : "збиткова за структурою"}</span>
    </div>
  );
}
