import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ErrorCard } from "./error-card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";


export function DividendsCard({ document }: { document: Document | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);
  const [dividends, setDividends] = useState<ReturnType<typeof extract>>([]);
  const min_date = useMemo(() => [...dividends]?.sort((a, b) => a.date.localeCompare(b.date))[0]?.date, [dividends]);
  const max_date = useMemo(() => [...dividends]?.sort((a, b) => b.date.localeCompare(a.date))[0]?.date, [dividends]);

  useEffect(() => {
    if (!document) return;

    startTransition(async () => {
      setError(null)
      try {
        const dividendsWithoutRates = extract(document)
        const fromDate = dividendsWithoutRates.sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
        const toDate = dividendsWithoutRates.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
        const rates = await fetchRates(fromDate, toDate)
        const dividends = dividendsWithoutRates.map(div => ({
          ...div,
          rate: rates[div.date] ?? 0,
          income_uah: div.income * (rates[div.date] ?? 0),
        }))
        setDividends(dividends)
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

function DividendsTable({ dividends }: { dividends: ReturnType<typeof extract> }) {
  const total = useMemo(() => {
    const total_income_uah = dividends.reduce((acc, div) => acc + div.income_uah, 0);
    const dividends_tax = total_income_uah * 0.09; // 9% tax for dividends in Ukraine
    const military_tax = total_income_uah * 0.05; // 5% military tax for dividends in Ukraine
    const total_tax = dividends_tax + military_tax;
    return {
      amount_total: dividends.reduce((acc, div) => acc + div.amount, 0),
      us_tax_total: dividends.reduce((acc, div) => acc + div.tax, 0),
      income_total: dividends.reduce((acc, div) => acc + div.income, 0),
      total_income_uah,
      dividends_tax,
      military_tax,
      total_tax,
      net_income_uah: total_income_uah - total_tax,
    }
  }, [dividends])
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

function extract(document: Document) {
  return Array.from(document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr')).slice(1, -1).map(tr => ({
    date: tr.querySelector('td:nth-child(1)')?.textContent ?? "",
    identifier: tr.querySelector('td:nth-child(2)')?.textContent?.split(' (')?.shift() ?? "",
    description: tr.querySelector('td:nth-child(2)')?.textContent ?? "",
    amount: Number(tr.querySelector('td:nth-child(3)')?.textContent?.replace(",", ""))
  })).map(div => ({
    ...div,
    tax: Array.from(document.querySelectorAll('div[id^="tblWithholdingTax_"] table tbody tr')).filter(tr => tr.querySelector('td:nth-child(1)')?.textContent === div.date && tr.querySelector('td:nth-child(2)')?.textContent?.startsWith(div.identifier)).map(tr => Number(tr.querySelector('td:nth-child(3)')?.textContent?.replace(",", ""))).reduce((a, b) => a + b, 0)
  })).map(div => ({
    ...div,
    income: div.amount + div.tax, // note we are using plus here - because tax is negative
    rate: 0,
    income_uah: 0,
  }))
}

export async function fetchRates(fromDate: string, toDate: string) {
  if (!fromDate || !toDate) return {};

  const url = new URL("https://proxy.marchenko-alexandr.workers.dev/NBU_Exchange/exchange_site");
  url.searchParams.set("start", fromDate.replaceAll("-", ""));
  url.searchParams.set("end", toDate.replaceAll("-", ""));
  url.searchParams.set("valcode", "usd");
  url.searchParams.set("json", "true");

  const rates: Record<string, number> = await fetch(url, {
    headers: {
      "x-host": "bank.gov.ua",
      "x-cache-control": "public, max-age=604800",
    },
  })
    .then((r) => r.json())
    .then((data) =>
      data
        .filter(({ cc }: { cc: string }) => cc === "USD")
        .map(({ exchangedate, rate_per_unit }: { exchangedate: string; rate_per_unit: number }) => ({ date: exchangedate.split(".").reverse().join("-"), rate: rate_per_unit }))
        .reduce((acc: Record<string, number>, record: { date: string; rate: number }) => ({ ...acc, [record.date]: record.rate }), {} as Record<string, number>),
    );

  return rates;
}
