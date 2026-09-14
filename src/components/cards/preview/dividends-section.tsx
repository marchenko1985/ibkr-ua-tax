import { cn } from "@/lib/utils";
import { Cell, Section } from "./layout";
import { tableRows } from "./table-rows";

export function DividendsSection({ document }: { document: Document }) {
  const rows = tableRows(document, 'div[id^="tblCombDiv_"] table tbody tr');
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Section>Дивіденди</Section>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b">
            <Cell>Дата</Cell>
            <Cell>Опис</Cell>
            <Cell>Сума</Cell>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className={cn("border-t first:border-t-0", index === 0 && "bg-secondary", index === rows.length - 1 && "bg-secondary font-semibold")}>
              {row.cells.map((cell, cellIndex) => (
                <Cell key={cell.id} className={cn(cellIndex === 2 && "text-right")} colSpan={cell.colSpan}>
                  {cell.text.replace("USD", "Долар США").replace("Total", "Загалом")}
                </Cell>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
