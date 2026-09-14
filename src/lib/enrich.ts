import type { Trade } from "./extract";
import { rateFor } from "./rates";
import { uah } from "./uah";

/**
 * Assigns NBU rates to trades (open rate by open date, close rate by close date, see rateFor)
 * and computes their USD and UAH values (see uah).
 *
 * For assigned/exercised options (is_assignment or is_exercise), USD and UAH values
 * are left at 0 because these are not taxable events — the option converts to stock
 * and its economics are embedded in the resulting stock's cost basis.
 *
 * @param rates map of YYYY-MM-DD to USD rate
 */
export function enrich(trades: Trade[], rates: Record<string, number>): Trade[] {
  return trades.map((trade) => {
    const open = rateFor(rates, trade.open_date);
    const close = rateFor(rates, trade.close_date);
    const withRates = { ...trade, open_rate: open.rate, open_rate_estimated: open.estimated, close_rate: close.rate, close_rate_estimated: close.estimated };

    if (trade.is_assignment || trade.is_exercise) {
      return { ...withRates, open_usd: 0, close_usd: 0, realized_usd: 0, open_uah: 0, close_uah: 0, realized_uah: 0 };
    }

    return {
      ...withRates,
      ...uah({ open_rate: open.rate, close_rate: close.rate, basis: trade.open_basis, realized: trade.open_realized }),
    };
  });
}
