import type { Trade } from "./extract";
import { uah } from "./uah";

/**
 * Computes USD and UAH values of trades which already have exchange rates (see uah).
 *
 * For assigned/exercised options (is_assignment or is_exercise), USD and UAH values
 * are left at 0 because these are not taxable events — the option converts to stock
 * and its economics are embedded in the resulting stock's cost basis.
 */
export function enrich(trades: Trade[]): Trade[] {
  return trades.map((trade) => {
    if (trade.is_assignment || trade.is_exercise) {
      return { ...trade, open_usd: 0, close_usd: 0, realized_usd: 0, open_uah: 0, close_uah: 0, realized_uah: 0 };
    }

    return {
      ...trade,
      ...uah({ open_rate: trade.open_rate, close_rate: trade.close_rate, basis: trade.open_basis, realized: trade.open_realized }),
    };
  });
}
