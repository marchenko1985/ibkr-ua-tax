/**
 * Converts a closed position's USD basis and realized P&L into UAH tax-reportable amounts.
 *
 * Universal formula (works for stocks, options, long, short, expired):
 *   expenses (open_uah)  = adjusted USD expense × FX rate at expense date
 *   income   (close_uah) = adjusted USD income  × FX rate at income date
 *   realized_uah = close_uah - open_uah
 *
 * The "adjusted USD" values account for all fees (already embedded by IBKR in basis and realized P&L).
 *
 * For LONG positions (basis > 0):
 *   open_uah  = basis × open_rate          — what was spent to buy, at the time of purchase
 *   close_uah = (basis + realized) × close_rate  — net proceeds after fees, at the time of sale
 *
 * For SHORT positions (basis < 0):
 *   The cash flow is reversed: income (selling/writing) happens first, expense (buyback) later.
 *   buyback   = |basis| - realized          — cost to close the short position
 *   open_uah  = buyback × close_rate        — expense in UAH at the time of buyback
 *   close_uah = |basis| × open_rate         — income in UAH at the time of initial sale
 *   Note: open_uah/close_uah naming aligns with Ф1 (expenses/income), not with trade chronology.
 *
 *   For expired short options, IBKR reports realized = |basis| (full premium as profit),
 *   so buyback = |basis| - |basis| = 0, naturally giving open_uah = 0 (no buyback needed).
 *   Verified against 14 real expired short positions across multiple IBKR statements.
 */
export function uah({ open_rate, close_rate, basis, realized, commission }: { open_rate: number; close_rate: number; basis: number; realized: number; commission: number }) {
  const is_long = basis > 0;

  let open_uah = 0;
  let close_uah = 0;

  if (is_long) {
    open_uah = basis * open_rate;
    close_uah = (basis + realized) * close_rate;
  } else {
    const credit = basis; // open_basis is negative for short positions - gives us initial credit
    // at close time we are buying it back, negative open_realized means we have losing trade, positive - winning trade
    // example: open_basis = -100, open_realized = -100 -> we are buying back for 200, open_basis + open_realized = -200
    const buyback = Math.abs(basis) - realized;
    // here we are inverting open and close to have positive open_uah and close_uah
    open_uah = buyback * close_rate;
    close_uah = Math.abs(credit) * open_rate;
  }

  const commission_uah = commission * close_rate;

  const realized_uah = close_uah - open_uah;
  // + commission_uah; // note: we do not need to touch commissions at all, because they are already included in realized P&L, so we just ignore them here

  return {
    open_uah,
    close_uah,
    realized_uah,
  };
}
