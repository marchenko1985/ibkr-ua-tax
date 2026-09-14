import type { ReactNode } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Ported from optionslab app/stats/components/MetricSwitcherHeader.tsx

interface MetricOption<K extends string> {
  key: K;
  label: string;
  /** value shown under the label, e.g. whole period total */
  value: string;
}

/** Card header with metric tabs: title on the left, clickable metric totals on the right */
export function MetricSwitcherHeader<K extends string>({ title, description, options, active, onChange }: { title: string; description: ReactNode; options: readonly MetricOption<K>[]; active: K; onChange: (next: K) => void }) {
  return (
    <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex items-stretch">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={active === option.key}
            data-active={active === option.key}
            className="relative z-20 flex min-w-28 flex-col justify-center gap-1 border-t px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-5"
            onClick={() => onChange(option.key)}
          >
            <span className="text-muted-foreground text-xs">{option.label}</span>
            <span className="font-bold text-lg tabular-nums sm:text-2xl">{option.value}</span>
          </button>
        ))}
      </div>
    </CardHeader>
  );
}
