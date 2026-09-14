import type { Dividend } from "./dividends";
import type { Trade } from "./extract";

/** Personal income tax (ПДФО) on investment income */
const PERSONAL_INCOME_TAX_RATE = 0.18;
/** Military levy (військовий збір) */
const MILITARY_TAX_RATE = 0.05;
/** Personal income tax (ПДФО) on dividends from non-residents, half of the general rate (Tax Code 167.5.4) */
const DIVIDENDS_TAX_RATE = 0.09;

/**
 * Totals and taxes for closed positions.
 * Pass only taxable trades — assigned/exercised options must be excluded beforehand.
 */
export function tradesTotals(trades: Trade[]) {
  const open_uah = trades.reduce((acc, trade) => acc + trade.open_uah, 0);
  const close_uah = trades.reduce((acc, trade) => acc + trade.close_uah, 0);
  const realized_uah = trades.reduce((acc, trade) => acc + trade.realized_uah, 0);
  const personal_income_tax = realized_uah > 0 ? realized_uah * PERSONAL_INCOME_TAX_RATE : 0;
  const military_tax = realized_uah > 0 ? realized_uah * MILITARY_TAX_RATE : 0;
  const realized_usd = trades.reduce((acc, trade) => acc + trade.open_realized, 0);
  return {
    open_uah,
    close_uah,
    realized_uah,
    personal_income_tax,
    military_tax,
    realized_usd,
  };
}

/** Totals and taxes for dividends, taxed on gross amount (see extractDividends) */
export function dividendsTotals(dividends: Dividend[]) {
  const amount_uah = dividends.reduce((acc, div) => acc + div.amount_uah, 0);
  const dividends_tax = amount_uah * DIVIDENDS_TAX_RATE;
  const military_tax = amount_uah * MILITARY_TAX_RATE;
  return {
    amount: dividends.reduce((acc, div) => acc + div.amount, 0),
    amount_uah,
    dividends_tax,
    military_tax,
    total_tax: dividends_tax + military_tax,
  };
}
