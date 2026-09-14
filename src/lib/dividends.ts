import { rateFor } from "./rates";

/**
 * Parses dividends from Interactive Brokers statements report ("Combined Dividends" section).
 *
 * Taxable income is the gross dividend amount converted with the NBU rate of the accrual date
 * (Tax Code 164.4, rate 167.5.4). Tax withheld abroad ("Withholding Tax" section) is ignored:
 * it does not reduce the tax base, and crediting it requires a certificate from the foreign tax
 * authority (13.5, 170.11.2) — a broker statement is not such a certificate.
 *
 * @param document parsed HTML document
 * @returns dividends, id is the position of the row in the statement, stable identity for UI
 */
export function extractDividends(document: Document) {
  return Array.from(document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr'))
    .slice(1, -1)
    .map((tr, index) => ({
      id: index + 1,
      date: tr.querySelector("td:nth-child(1)")?.textContent ?? "",
      identifier: tr.querySelector("td:nth-child(2)")?.textContent.split(" (").at(0) ?? "",
      description: tr.querySelector("td:nth-child(2)")?.textContent ?? "",
      amount: Number(tr.querySelector("td:nth-child(3)")?.textContent.replaceAll(",", "")),
      rate: 0,
      rate_estimated: false,
      amount_uah: 0,
    }));
}

export type Dividend = ReturnType<typeof extractDividends>[number];

export function withDividendRates(dividends: Dividend[], rates: Record<string, number>) {
  return dividends.map((div) => {
    const { rate, estimated } = rateFor(rates, div.date);
    return {
      ...div,
      rate,
      rate_estimated: estimated,
      amount_uah: div.amount * rate,
    };
  });
}
