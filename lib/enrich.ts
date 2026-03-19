import { extract } from "./extract";
import { uah } from "./uah";

/**
 * Enriches trades with exchange rates and computed values.
 *
 * For each trade, computes:
 * - USD intermediate values (open_usd, close_usd, realized_usd) — the "adjusted" USD amounts
 *   that represent actual economic inflows and outflows, accounting for fees.
 *   These use the same formulas as uah() but without FX multiplication, making the
 *   math transparent in the UI before exchange rates are applied.
 * - UAH values (open_uah, close_uah, realized_uah) — final tax-reportable amounts
 *   in Ukrainian hryvnia, computed by uah() using NBU exchange rates.
 *
 * For assigned/exercised options (is_assignment or is_exercise), USD and UAH values
 * are left at 0 because these are not taxable events — the option converts to stock.
 *
 * @param trades Interactive Brokers trades statement enriched with exchange rates
 */
export function enrich(trades: ReturnType<typeof extract>) {
  return trades.map((item) => {
    const open_rate = item.open_rate;
    const close_rate = item.close_rate;

    // Skip computation for assigned/exercised options — they are not taxable events.
    // Their economics are embedded in the resulting stock's cost basis.
    if (item.is_assignment || item.is_exercise) {
      return {
        ...item,
        open_rate,
        close_rate,
        open_usd: 0,
        close_usd: 0,
        realized_usd: 0,
        open_uah: 0,
        close_uah: 0,
        realized_uah: 0,
      };
    }

    // Compute USD intermediate values — same logic as uah() but without FX.
    // These make the calculation transparent: USD values × FX rate = UAH values.
    const { open_usd, close_usd, realized_usd } = computeUsd({
      basis: item.open_basis,
      realized: item.open_realized,
    });

    const { open_uah, close_uah, realized_uah } = uah({
      open_rate,
      close_rate,
      basis: item.open_basis,
      realized: item.open_realized,
      commission: item.close_commfee,
    });

    return {
      ...item,
      open_rate,
      close_rate,
      open_usd,
      close_usd,
      realized_usd,
      open_uah,
      close_uah,
      realized_uah,
    };
  });
}

/**
 * Computes USD intermediate values for a closed position.
 *
 * These represent the "adjusted" economic amounts BEFORE exchange rate conversion:
 *
 * For LONG positions (basis > 0):
 *   open_usd  = basis                  — what was spent to acquire the position
 *   close_usd = basis + realized       — what was received upon closing (net of all fees)
 *   This works because IBKR's realized P&L already accounts for fees:
 *     realized = proceeds - basis - fees → basis + realized = proceeds - fees
 *
 * For SHORT positions (basis < 0):
 *   close_usd = |basis|                — initial credit received when selling/writing
 *   open_usd  = |basis| - realized     — cost to buy back (close) the position
 *   Note the "reversed" naming: for shorts, the income event (selling) happens at open,
 *   and the expense event (buyback) happens at close. We name them open/close to align
 *   with how they map to Ф1: open_usd becomes "expenses", close_usd becomes "income".
 *
 *   For expired short options, IBKR reports realized = |basis|, so buyback = 0 naturally.
 *
 * realized_usd = close_usd - open_usd  — always equals IBKR's reported realized P&L
 */
function computeUsd({ basis, realized }: { basis: number; realized: number }) {
  const is_long = basis > 0;

  let open_usd = 0;
  let close_usd = 0;

  if (is_long) {
    open_usd = basis;
    close_usd = basis + realized;
  } else {
    close_usd = Math.abs(basis);
    open_usd = Math.abs(basis) - realized;
  }

  return {
    open_usd,
    close_usd,
    realized_usd: close_usd - open_usd,
  };
}
