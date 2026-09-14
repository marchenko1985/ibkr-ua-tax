import { cn } from "@/lib/utils";
import { Cell, Section } from "./layout";
import { tableRows } from "./table-rows";

export function WithholdingSection({ document }: { document: Document }) {
  const rows = tableRows(document, 'div[id^="tblWithholdingTax_"] table tbody tr');
  if (rows.length === 0) {
    return null;
  }

  // NOTE: IBKR includes withholding adjustments of previous year, keep only rows of dividends from this
  // statement (same date, description starts with dividend identifier) and count total manually
  const dividends = tableRows(document, 'div[id^="tblCombDiv_"] table tbody tr')
    .slice(1, -1)
    .map((row) => ({ date: row.cells[0]?.text ?? "", identifier: row.cells[1]?.text.split(" (").at(0) ?? "" }))
    .filter((dividend) => dividend.date !== "" && dividend.identifier !== "");

  const matched = rows.slice(1, -1).filter((row) => {
    const date = row.cells[0]?.text ?? "";
    const description = row.cells[1]?.text ?? "";
    return date !== "" && description !== "" && dividends.some((dividend) => dividend.date === date && description.startsWith(dividend.identifier));
  });

  const total = matched.reduce((acc, row) => {
    const amount = Number(row.cells[2]?.text.replaceAll(",", ""));
    return acc + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="space-y-4">
      <Section>Утриманий податок</Section>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b">
            <Cell>Дата</Cell>
            <Cell>Опис</Cell>
            <Cell>Сума</Cell>
            <Cell>Код</Cell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell className="bg-secondary" colSpan={4}>
              Долар США
            </Cell>
          </tr>
          {matched.map((row) => (
            <tr key={row.id} className="border-t">
              {row.cells.map((cell, cellIndex) => (
                <Cell key={cell.id} className={cn(cellIndex === 2 && "text-right")} colSpan={cell.colSpan}>
                  {cell.text}
                </Cell>
              ))}
            </tr>
          ))}
          <tr>
            <Cell className="bg-secondary font-semibold" colSpan={2}>
              Загалом
            </Cell>
            <Cell className="bg-secondary text-right font-semibold">{total.toFixed(2)}</Cell>
            <Cell className="bg-secondary">{null}</Cell>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
