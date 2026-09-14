import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, formatPercent, formatUsd, pnlClass, type Tone, toneClass } from "../lib/format";
import { type RevengeVerdict, revengeTradeStats } from "../lib/metrics/behavioral";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/RevengeTrades.tsx

/** the statement has no open time: a setup opened the day after a close counts as "right after" it */
const WINDOW_DAYS = 1;

const VERDICTS: Record<RevengeVerdict, { label: string; tone: Tone; line: string }> = {
  revenge: { label: "Схоже на відігрування", tone: "bad", line: "Позиції, відкриті після збитку, помітно гірші за середні — класична ознака спроби відігратися." },
  neutral: { label: "Нейтрально", tone: "muted", line: "Позиції після збитку трохи гірші за середні, але різниця не вирішальна." },
  disciplined: { label: "Дисципліновано", tone: "good", line: "Позиції після збитку не гірші за середні — ознак відігрування немає." },
  insufficient: { label: "Замало даних", tone: "muted", line: "Потрібно щонайменше 5 позицій, відкритих наступного дня після збиткового закриття." },
};

/** Do setups opened right after a loss do worse than the baseline? */
export function RevengeTrades({ setups }: { setups: readonly Setup[] }) {
  const stats = revengeTradeStats(setups, WINDOW_DAYS);
  const verdict = VERDICTS[stats.verdict];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Відігрування після збитків</CardTitle>
        <CardDescription>Чи гірші позиції, відкриті наступного дня після збиткового закриття? Закриття в день відкриття не враховуються — у звіті немає часу відкриття.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Side label="Після збитку" tone="bad" count={stats.afterLossCount} avgPnl={stats.afterLossAvgPnl} winRate={stats.afterLossWinRate} />
          <Side label="Після прибутку" tone="good" count={stats.afterWinCount} avgPnl={stats.afterWinAvgPnl} winRate={stats.afterWinWinRate} />
          <Side label="Усі" tone="muted" count={setups.length} avgPnl={stats.baselineAvgPnl} winRate={null} />
        </div>
        <div className={`text-sm ${toneClass(verdict.tone)}`}>
          <strong>{verdict.label}</strong>
          <div className="mt-1 text-muted-foreground text-xs">{verdict.line}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Side({ label, tone, count, avgPnl, winRate }: { label: string; tone: Tone; count: number; avgPnl: number | null; winRate: number | null }) {
  return (
    <div>
      <div className={`font-semibold text-xs uppercase tracking-wide ${toneClass(tone)}`}>{label}</div>
      <div className={`mt-1 font-semibold text-xl tabular-nums ${pnlClass(avgPnl)}`}>{formatUsd(avgPnl)}</div>
      <div className="text-muted-foreground text-xs">
        позицій: {formatInt(count)}
        {winRate === null ? null : ` · win rate ${formatPercent(winRate)}`}
      </div>
    </div>
  );
}
