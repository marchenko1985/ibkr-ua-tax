import { cn } from "cn";
import type { Trade } from "@/lib/extract";
import type { tradesTotals } from "@/lib/totals";
import { Table, TableBody, TableCell, TableRow } from "../../ui/table";
import { ConvertedCells } from "./converted-cells";
import { pnlClassName } from "./labels";
import { RateCell } from "./rate-cell";
import { TradesTableFooter } from "./trades-table-footer";
import { TradesTableHeader } from "./trades-table-header";
import { CloseUahCell, OpenUahCell, RealizedUahCell } from "./uah-cells";
import { CloseUsdCell, OpenUsdCell, RealizedUsdCell } from "./usd-cells";

export function TradesTable({ trades, total }: { trades: Trade[]; total: ReturnType<typeof tradesTotals> }) {
  // tighter cells than shadcn defaults so all 14 columns fit the page; the printable preview has its own table
  return (
    <Table className="text-center [&_td]:px-1 [&_th]:px-1">
      <TradesTableHeader />
      <TableBody>
        {trades.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </TableBody>
      <TradesTableFooter total={total} />
    </Table>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isConverted = trade.is_assignment || trade.is_exercise;

  return (
    <TableRow className={cn(isConverted && "opacity-40")}>
      <TableCell>{trade.close_date}</TableCell>
      <TableCell>{trade.symbol}</TableCell>
      <TableCell className={cn(trade.open_quantity > 0 && "text-blue-500", trade.open_quantity < 0 && "text-red-500")}>{trade.open_quantity}</TableCell>
      <TableCell>{trade.open_basis}</TableCell>
      <TableCell className={pnlClassName(trade.open_realized)}>{trade.open_realized}</TableCell>
      <TableCell>{trade.open_date}</TableCell>
      {isConverted ? (
        <ConvertedCells trade={trade} />
      ) : (
        <>
          <OpenUsdCell trade={trade} />
          <CloseUsdCell trade={trade} />
          <RealizedUsdCell trade={trade} />
          <RateCell className="border-l" label="відкриття" date={trade.open_date} rate={trade.open_rate} estimated={trade.open_rate_estimated} />
          <RateCell label="закриття" date={trade.close_date} rate={trade.close_rate} estimated={trade.close_rate_estimated} />
          <OpenUahCell trade={trade} />
          <CloseUahCell trade={trade} />
          <RealizedUahCell trade={trade} />
        </>
      )}
    </TableRow>
  );
}
