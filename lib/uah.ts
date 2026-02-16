export function uah({ open_rate, close_rate, basis, realized, commission, is_expired = false }: { open_rate: number; close_rate: number; basis: number; realized: number; commission: number; is_expired?: boolean }) {
  const is_long = basis > 0;

  let open_uah = 0;
  let close_uah = 0;

  if (is_long) {
    open_uah = basis * open_rate;
    close_uah = (basis + realized) * close_rate;
  } else {
    if (!is_expired) {
      const credit = basis; // open_basis is negative for short positions - gives us initial credit
      // at close time we are buying it back, negative open_realized means we have losing trade, positive - winning trade
      // example: open_basis = -100, open_realized = -100 -> we are buying back for 200, open_basis + open_realized = -200
      const buyback = Math.abs(basis) - realized;
      // here we are inverting open and close to have positive open_uah and close_uah
      open_uah = buyback * close_rate;
      close_uah = Math.abs(credit) * open_rate;
    } else {
      // for expired worthless options we have no buyback, so we just take initial credit as close_uah and 0 as open_uah
      close_uah = Math.abs(basis) * open_rate;
      open_uah = 0;
    }
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
