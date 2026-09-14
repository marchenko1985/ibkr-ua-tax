import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, formatPercent, formatUsd, toneClass } from "../lib/format";
import { type ProfileStrategy, traderProfile } from "../lib/insights";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/TraderProfile.tsx

export function TraderProfile({ setups }: { setups: readonly Setup[] }) {
  const profile = traderProfile(setups);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Профіль трейдера</CardTitle>
        <CardDescription>Як ви насправді торгуєте</CardDescription>
      </CardHeader>
      <CardContent className="gap-4 text-sm">
        <ProfileLine label="Досвід">
          закритих позицій: <strong className="tabular-nums">{formatInt(profile.tradeCount)}</strong>
          {profile.period ? (
            <>
              , період <strong className="tabular-nums">{profile.period.months} міс.</strong>{" "}
              <span className="text-muted-foreground text-xs">
                ({profile.period.from} → {profile.period.to})
              </span>
            </>
          ) : null}
        </ProfileLine>
        <ProfileList label="Найчастіше" items={profile.topByVolume} emptyLabel="стратегії не визначено" render={(s) => <Details strategy={s} />} />
        <ProfileList label="Найбільші прибутки" items={profile.topWinners} emptyLabel="прибуткових стратегій ще немає" render={(s) => <Details strategy={s} tone="good" />} />
        <ProfileList label="Гіркий досвід" items={profile.topLosers} emptyLabel="збиткових стратегій немає — чудово" render={(s) => <Details strategy={s} tone="bad" />} />
      </CardContent>
    </Card>
  );
}

function Details({ strategy, tone }: { strategy: ProfileStrategy; tone?: "good" | "bad" }) {
  return (
    <>
      <span className="font-medium">{strategy.name}</span>
      {tone ? <span className={`text-xs tabular-nums ${toneClass(tone)}`}> {formatUsd(strategy.sumPnl)}</span> : null}
      <span className="text-muted-foreground text-xs tabular-nums">{tone ? ` · позицій: ${strategy.count} · прибуткових ${formatPercent(strategy.winRate)}` : ` · позицій: ${strategy.count} (${formatPercent(strategy.pct)})`}</span>
    </>
  );
}

function ProfileLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ProfileList({ label, items, render, emptyLabel }: { label: string; items: ProfileStrategy[]; render: (s: ProfileStrategy) => ReactNode; emptyLabel: string }) {
  return (
    <ProfileLine label={label}>
      {items.length === 0 ? (
        <div className="text-muted-foreground text-xs italic">{emptyLabel}</div>
      ) : (
        <ul className="space-y-1">
          {items.map((s) => (
            <li key={s.name}>{render(s)}</li>
          ))}
        </ul>
      )}
    </ProfileLine>
  );
}
