import { existsSync } from "node:fs";
import { describe, it, expect, beforeAll } from "vitest";
import { extractDividends } from "./dividends";
import { extract } from "./extract";
import { expectLotsAddUpToCloseRows, loadFixture } from "./fixture";

// Real statements are kept in gitignored private/ and never committed (the repository is public).
// These tests check only structural invariants, never real amounts, and are skipped when files are absent.

const ytd = "private/ytd.htm";
const ytdWrongColumns = "private/ytd-wrong-columns.htm";

describe.skipIf(!existsSync(ytd))(ytd, () => {
  let trades: ReturnType<typeof extract>;

  beforeAll(() => {
    trades = extract(loadFixture(ytd));
  });

  it("has trades", () => {
    expect(trades.length).toBeGreaterThan(0);
  });

  it("all numbers are parsed", () => {
    for (const trade of trades) {
      for (const key of ["open_quantity", "open_basis", "open_realized", "close_quantity", "close_proceeds", "close_commfee", "close_basis", "close_realized"] as const) {
        expect(Number.isFinite(trade[key]), `${key} of ${trade.symbol} ${trade.close_datetime}`).toBe(true);
      }
    }
  });

  it("all dates are parsed", () => {
    for (const trade of trades) {
      expect(trade.open_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(trade.close_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("lots add up to closing rows", () => {
    expectLotsAddUpToCloseRows(trades);
  });

  it("dividends are parsed", () => {
    for (const dividend of extractDividends(loadFixture(ytd))) {
      expect(dividend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(dividend.amount)).toBe(true);
      expect(Number.isFinite(dividend.tax)).toBe(true);
    }
  });
});

describe.skipIf(!existsSync(ytdWrongColumns))(ytdWrongColumns, () => {
  // Statement without "Profit and Loss: Realized P/L Only" has extra C. Price and MTM P/L columns,
  // today it is silently parsed into wrong numbers (see README TODO)
  it.todo("fails loudly with instructions, or parses exactly like private/ytd.htm");
});
