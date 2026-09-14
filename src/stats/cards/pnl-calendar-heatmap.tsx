import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "../lib/format";
import { type DailyPnlPoint, dailyPnlSeries } from "../lib/metrics/timeseries";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/PnlCalendarHeatmap.tsx

// Tailwind classes must stay literal strings in the source to be generated
const POSITIVE = ["fill-emerald-200 dark:fill-emerald-900/60", "fill-emerald-300 dark:fill-emerald-800", "fill-emerald-500 dark:fill-emerald-600", "fill-emerald-600 dark:fill-emerald-500", "fill-emerald-700 dark:fill-emerald-400"] as const;
const NEGATIVE = ["fill-red-200 dark:fill-red-900/60", "fill-red-300 dark:fill-red-800", "fill-red-500 dark:fill-red-600", "fill-red-600 dark:fill-red-500", "fill-red-700 dark:fill-red-400"] as const;
const EMPTY = "fill-muted";
const FLAT = "fill-muted-foreground/30";

const MONTHS: [string, string, string, string, string, string, string, string, string, string, string, string] = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
const WEEKDAYS: [string, string, string, string, string, string, string] = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAYS_IN_YEAR = 365;

export function PnlCalendarHeatmap({ setups }: { setups: readonly Setup[] }) {
  const values = dailyPnlSeries(setups);
  const end = new Date(`${values.at(-1)?.date ?? new Date().toISOString().slice(0, "YYYY-MM-DD".length)}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - DAYS_IN_YEAR);
  const positive = thresholds(values.filter((v) => v.pnl > 0).map((v) => v.pnl));
  const negative = thresholds(values.filter((v) => v.pnl < 0).map((v) => -v.pnl));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Календар P/L</CardTitle>
        <CardDescription>Реалізований P/L за днями закриття: зелений — прибуткові дні, червоний — збиткові, насиченість — розмір</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto [&_.react-calendar-heatmap_rect:hover]:opacity-80 [&_.react-calendar-heatmap_rect]:transition-opacity [&_.react-calendar-heatmap_text]:fill-muted-foreground">
        <CalendarHeatmap startDate={start} endDate={end} values={values} gutterSize={2} showMonthLabels={true} showWeekdayLabels={true} monthLabels={MONTHS} weekdayLabels={WEEKDAYS} classForValue={(value) => classFor(dayOf(value), positive, negative)} titleForValue={(value) => titleFor(dayOf(value))} />
        <Legend />
      </CardContent>
    </Card>
  );
}

/** heatmap passes back the values it was given */
function dayOf(value: { date: string | number | Date; pnl?: unknown; count?: unknown } | undefined): DailyPnlPoint | undefined {
  if (!value) {
    return undefined;
  }
  return { date: String(value.date), pnl: Number(value.pnl), count: Number(value.count) };
}

/** splits each sign into 5 roughly equal groups, so the color ramp adapts to the account size */
function thresholds(values: readonly number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return POSITIVE.slice(1).map((_, i) => sorted[Math.min(Math.floor((sorted.length * (i + 1)) / POSITIVE.length), sorted.length - 1)] ?? 0);
}

function classFor(day: DailyPnlPoint | undefined, positive: readonly number[], negative: readonly number[]) {
  if (!day) {
    return EMPTY;
  }
  if (day.pnl === 0) {
    return FLAT;
  }
  const ramp = day.pnl > 0 ? POSITIVE : NEGATIVE;
  const levels = day.pnl > 0 ? positive : negative;
  const index = levels.findIndex((level) => Math.abs(day.pnl) <= level);
  return ramp[index === -1 ? ramp.length - 1 : index] ?? EMPTY;
}

function titleFor(day: DailyPnlPoint | undefined) {
  return day ? `${day.date}: ${formatUsd(day.pnl)} · позицій: ${day.count}` : "без закриттів";
}

function Legend() {
  const swatches = [...[...NEGATIVE].reverse(), FLAT, ...POSITIVE];
  return (
    <div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
      <span>збитки</span>
      {swatches.map((cls) => (
        <svg key={cls} width="12" height="12" className="shrink-0" aria-hidden="true">
          <rect width="12" height="12" rx="2" className={cls} />
        </svg>
      ))}
      <span>прибутки</span>
    </div>
  );
}
