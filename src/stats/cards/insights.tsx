import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInsights, type InsightKind } from "../lib/insights";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/Insights.tsx

const KINDS: Record<InsightKind, { icon: string; label: string; color: string; dot: string }> = {
  continue: { icon: "✓", label: "Продовжуйте", color: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  avoid: { icon: "!", label: "Уникайте", color: "text-destructive", dot: "bg-destructive" },
  observe: { icon: "i", label: "Зверніть увагу", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const LIMIT = 6;

export function Insights({ setups }: { setups: readonly Setup[] }) {
  const insights = generateInsights(setups).slice(0, LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Висновки</CardTitle>
        <CardDescription>Що варто продовжувати, а на що звернути увагу</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">Замало даних для впевнених висновків.</p>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight) => {
              const kind = KINDS[insight.kind];
              return (
                <li key={insight.id} className="flex gap-3">
                  <div className={cn(kind.dot, "mt-1.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full font-bold text-[10px] text-background")}>{kind.icon}</div>
                  <div className="flex-1 space-y-0.5">
                    <div className={cn("font-medium text-sm", kind.color)}>
                      <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">{kind.label}</span> · {insight.title}
                    </div>
                    <div className="text-muted-foreground text-xs">{insight.detail}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
