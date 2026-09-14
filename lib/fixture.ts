// Test helpers — not used by the app.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { expect } from "vitest";
import type { extract } from "./extract";

type Trade = ReturnType<typeof extract>[number];

export function loadFixture(path: string): Document {
  return new JSDOM(readFileSync(path, "utf-8")).window.document;
}

export function parseHtml(html: string): Document {
  return new JSDOM(html).window.document;
}

/**
 * Closed lots of one closing trade must add up to the closing trade row:
 * sum of lot basis = -close basis, sum of lot realized = close realized.
 * Lots are grouped by the closing row values they were copied from.
 * IBKR rounds every lot to cents, so each lot may add up to one cent of difference
 * (qqq.htm: 20 lots sum to 19210.85 while closing row basis is 19210.86).
 */
export function expectLotsAddUpToCloseRows(trades: Trade[]) {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades) {
    const key = [trade.symbol, trade.close_datetime, trade.close_quantity, trade.close_proceeds, trade.close_basis, trade.close_realized].join("|");
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }
  for (const [key, lots] of groups) {
    const basis = lots.reduce((acc, lot) => acc + lot.open_basis, 0);
    const realized = lots.reduce((acc, lot) => acc + lot.open_realized, 0);
    const tolerance = 0.01 * lots.length + 1e-9;
    expect(Math.abs(basis + lots[0].close_basis), `basis of ${key}`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(realized - lots[0].close_realized), `realized of ${key}`).toBeLessThanOrEqual(tolerance);
  }
}
