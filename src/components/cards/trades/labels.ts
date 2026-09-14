import type { Trade } from "@/lib/extract";

/** Green for profit, red for loss */
export function pnlClassName(value: number) {
  if (value > 0) {
    return "text-green-500";
  }
  if (value < 0) {
    return "text-red-500";
  }
  return "";
}

/** "опціону" or "акцій", used in tooltips like "Витрати на придбання акцій" */
export function assetName(trade: Trade) {
  return trade.is_option ? "опціону" : "акцій";
}
