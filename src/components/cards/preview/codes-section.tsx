import { Cell, Section } from "./layout";
import { tableRows } from "./table-rows";
import { translateCode } from "./translations";

export function CodesSection({ document }: { document: Document }) {
  // codes are taken from the last cell of trades rows; it is not always a code,
  // but only known codes have translations, so the rest is filtered out
  const lastCells = tableRows(document, 'div[id^="tblTransactions_"] table tbody tr').map((row) => row.cells.at(-1)?.text.trim() ?? "");
  const codes = Array.from(new Set(lastCells.flatMap((text) => text.split(";"))))
    .map((code) => ({ code, translation: translateCode(code) }))
    .filter(({ translation }) => translation !== "");
  if (codes.length === 0) {
    return null;
  }

  return (
    <>
      <Section>Коди</Section>
      <table className="w-full table-auto">
        <tbody>
          {codes.map(({ code, translation }) => (
            <tr key={code} className="border-t first:border-t-0">
              <Cell>{code}</Cell>
              <Cell>{translation}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
