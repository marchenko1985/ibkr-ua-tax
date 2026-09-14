import type { Trade } from "@/lib/extract";
import { TableCell } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { assetName, pnlClassName } from "./labels";

export function OpenUsdCell({ trade }: { trade: Trade }) {
  return (
    <TableCell className="border-l">
      <Tooltip>
        <TooltipTrigger>{trade.open_usd.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {trade.is_long ? "Витрати на придбання" : "Витрати на зворотній викуп"} {assetName(trade)}
          </p>
          {trade.is_long ? (
            <>
              <p className="mt-1 text-muted-foreground text-xs">Basis (вартість придбання)</p>
              <p>{trade.open_basis.toFixed(2)}</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground text-xs">|Basis| − Realized (вартість зворотнього викупу)</p>
              <p>
                {Math.abs(trade.open_basis).toFixed(2)} − {trade.open_realized.toFixed(2)} = {trade.open_usd.toFixed(2)}
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

export function CloseUsdCell({ trade }: { trade: Trade }) {
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger>{trade.close_usd.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {trade.is_long ? "Дохід від продажу" : "Дохід (премія від продажу)"} {assetName(trade)}
          </p>
          {trade.is_long ? (
            <>
              <p className="mt-1 text-muted-foreground text-xs">Basis + Realized (виручка з урахуванням комісій)</p>
              <p>
                {trade.open_basis.toFixed(2)} + {trade.open_realized.toFixed(2)} = {trade.close_usd.toFixed(2)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground text-xs">|Basis| (премія від продажу)</p>
              <p>{Math.abs(trade.open_basis).toFixed(2)}</p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

export function RealizedUsdCell({ trade }: { trade: Trade }) {
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger className={pnlClassName(trade.realized_usd)}>{trade.realized_usd.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Реалізований {trade.realized_usd >= 0 ? "прибуток" : "збиток"} в доларах</p>
          <p className="mt-1 text-muted-foreground text-xs">Close USD − Open USD</p>
          <p>
            {trade.close_usd.toFixed(2)} − {trade.open_usd.toFixed(2)} = {trade.realized_usd.toFixed(2)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}
