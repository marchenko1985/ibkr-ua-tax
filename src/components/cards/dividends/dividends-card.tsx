import { cn } from "cn";
import { useMemo } from "react";
import type { Dividend } from "@/lib/dividends";
import type { Statement } from "@/lib/statement";
import { dividendsTotals } from "@/lib/totals";
import { EstimatedRateHint } from "../../estimated-rate-hint";
import { TooltipLines } from "../../tooltip-lines";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

export function DividendsCard({ statement }: { statement: Statement }) {
  const { dividends } = statement;

  if (dividends.length === 0) {
    return (
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Дивіденди</CardTitle>
        </CardHeader>
        <CardContent>Звіт не містить інформації про дивіденди за вибраний період.</CardContent>
      </Card>
    );
  }

  const dates = dividends.map((div) => div.date).sort((a, b) => a.localeCompare(b));

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Дивіденди</CardTitle>
        <CardDescription>
          Усього {dividends.length} активів нараховували дивіденди у проміжку між {dates.at(0)} та {dates.at(-1)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DividendsTable dividends={dividends} />
      </CardContent>
    </Card>
  );
}

function DividendsTable({ dividends }: { dividends: Dividend[] }) {
  const total = useMemo(() => dividendsTotals(dividends), [dividends]);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Tooltip>
              <TooltipTrigger>Date</TooltipTrigger>
              <TooltipContent>Дата нарахування дивідендів</TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead>
            <Tooltip>
              <TooltipTrigger>Description</TooltipTrigger>
              <TooltipContent>Опис нарахування дивідендів</TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead>
            <Tooltip>
              <TooltipTrigger>Amount</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Сума нарахованих дивідендів</p>
                  <p className="mt-1 text-muted-foreground text-xs">Податок, утриманий за кордоном, не віднімається від бази оподаткування</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="border-l">
            <Tooltip>
              <TooltipTrigger>Rate</TooltipTrigger>
              <TooltipContent>Курс валют на дату нарахування дивідендів</TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="border-l">
            <Tooltip>
              <TooltipTrigger>Amount in UAH</TooltipTrigger>
              <TooltipContent>Сума дивідендів у гривнях</TooltipContent>
            </Tooltip>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dividends.map((div) => (
          <TableRow key={div.id}>
            <TableCell>{div.date}</TableCell>
            <TableCell>{div.identifier}</TableCell>
            <TableCell className="text-right">{div.amount.toFixed(2)}</TableCell>
            <TableCell className="border-l text-right">
              <Tooltip>
                <TooltipTrigger className={cn(div.rate_estimated && "text-yellow-600")}>
                  {div.rate.toFixed(2)}
                  {div.rate_estimated ? "*" : ""}
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipLines>
                    <p>Курс долара на дату нарахування дивідендів</p>
                    <p>Дата: {div.date}</p>
                    <p>Курс: {div.rate}</p>
                    {div.rate_estimated ? <EstimatedRateHint /> : null}
                  </TooltipLines>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell className="border-l text-right">
              <Tooltip>
                <TooltipTrigger>{div.amount_uah.toFixed(2)}</TooltipTrigger>
                <TooltipContent>
                  <TooltipLines>
                    <p>Сума дивідендів у гривнях</p>
                    <p>
                      {div.amount} × {div.rate} = {div.amount_uah.toFixed(2)}
                    </p>
                  </TooltipLines>
                </TooltipContent>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className="text-right font-bold">
        <TableRow>
          <TableCell colSpan={2}>Загалом:</TableCell>
          <TableCell>{total.amount.toFixed(2)}</TableCell>
          <TableCell className="border-l" />
          <TableCell className="border-l">{total.amount_uah.toFixed(2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={4}>Податок з доходу ПДФО (9%):</TableCell>
          <TableCell className="border-l">{total.dividends_tax.toFixed(2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={4}>Військовий збір (5%):</TableCell>
          <TableCell className="border-l">{total.military_tax.toFixed(2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={4}>Податків до сплати (підставити у поле 10.10 податкового звіту):</TableCell>
          <TableCell className="border-l">{total.total_tax.toFixed(2)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
