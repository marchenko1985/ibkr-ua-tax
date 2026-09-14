import { beforeAll, describe, expect, it } from "vitest";
import { enrich } from "./enrich";
import { extract } from "./extract";
import { withRates } from "./fetchRates";
import { loadFixture } from "./fixture";

type Trade = ReturnType<typeof enrich>[number];

// Fake rates, different per date so a mixed up open/close rate is visible
const qqqRates = {
  "2020-05-26": 27.0,
  "2026-02-03": 43.0,
  "2026-03-02": 43.1,
  "2026-03-03": 43.2,
};

function find(trades: Trade[], predicate: (trade: Trade) => boolean): Trade {
  const trade = trades.find(predicate);
  if (!trade) {
    throw new Error("trade not found");
  }
  return trade;
}

describe("enrich qqq.htm", () => {
  let trades: Trade[];

  beforeAll(() => {
    trades = enrich(withRates(extract(loadFixture("files/qqq.htm")), qqqRates));
  });

  it("long stock lot: expenses at open rate, income at close rate", () => {
    const trade = find(trades, (t) => t.symbol === "QQQ" && t.open_date === "2020-05-26");

    // basis 234.86, realized 373.08
    expect(trade.open_usd).toBe(234.86);
    expect(trade.close_usd).toBeCloseTo(607.94, 6); // 234.86 + 373.08
    expect(trade.realized_usd).toBeCloseTo(373.08, 6);
    expect(trade.open_uah).toBeCloseTo(6341.22, 6); // 234.86 × 27.0
    expect(trade.close_uah).toBeCloseTo(26202.214, 6); // 607.94 × 43.1
    expect(trade.realized_uah).toBeCloseTo(19860.994, 6);
  });

  it("short stock buyback: income at open rate, expenses (buyback) at close rate", () => {
    const trade = find(trades, (t) => t.symbol === "QQQ" && t.is_short);

    // basis -30397.14, realized 455.28, opened 2026-03-02, closed 2026-03-03
    expect(trade.close_usd).toBe(30397.14);
    expect(trade.open_usd).toBeCloseTo(29941.86, 6); // 30397.14 - 455.28
    expect(trade.realized_usd).toBeCloseTo(455.28, 6);
    expect(trade.close_uah).toBeCloseTo(1310116.734, 6); // 30397.14 × 43.1
    expect(trade.open_uah).toBeCloseTo(1293488.352, 6); // 29941.86 × 43.2
    expect(trade.realized_uah).toBeCloseTo(16628.382, 6);
  });

  it("expired short option: whole premium is income, no expenses", () => {
    const trade = find(trades, (t) => t.symbol === "SPY 02MAR26 686 C");

    expect(trade.open_usd).toBe(0);
    expect(trade.close_usd).toBe(61.3);
    expect(trade.open_uah).toBe(0);
    expect(trade.close_uah).toBeCloseTo(2642.03, 6); // 61.3 × 43.1
  });

  it("expired long option: whole premium is expense, no income", () => {
    const trade = find(trades, (t) => t.symbol === "QQQ 02MAR26 612 C");

    expect(trade.open_usd).toBe(11.7);
    expect(trade.close_usd).toBe(0);
    expect(trade.open_uah).toBeCloseTo(504.27, 6); // 11.7 × 43.1
    expect(trade.close_uah).toBe(0);
    expect(trade.realized_uah).toBeCloseTo(-504.27, 6);
  });

  it("assigned option: all computed values are zero", () => {
    const trade = find(trades, (t) => t.symbol === "QQQ 02MAR26 607 C");

    expect(trade.is_assignment).toBe(true);
    expect(trade).toMatchObject({ open_usd: 0, close_usd: 0, realized_usd: 0, open_uah: 0, close_uah: 0, realized_uah: 0 });
  });

  it("keeps rates", () => {
    const trade = find(trades, (t) => t.symbol === "AVAV 06MAR26 235 P");

    expect(trade.open_rate).toBe(43.0);
    expect(trade.close_rate).toBe(43.1);
  });

  it("realized USD always equals IBKR realized P/L", () => {
    for (const trade of trades.filter((t) => !t.is_assignment)) {
      expect(trade.realized_usd).toBeCloseTo(trade.open_realized, 6);
    }
  });
});
