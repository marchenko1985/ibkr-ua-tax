import { Cell, Section } from "./layout";
import { tableRows } from "./table-rows";
import { translateAccount } from "./translations";

export function AccountSection({ document }: { document: Document }) {
  const rows = tableRows(document, 'div[id^="tblAccountInformation_"] table tr');
  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <Section>Інформація про аккаунт</Section>
      <table className="w-full table-auto">
        <tbody>
          {rows
            .filter((row) => !row.cells[0]?.text.startsWith("Address"))
            .map((row) => (
              <tr key={row.id} className="border-t first:border-t-0">
                <Cell>{translateAccount(row.cells[0]?.text)}</Cell>
                <Cell>{translateAccount(row.cells[1]?.text)}</Cell>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}
