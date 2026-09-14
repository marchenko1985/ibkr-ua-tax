import type { Trade } from "@/lib/extract";

export interface TradesFilter {
  search: string;
  showStocks: boolean;
  showOptions: boolean;
}

export function filterTrades(trades: Trade[], { search, showStocks, showOptions }: TradesFilter) {
  const symbol = search.toLowerCase();
  return trades.filter((trade) => {
    if (symbol && !trade.symbol.toLowerCase().includes(symbol)) {
      return false;
    }
    return trade.is_option ? showOptions : showStocks;
  });
}
