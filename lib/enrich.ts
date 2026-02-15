import { extract } from "./extract";
import { uah } from "./uah";

/**
 * Enriches trades with exchange rates
 * calculates open_uah, close_uah, and realized_uah for each trade
 * taking into account long and short positions
 *
 * @param trades Interactive Brokers trades statement
 */
export function enrich(trades: ReturnType<typeof extract>) {
  return trades.map((item) => {
    const open_rate = item.open_rate;
    const close_rate = item.close_rate;

    const { open_uah, close_uah, realized_uah } = uah({
      open_rate,
      close_rate,
      basis: item.open_basis,
      realized: item.open_realized,
      commission: item.close_commfee,
      is_expired: item.is_expired,
    });

    return {
      ...item,
      open_rate,
      close_rate,
      open_uah,
      close_uah,
      realized_uah,
    };
  });
}
