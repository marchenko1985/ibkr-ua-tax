import type { Trade } from "@/lib/extract";
import { TableCell } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

/** Assigned or exercised option: no USD, rates and UAH values, it is not a taxable event */
export function ConvertedCells({ trade }: { trade: Trade }) {
  const kind = trade.is_assignment ? "assignment" : "exercise";

  return (
    <>
      <TableCell colSpan={3} className="border-l text-center">
        <NotTaxableTooltip kind={kind} />
      </TableCell>
      <TableCell colSpan={2} className="border-l text-center">
        <Tooltip>
          <TooltipTrigger>—</TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Опціон конвертовано в акції</p>
            <p className="mt-1 text-muted-foreground text-xs">Курси не застосовуються — позиція не є податковою подією.</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell colSpan={3} className="border-l text-center">
        <NotTaxableTooltip kind={kind} />
      </TableCell>
    </>
  );
}

function NotTaxableTooltip({ kind }: { kind: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>—</TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">Опціон конвертовано в акції ({kind})</p>
        <p className="mt-1 text-muted-foreground text-xs">Це не є податковою подією — вартість опціону включена в базову вартість акцій.</p>
        <p className="text-muted-foreground text-xs">Результат буде відображено при закритті позиції в акціях.</p>
      </TooltipContent>
    </Tooltip>
  );
}
