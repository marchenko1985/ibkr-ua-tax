/**
 * Converts a closed position's USD basis and realized P&L into tax-reportable amounts.
 *
 * Step 1, USD (see usd): expenses and income of the position, fees are already
 * embedded by IBKR in basis and realized P&L.
 *
 * Step 2, UAH: every amount is converted with the NBU rate of the day it happened:
 *   expenses (open_uah)  = open_usd  × rate at expense date
 *   income   (close_uah) = close_usd × rate at income date
 *   realized_uah = close_uah - open_uah
 *
 * For LONG positions (basis > 0) money is spent at open and received at close:
 *   open_uah  = open_usd  × open_rate
 *   close_uah = close_usd × close_rate
 *
 * For SHORT positions (basis < 0) the cash flow is reversed: income (selling/writing)
 * happens at open, expense (buyback) at close:
 *   open_uah  = open_usd  × close_rate
 *   close_uah = close_usd × open_rate
 *   Note: open_uah/close_uah naming aligns with Ф1 (expenses/income), not with trade chronology.
 *
 * Commissions are not touched, IBKR already includes them in basis and realized P&L.
 */
export function uah({ open_rate, close_rate, basis, realized }: { open_rate: number; close_rate: number; basis: number; realized: number }) {
  const { open_usd, close_usd, realized_usd } = usd({ basis, realized });
  const is_long = basis > 0;

  const open_uah = open_usd * (is_long ? open_rate : close_rate);
  const close_uah = close_usd * (is_long ? close_rate : open_rate);

  return {
    open_usd,
    close_usd,
    realized_usd,
    open_uah,
    close_uah,
    realized_uah: close_uah - open_uah,
  };
}

/**
 * USD expenses and income of a closed position, before exchange rate conversion.
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
 *
 *   For expired short options, IBKR reports realized = |basis| (full premium as profit),
 *   so buyback = |basis| - |basis| = 0, naturally giving open_usd = 0 (no buyback needed).
 *   Verified against 14 real expired short positions across multiple IBKR statements.
 *
 * realized_usd = close_usd - open_usd  — always equals IBKR's reported realized P&L
 */
function usd({ basis, realized }: { basis: number; realized: number }) {
  const is_long = basis > 0;
  const open_usd = is_long ? basis : Math.abs(basis) - realized;
  const close_usd = is_long ? basis + realized : Math.abs(basis);

  return {
    open_usd,
    close_usd,
    realized_usd: close_usd - open_usd,
  };
}
