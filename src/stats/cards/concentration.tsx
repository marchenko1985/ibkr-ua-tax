import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, formatPercent, formatRatio, formatUsd, type Tone, toneClass } from "../lib/format";
import { type ConcentrationVerdict, concentrationStats } from "../lib/metrics/behavioral";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/Concentration.tsx

const VERDICTS: Record<ConcentrationVerdict, { label: string; tone: Tone; hint: string }> = {
  diversified: { label: "Диверсифіковано", tone: "good", hint: "Ризик розподілений між багатьма активами, жоден не домінує." },
  moderate: { label: "Помірна концентрація", tone: "warn", hint: "Кілька активів несуть більшу частину ризику. Стежте за корельованими просіданнями." },
  concentrated: { label: "Висока концентрація", tone: "bad", hint: "Більшість ризику в кількох активах: різкий рух одного сильно вдарить по рахунку." },
  none: { label: "Немає експозиції", tone: "muted", hint: "Немає позицій з вартістю відкриття." },
};

/** HHI of exposure across underlyings: ≤ 0.15 diversified, ≤ 0.25 moderate, above concentrated */
export function Concentration({ setups }: { setups: readonly Setup[] }) {
  const stats = concentrationStats(setups);
  const verdict = VERDICTS[stats.verdict];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Концентрація</CardTitle>
        <CardDescription>Розподіл експозиції (вартість відкриття за модулем) між базовими активами: індекс HHI і частка найбільших.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Metric label="HHI" value={formatRatio(stats.hhi)} note={`активів: ${formatInt(stats.distinctSymbols)}`} tone={verdict.tone} />
          <Metric label="Топ-1" value={formatPercent(stats.topOneShare)} note="найбільший актив" tone="muted" />
          <Metric label="Топ-3" value={formatPercent(stats.topThreeShare)} note="разом" tone="muted" />
        </div>
        {stats.topThree.length === 0 ? null : (
          <ul className="space-y-1 text-sm">
            {stats.topThree.map((row) => (
              <li key={row.symbol} className="flex items-center justify-between">
                <span className="font-medium">{row.symbol}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatPercent(row.share)} · {formatUsd(row.exposure)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className={`text-sm ${toneClass(verdict.tone)}`}>
          <strong>{verdict.label}</strong>
          {stats.verdict === "none" ? null : <span className="text-muted-foreground"> · експозиція {formatUsd(stats.totalExposure)}</span>}
          <div className="mt-1 text-muted-foreground text-xs">{verdict.hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: ReactNode; note: string; tone: Tone }) {
  return (
    <div>
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className={`mt-1 font-semibold text-2xl tabular-nums ${tone === "muted" ? "" : toneClass(tone)}`}>{value}</div>
      <div className="text-muted-foreground text-xs">{note}</div>
    </div>
  );
}
