import type { extract } from "./extract";
import { fetchRates as fetchRatesRange, rateFor } from "./rates";

export async function fetchRates(transactions: ReturnType<typeof extract>) {
  const [first] = transactions;
  if (!first) return [];

  const min_open_date = transactions.reduce((min, item) => (item.open_date < min ? item.open_date : min), first.open_date);
  const max_close_date = transactions.reduce((max, item) => (item.close_date > max ? item.close_date : max), first.close_date);

  if (!min_open_date || !max_close_date) return [];

  const rates = await fetchRatesRange(min_open_date, max_close_date);

  return withRates(transactions, rates);
}

export function withRates(transactions: ReturnType<typeof extract>, rates: Record<string, number>) {
  return transactions.map((item) => {
    const open = rateFor(rates, item.open_date);
    const close = rateFor(rates, item.close_date);
    return {
      ...item,
      open_rate: open.rate,
      open_rate_estimated: open.estimated,
      close_rate: close.rate,
      close_rate_estimated: close.estimated,
    };
  });
}
