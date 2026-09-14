import { useMemo } from "react";
import type { Statement } from "@/lib/statement";
import { buildSetups } from "./lib/setups";
import { StatsCards } from "./stats-cards";

/**
 * Options statistics of the statement, independent of tax calculations.
 * The only entry point of src/stats: the app renders it and imports nothing else from here.
 */
export function StatsSection({ statement }: { statement: Statement }) {
  const setups = useMemo(() => buildSetups(statement.trades), [statement.trades]);
  if (setups.length === 0) {
    return null;
  }

  return (
    <section data-nav="Статистика" className="@container/main flex flex-col gap-4 print:hidden">
      <div className="mt-8 flex flex-col gap-1">
        <h2 className="font-semibold text-2xl tracking-tight">Статистика опціонів</h2>
        <p className="max-w-3xl text-muted-foreground text-sm">Не впливає на податки. Розраховано за закритими опціонними позиціями звіту: ноги, відкриті в один день по одному базовому активу, об'єднані в одну позицію; призначені та виконані опціони не враховуються. Суми в доларах, з урахуванням комісій.</p>
      </div>
      <StatsCards setups={setups} />
    </section>
  );
}
