/**
 * Fetches NBU USD exchange rates for the given inclusive date range,
 * extended by RATES_MARGIN_DAYS on both sides (see rateFor).
 *
 * @param fromDate YYYY-MM-DD
 * @param toDate YYYY-MM-DD
 * @returns map of YYYY-MM-DD to rate, empty when range is not given
 */
export async function fetchRates(fromDate: string, toDate: string) {
  if (!(fromDate && toDate)) {
    return {};
  }

  const response = await fetch(ratesUrl(addDays(fromDate, -RATES_MARGIN_DAYS), addDays(toDate, RATES_MARGIN_DAYS)), {
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

interface NbuRate {
  cc: string;
  exchangedate: string;
  rate_per_unit: number;
}

/**
 * Converts NBU response into a map of YYYY-MM-DD to USD rate.
 * Example item: { cc: "USD", exchangedate: "02.03.2026", rate_per_unit: 41.5 }
 */
export function parseRates(data: NbuRate[]) {
  const rates: Record<string, number> = {};
  for (const item of data.filter((rate) => rate.cc === "USD")) {
    rates[item.exchangedate.split(".").reverse().join("-")] = item.rate_per_unit;
  }
  return rates;
}

/**
 * Days added before and after the requested range when fetching rates,
 * so a date at the edge of the range still has sibling days to estimate from.
 */
const RATES_MARGIN_DAYS = 7;

/** Shifts YYYY-MM-DD date by given number of days */
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, "YYYY-MM-DD".length);
}

/**
 * Rate for the given date.
 *
 * When NBU has no rate for the date, the average of the nearest earlier and nearest later
 * available days is used and the result is marked as estimated, so it can be highlighted.
 * Throws when there is no rate on one of the sides — nothing to estimate from.
 */
export function rateFor(rates: Record<string, number>, date: string) {
  const exact = rates[date];
  if (exact !== undefined) {
    return { rate: exact, estimated: false };
  }

  let before = "";
  let after = "";
  for (const day of Object.keys(rates)) {
    if (day < date && day > before) {
      before = day;
    }
    if (day > date && (!after || day < after)) {
      after = day;
    }
  }

  const rateBefore = rates[before];
  const rateAfter = rates[after];
  if (rateBefore === undefined || rateAfter === undefined) {
    throw new Error(`Немає курсу НБУ на ${date}, і немає курсів на сусідні дні, щоб його оцінити`);
  }

  return { rate: (rateBefore + rateAfter) / 2, estimated: true };
}
