import type { Trade } from "@/lib/extract";
import { TableCell } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { assetName, pnlClassName } from "./labels";

export function OpenUahCell({ trade }: { trade: Trade }) {
  return (
    <TableCell className="border-l">
      <Tooltip>
        <TooltipTrigger>{trade.open_uah.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {trade.is_long ? "Витрати на купівлю" : "Витрати на зворотній викуп"} {assetName(trade)}
          </p>
          {trade.is_long ? (
            <>
              <p className="mt-1 text-muted-foreground text-xs">Basis × OpenRate</p>
              <p>
                {trade.open_basis} × {trade.open_rate} = {trade.open_uah.toFixed(2)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground text-xs">(|Basis| − Realized) × CloseRate</p>
              <p>
                ({Math.abs(trade.open_basis)} − {trade.open_realized}) × {trade.close_rate}
              </p>
              <p>
                = {trade.open_usd.toFixed(2)} × {trade.close_rate} = {trade.open_uah.toFixed(2)}
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

export function CloseUahCell({ trade }: { trade: Trade }) {
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger>{trade.close_uah.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {trade.is_long ? "Виручка від продажу" : "Премія від продажу"} {assetName(trade)}
          </p>
          {trade.is_long ? (
            <>
              <p className="mt-1 text-muted-foreground text-xs">(Basis + Realized) × CloseRate</p>
              <p>
                ({trade.open_basis} + {trade.open_realized}) × {trade.close_rate}
              </p>
              <p>
                = {trade.close_usd.toFixed(2)} × {trade.close_rate} = {trade.close_uah.toFixed(2)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground text-xs">|Basis| × OpenRate</p>
              <p>
                {Math.abs(trade.open_basis)} × {trade.open_rate} = {trade.close_uah.toFixed(2)}
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

export function RealizedUahCell({ trade }: { trade: Trade }) {
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger className={pnlClassName(trade.realized_uah)}>{trade.realized_uah.toFixed(2)}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Реалізований {trade.realized_uah >= 0 ? "прибуток" : "збиток"} в гривнях</p>
          <p className="mt-1 text-muted-foreground text-xs">Close UAH − Open UAH</p>
          <p>
            {trade.close_uah.toFixed(2)} − {trade.open_uah.toFixed(2)}
          </p>
          <p>= {trade.realized_uah.toFixed(2)}</p>
          {trade.is_short && trade.open_realized > 0 && trade.realized_uah < 0 && <p className="mt-1 text-xs text-yellow-500">⚠️ Прибуткова угода в USD, але збиткова в UAH через зміну курсу</p>}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}
