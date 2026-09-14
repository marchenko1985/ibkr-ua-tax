import type { tradesTotals } from "@/lib/totals";
import { TableCell, TableFooter, TableRow } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { pnlClassName } from "./labels";

export function TradesTableFooter({ total }: { total: ReturnType<typeof tradesTotals> }) {
  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={4} className="text-right font-bold">
          Загалом:
        </TableCell>
        <TableCell className={pnlClassName(total.realized_usd)}>{total.realized_usd.toFixed(2)}</TableCell>
        <TableCell colSpan={6} />
        <TableCell>
          <Tooltip>
            <TooltipTrigger>{total.open_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Open UAH</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger>{total.close_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Close UAH</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger className={pnlClassName(total.realized_uah)}>{total.realized_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Realized UAH</TooltipContent>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">
          Податок з доходу ПДФО (18%):
        </TableCell>
        <TableCell>{total.personal_income_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">
          Військовий збір (5%):
        </TableCell>
        <TableCell>{total.military_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">
          Усього до сплати податків:
        </TableCell>
        <TableCell>{(total.personal_income_tax + total.military_tax).toFixed(2)}</TableCell>
      </TableRow>
    </TableFooter>
  );
}
