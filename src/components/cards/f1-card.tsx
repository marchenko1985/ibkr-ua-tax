import type { Statement } from "@/lib/statement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";

/** Ф1 appendix: one row per taxable closed position */
export function F1Card({ statement }: { statement: Statement }) {
  // assigned/exercised options are not taxable events, their economics are in the stock basis
  const taxableTrades = statement.trades.filter((t) => !(t.is_assignment || t.is_exercise));
  if (taxableTrades.length === 0) {
    return null;
  }

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Додаток Ф1</CardTitle>
        <CardDescription>
          <p>Скопіюйти табличку у додаток Ф1 податкового звіту</p>
          <p>Перша колонка - номер угоди, друга - 4 - інвестиційні активи з джерел за межами України, третя - символ закритої позиції, четверта - сума у гривнях при закритті, п'ята - сума у гривнях при відкритті</p>
          <p>Вставивши цю табличку у додаток Ф1 він сам розрахує необхідну суму до сплати податків</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {taxableTrades.map((trade, i) => (
              <TableRow key={trade.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>4</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>{trade.close_uah.toFixed(2)}</TableCell>
                <TableCell>{trade.open_uah.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
