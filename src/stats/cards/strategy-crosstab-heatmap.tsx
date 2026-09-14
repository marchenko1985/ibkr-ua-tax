import type { CSSProperties } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, formatPercent, formatUsd } from "../lib/format";
import { classifySampleSize } from "../lib/metrics/sample-size";
import type { CrosstabCell, StrategyCrosstab } from "../lib/metrics/strategy";

// Ported from optionslab app/stats/components/StrategyCrosstabHeatmap.tsx

// OKLCH hues: ~145 emerald, ~25 red. Constant hue with lightness and chroma sweeping by intensity
// gives a smooth ramp that works in light and dark themes.
const POSITIVE_HUE = 145;
const NEGATIVE_HUE = 25;
const LIGHTNESS_MAX = 0.94;
const LIGHTNESS_RANGE = 0.42;
const CHROMA_MIN = 0.05;
const CHROMA_RANGE = 0.13;
/** above this intensity the background is dark enough for white text */
const WHITE_TEXT_INTENSITY = 0.5;

/** Strategies × buckets, cells colored by P/L; buckets with too few positions are greyed out */
export function StrategyCrosstabHeatmap({ title, description, columnHeader, crosstab, columnLabel }: { title: string; description: string; columnHeader: string; crosstab: StrategyCrosstab; columnLabel: (column: string) => string }) {
  if (crosstab.strategies.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description} Сірі клітинки — замало позицій, щоб робити висновки.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">{columnHeader}</div>
        <div className="grid gap-1 text-xs" style={{ gridTemplateColumns: `minmax(140px, 1fr) repeat(${crosstab.columns.length}, minmax(64px, 1fr))` }}>
          <div />
          {crosstab.columns.map((column) => (
            <div key={column} className="px-2 pb-1 text-center font-medium text-[11px] text-muted-foreground">
              {columnLabel(column)}
            </div>
          ))}
          {crosstab.strategies.map((strategy, row) => (
            <div key={strategy} className="contents">
              <div className="flex items-center pr-2 font-medium text-[11px] text-muted-foreground">{strategy}</div>
              {crosstab.columns.map((column, index) => (
                <HeatmapCell key={column} cell={crosstab.cells[row]?.[index]} title={`${strategy} · ${columnLabel(column)}`} crosstab={crosstab} />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapCell({ cell, title, crosstab }: { cell: CrosstabCell | undefined; title: string; crosstab: StrategyCrosstab }) {
  const className = "flex min-h-12 flex-col items-center justify-center rounded px-1 py-1 text-center tabular-nums";
  if (!cell || cell.count === 0) {
    return (
      <div className={`${className} bg-muted/20 text-muted-foreground`} title="Немає позицій">
        <span className="text-[10px] opacity-50">—</span>
      </div>
    );
  }

  const tooltip = `${title}\n${formatUsd(cell.sumPnl)} · позицій: ${formatInt(cell.count)} · win rate ${formatPercent(cell.winRate)}`;
  if (classifySampleSize(cell.count, crosstab.totalCount) === "noisy" || crosstab.maxAbsPnl === 0) {
    return (
      <div className={`${className} bg-muted/50 text-muted-foreground`} title={tooltip}>
        <span className="text-[10px] leading-tight">n={cell.count}</span>
      </div>
    );
  }

  const intensity = Math.min(1, Math.abs(cell.sumPnl) / crosstab.maxAbsPnl);
  return (
    <div className={`${className} ${intensity > WHITE_TEXT_INTENSITY ? "text-white" : "text-foreground"}`} style={background(cell.sumPnl, intensity)} title={tooltip}>
      <span className="font-semibold text-[11px] leading-tight">{formatUsd(cell.sumPnl)}</span>
      <span className="text-[10px] leading-tight opacity-75">{formatInt(cell.count)}</span>
    </div>
  );
}

function background(pnl: number, intensity: number): CSSProperties {
  const lightness = LIGHTNESS_MAX - intensity * LIGHTNESS_RANGE;
  const chroma = CHROMA_MIN + intensity * CHROMA_RANGE;
  return { backgroundColor: `oklch(${lightness} ${chroma} ${pnl >= 0 ? POSITIVE_HUE : NEGATIVE_HUE})` };
}
