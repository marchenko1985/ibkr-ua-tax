import type { ReactNode } from "react";

/** Stacks tooltip lines (title, formula, calculation) — shadcn TooltipContent lays its children out in a row */
export function TooltipLines({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start">{children}</div>;
}
