/**
 * Fetches NBU USD exchange rates for the given inclusive date range.
 *
 * @param fromDate YYYY-MM-DD
 * @param toDate YYYY-MM-DD
 * @returns map of YYYY-MM-DD to rate, empty when range is not given
 */
export async function fetchRates(fromDate: string, toDate: string) {
  if (!fromDate || !toDate) return {};

  const response = await fetch(ratesUrl(fromDate, toDate), {
    headers: {
      "x-host": "bank.gov.ua",
      "x-cache-control": "public, max-age=604800",
    },
  });

  return parseRates(await response.json());
}

export function ratesUrl(fromDate: string, toDate: string) {
  const url = new URL("https://proxy.marchenko-alexandr.workers.dev/NBU_Exchange/exchange_site");
  url.searchParams.set("start", fromDate.replaceAll("-", ""));
  url.searchParams.set("end", toDate.replaceAll("-", ""));
  url.searchParams.set("valcode", "usd");
  url.searchParams.set("json", "true");
  return url;
}

type NbuRate = { cc: string; exchangedate: string; rate_per_unit: number };

/**
 * Converts NBU response into a map of YYYY-MM-DD to USD rate.
 * Example item: { cc: "USD", exchangedate: "02.03.2026", rate_per_unit: 41.5 }
 */
export function parseRates(data: NbuRate[]) {
  const rates: Record<string, number> = {};
  for (const item of data) {
    if (item.cc !== "USD") continue;
    rates[item.exchangedate.split(".").reverse().join("-")] = item.rate_per_unit;
  }
  return rates;
}
