import { cn } from "cn";
import { EstimatedRateHint } from "../../estimated-rate-hint";
import { TooltipLines } from "../../tooltip-lines";
import { TableCell } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

export function RateCell({ label, date, rate, estimated, className }: { label: string; date: string; rate: number; estimated: boolean; className?: string }) {
  return (
    <TableCell className={className}>
      <Tooltip>
        <TooltipTrigger className={cn(estimated && "text-yellow-600")}>
          {rate.toFixed(2)}
          {estimated ? "*" : ""}
        </TooltipTrigger>
        <TooltipContent>
          <TooltipLines>
            <p>Курс долара на дату {label} позиції</p>
            <p>Дата: {date}</p>
            <p>Курс: {rate}</p>
            {estimated ? <EstimatedRateHint /> : null}
          </TooltipLines>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}
