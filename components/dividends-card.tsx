import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ErrorCard } from "./error-card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { extractDividends, withDividendRates, type Dividend } from "@/lib/dividends";
import { fetchRates } from "@/lib/rates";
import { dividendsTotals } from "@/lib/totals";


export function DividendsCard({ document }: { document: Document | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const min_date = useMemo(() => [...dividends]?.sort((a, b) => a.date.localeCompare(b.date))[0]?.date, [dividends]);
  const max_date = useMemo(() => [...dividends]?.sort((a, b) => b.date.localeCompare(a.date))[0]?.date, [dividends]);

  useEffect(() => {
    if (!document) return;

    startTransition(async () => {
      setError(null)
      try {
        const dividendsWithoutRates = extractDividends(document)
        const fromDate = dividendsWithoutRates.sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
        const toDate = dividendsWithoutRates.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
        const rates = await fetchRates(fromDate, toDate)
        setDividends(withDividendRates(dividendsWithoutRates, rates))
      } catch (error) {
        setError(error as Error);
      }
    })
  }, [document])

  if (!document) return null;

  if (isPending) {
    return <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Дивіденди</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        Завантаження...
      </CardContent>
    </Card>
  }

  if (error) {
    return <ErrorCard error={error} />
  }

  if (dividends.length === 0) {
    return <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Дивіденди</CardTitle>
      </CardHeader>
      <CardContent>
        Звіт не містить інформації про дивіденди за вибраний період.
      </CardContent>
    </Card>
  }

  return <Card className="print:hidden">
    <CardHeader>
      <CardTitle>Дивіденди</CardTitle>
      <CardDescription>Усього {dividends.length} активів нараховували дивіденди у проміжку між {min_date} та {max_date}</CardDescription>
    </CardHeader>
    <CardContent>
      <DividendsTable dividends={dividends} />
    </CardContent>
  </Card>
}

function DividendsTable({ dividends }: { dividends: Dividend[] }) {
  const total = useMemo(() => dividendsTotals(dividends), [dividends])
  return <Table>
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
            <TooltipContent>Сума нарахованих дивідендів</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead>
          <Tooltip>
            <TooltipTrigger>US Tax</TooltipTrigger>
            <TooltipContent>Сума податку США на дивіденди</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead>
          <Tooltip>
            <TooltipTrigger>Income</TooltipTrigger>
            <TooltipContent>Чистий дохід від дивідендів</TooltipContent>
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
            <TooltipTrigger>Income in UAH</TooltipTrigger>
            <TooltipContent>Дохід від дивідендів у гривнях</TooltipContent>
          </Tooltip>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {dividends.map((div, index) => (
        <TableRow key={index}>
          <TableCell>{div.date}</TableCell>
          <TableCell>{div.identifier}</TableCell>
          <TableCell className="text-right">{div.amount}</TableCell>
          <TableCell className="text-right">{div.tax}</TableCell>
          <TableCell className="text-right">{div.income.toFixed(2)}</TableCell>
          <TableCell className="border-l text-right">
            <Tooltip>
              <TooltipTrigger>{div.rate.toFixed(2)}</TooltipTrigger>
              <TooltipContent>
                <p>Курс долара на дату нарахування дивідендів</p>
                <p>Дата: {div.date}</p>
                <p>Курс: {div.rate}</p>
              </TooltipContent>
            </Tooltip>
          </TableCell>
          <TableCell className="border-l text-right">
            <Tooltip>
              <TooltipTrigger>{div.income_uah.toFixed(2)}</TooltipTrigger>
              <TooltipContent>
                <p>Дохід від дивідендів у гривнях</p>
                <p>Порахований як:</p>
                <p>{div.income} * {div.rate} = {div.income_uah}</p>
              </TooltipContent>
            </Tooltip>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter className="text-right font-bold">
      <TableRow>
        <TableCell colSpan={2}>Загалом:</TableCell>
        <TableCell>{total.amount_total.toFixed(2)}</TableCell>
        <TableCell>{total.us_tax_total.toFixed(2)}</TableCell>
        <TableCell>{total.income_total.toFixed(2)}</TableCell>
        <TableCell className="border-l"></TableCell>
        <TableCell className="border-l">{total.total_income_uah.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6}>Податок з дивідендів (9%):</TableCell>
        <TableCell className="border-l">{total.dividends_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6}>Війсковий збір (5%):</TableCell>
        <TableCell className="border-l">{total.military_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6}>Податків до сплати (підставити у поле 10.10 податкового звіту):</TableCell>
        <TableCell className="border-l">{total.total_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6}>Чистий дохід у гривнях:</TableCell>
        <TableCell className="border-l">{total.net_income_uah.toFixed(2)}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
}
