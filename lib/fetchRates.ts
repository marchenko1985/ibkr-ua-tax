import type { extract } from "./extract";
import { fetchRates as fetchRatesRange } from "./rates";

export async function fetchRates(transactions: ReturnType<typeof extract>) {
  if (!transactions.length) return [];

  const min_open_date = transactions.reduce((min, item) => (item.open_date < min ? item.open_date : min), transactions[0].open_date);
  const max_close_date = transactions.reduce((max, item) => (item.close_date > max ? item.close_date : max), transactions[0].close_date);

  if (!min_open_date || !max_close_date) return [];

  const rates = await fetchRatesRange(min_open_date, max_close_date);

  return withRates(transactions, rates);
}

export function withRates(transactions: ReturnType<typeof extract>, rates: Record<string, number>) {
  return transactions.map((item) => ({
    ...item,
    open_rate: rates[item.open_date] ?? null,
    close_rate: rates[item.close_date] ?? null,
  }));
}
