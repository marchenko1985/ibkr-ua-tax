/**
 * Parses dividends from Interactive Brokers statements report.
 *
 * Each "Combined Dividends" row is matched with "Withholding Tax" rows by date and identifier
 * (the part of the description before " ("), withholding amounts are negative.
 *
 * @param document parsed HTML document
 */
export function extractDividends(document: Document) {
  return Array.from(document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr'))
    .slice(1, -1)
    .map((tr) => ({
      date: tr.querySelector("td:nth-child(1)")?.textContent ?? "",
      identifier: tr.querySelector("td:nth-child(2)")?.textContent?.split(" (")?.shift() ?? "",
      description: tr.querySelector("td:nth-child(2)")?.textContent ?? "",
      amount: Number(tr.querySelector("td:nth-child(3)")?.textContent?.replace(",", "")),
    }))
    .map((div) => ({
      ...div,
      tax: Array.from(document.querySelectorAll('div[id^="tblWithholdingTax_"] table tbody tr'))
        .filter((tr) => tr.querySelector("td:nth-child(1)")?.textContent === div.date && tr.querySelector("td:nth-child(2)")?.textContent?.startsWith(div.identifier))
        .map((tr) => Number(tr.querySelector("td:nth-child(3)")?.textContent?.replace(",", "")))
        .reduce((a, b) => a + b, 0),
    }))
    .map((div) => ({
      ...div,
      income: div.amount + div.tax, // note we are using plus here - because tax is negative
      rate: 0,
      income_uah: 0,
    }));
}

export type Dividend = ReturnType<typeof extractDividends>[number];

export function withDividendRates(dividends: Dividend[], rates: Record<string, number>) {
  return dividends.map((div) => ({
    ...div,
    rate: rates[div.date] ?? 0,
    income_uah: div.income * (rates[div.date] ?? 0),
  }));
}
