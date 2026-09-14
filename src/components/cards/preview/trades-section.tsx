import { cn } from "cn";
import { Cell, Section } from "./layout";
import { type TableRowData, tableRows } from "./table-rows";

export function TradesSection({ document }: { document: Document }) {
  const rows = tableRows(document, 'div[id^="tblTransactions_"] table tbody tr');
  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <Section>Угоди</Section>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b">
            <Cell>Символ</Cell>
            <Cell>Дата/Час</Cell>
            <Cell>Біржа</Cell>
            <Cell>Кількість</Cell>
            <Cell>Ціна</Cell>
            <Cell>Виручка</Cell>
            <Cell>Комісія/Плата</Cell>
            <Cell>База</Cell>
            <Cell>Реалізований прибуток/збиток</Cell>
            <Cell>Код</Cell>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TradesRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </>
  );
}

/** Symbol, Date/Time and Exchange are text, the rest are numbers and codes */
const FIRST_NUMERIC_COLUMN = 3;

function TradesRow({ row }: { row: TableRowData }) {
  const isTotal = row.cells[0]?.text.startsWith("Total");

  return (
    <tr className="border-t first:border-t-0">
      {row.cells.map((cell, index) => (
        <Cell className={cn(row.cells.length === 1 && "bg-secondary", isTotal && "bg-secondary font-semibold", index >= FIRST_NUMERIC_COLUMN && "text-right", isTotal && index > 0 && "text-right")} key={cell.id} colSpan={cell.colSpan}>
          {translateTradesText(cell.text)}
        </Cell>
      ))}
    </tr>
  );
}

function translateTradesText(text: string) {
  return text.replace("Total", "Загалом").replace("Closed Lot:", "Закрита позиція:").replace("Equity and Index Options", "Опціони на акції та індекси").replace("Stocks", "Акції").replace("USD", "Долар США");
}
