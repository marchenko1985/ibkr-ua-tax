import { extract } from "./extract";

export async function fetchRates(transactions: ReturnType<typeof extract>) {
  if (!transactions.length) return [];

  // const min_open_date = transactions.sort((a, b) => a.open_date.localeCompare(b.open_date))[0]?.open_date;
  // const max_close_date = transactions.sort((a, b) => b.close_date.localeCompare(a.close_date))[0]?.close_date;
  // .sort() mutates incoming array
  const min_open_date = transactions.reduce((min, item) => (item.open_date < min ? item.open_date : min), transactions[0].open_date);
  const max_close_date = transactions.reduce((max, item) => (item.close_date > max ? item.close_date : max), transactions[0].close_date);

  if (!min_open_date || !max_close_date) return [];

  const url = new URL("https://proxy.marchenko-alexandr.workers.dev/NBU_Exchange/exchange_site");
  url.searchParams.set("start", min_open_date.replaceAll("-", ""));
  url.searchParams.set("end", max_close_date.replaceAll("-", ""));
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

  return transactions.map((item) => ({
    ...item,
    open_rate: rates[item.open_date] ?? null,
    close_rate: rates[item.close_date] ?? null,
  }));
}
