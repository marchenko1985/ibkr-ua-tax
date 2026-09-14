import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDays, formatInt, formatRatio, type Tone, toneClass } from "../lib/format";
import { type DispositionStats, dispositionStats } from "../lib/metrics/behavioral";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/DispositionEffect.tsx

/** winners held this many times longer than losers is healthy, the inverse is the disposition effect */
const HEALTHY_RATIO = 1.2;
const BALANCED_RATIO = 0.8;

/** Cutting winners short and letting losers run is the classic trading bias */
export function DispositionEffect({ setups }: { setups: readonly Setup[] }) {
  const stats = dispositionStats(setups);
  const verdict = verdictOf(stats.ratio);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ефект диспозиції</CardTitle>
        <CardDescription>Скільки тримаються прибуткові позиції порівняно зі збитковими.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Side label="Прибуткові" tone="good" count={stats.winnerCount} mean={stats.winnerMeanHoldingDays} median={stats.winnerMedianHoldingDays} />
          <Side label="Збиткові" tone="bad" count={stats.loserCount} mean={stats.loserMeanHoldingDays} median={stats.loserMedianHoldingDays} />
        </div>
        <div className={`text-sm ${toneClass(verdict.tone)}`}>
          {stats.ratio === null ? null : <strong>Співвідношення {formatRatio(stats.ratio)}× · </strong>}
          {verdict.line}
        </div>
      </CardContent>
    </Card>
  );
}

function verdictOf(ratio: DispositionStats["ratio"]): { tone: Tone; line: string } {
  if (ratio === null) {
    return { tone: "muted", line: "Замало прибуткових і збиткових позицій для порівняння." };
  }
  if (ratio >= HEALTHY_RATIO) {
    return { tone: "good", line: "Здорово: прибуткові тримаються довше за збиткові, theta встигає попрацювати." };
  }
  if (ratio >= BALANCED_RATIO) {
    return { tone: "muted", line: "Збалансовано: помітної різниці в утриманні немає." };
  }
  return { tone: "bad", line: "Ефект диспозиції: збиткові позиції тримаються довше за прибуткові." };
}

function Side({ label, tone, count, mean, median }: { label: string; tone: Tone; count: number; mean: number | null; median: number | null }) {
  return (
    <div>
      <div className={`font-semibold text-xs uppercase tracking-wide ${toneClass(tone)}`}>{label}</div>
      <div className="mt-1 font-semibold text-2xl tabular-nums">{formatDays(mean)}</div>
      <div className="mt-0.5 text-muted-foreground text-xs">
        в середньому · медіана {formatDays(median)} · позицій: {formatInt(count)}
      </div>
    </div>
  );
}
