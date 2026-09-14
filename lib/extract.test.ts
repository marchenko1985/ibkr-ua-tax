import { describe, it, expect, beforeAll } from "vitest";
import { extract } from "./extract";
import { expectLotsAddUpToCloseRows, loadFixture, parseHtml } from "./fixture";

type Trade = ReturnType<typeof extract>[number];

function find(trades: Trade[], symbol: string): Trade {
  const trade = trades.find((t) => t.symbol === symbol);
  if (!trade) throw new Error(`trade ${symbol} not found`);
  return trade;
}

describe("extract empty document", () => {
  it("returns no trades", () => {
    expect(extract(parseHtml("<html><body></body></html>"))).toEqual([]);
  });
});

// ─── amd.htm ─────────────────────────────────────────────────────
// 14 Closed Lots: 2 stock (AMD sold after assignment) + 12 options
// 1 assigned option: AMD 13MAR26 195 P (short put, code A;C)
// 0 expired options

describe("extract amd.htm", () => {
  let trades: Trade[];

  beforeAll(() => {
    trades = extract(loadFixture("files/amd.htm"));
  });

  it("extracts 14 closed lot rows", () => {
    expect(trades).toHaveLength(14);
  });

  it("sorted by close_date ascending", () => {
    const dates = trades.map((t) => t.close_date);
    expect(dates).toEqual([...dates].sort());
  });

  it("lots add up to closing rows", () => {
    expectLotsAddUpToCloseRows(trades);
  });

  it("all fields of a closed option lot", () => {
    const trade = find(trades, "AMD 13MAR26 190 P");
    expect(trade).toMatchObject({
      symbol: "AMD 13MAR26 190 P",
      exchange: "PSE",
      open_date: "2026-02-06",
      open_quantity: 1,
      open_tprice: 7.1498875,
      open_basis: 714.99,
      open_realized: -696.44,
      open_code: "ST",
      open_codes: ["ST"],
      close_datetime: "2026-03-13, 11:41:16",
      close_date: "2026-03-13",
      close_year: 2026,
      close_quantity: -1,
      close_tprice: 0.2,
      close_proceeds: 20,
      close_commfee: -1.45,
      close_basis: -714.99,
      close_realized: -696.44,
      close_code: "C",
      close_codes: ["C"],
      is_long: true,
      is_short: false,
      is_option: true,
      is_assignment: false,
      is_exercise: false,
    });
  });

  it("thousands separators are removed from numbers", () => {
    const lot = trades.find((t) => t.symbol === "AMD" && t.open_quantity === 92);
    expect(lot?.open_basis).toBe(17128.55);
    expect(lot?.close_proceeds).toBe(18378.84);
  });

  describe("AMD 13MAR26 195 P (assigned short put)", () => {
    let trade: Trade;

    beforeAll(() => {
      trade = find(trades, "AMD 13MAR26 195 P");
    });

    it("flags", () => {
      expect(trade.is_option).toBe(true);
      expect(trade.is_short).toBe(true);
      expect(trade.is_long).toBe(false);
      expect(trade.is_assignment).toBe(true);
      expect(trade.is_exercise).toBe(false);
    });

    it("codes parsed", () => {
      expect(trade.close_codes).toEqual(["A", "C"]);
    });

    it("realized is 0 (economics embedded in stock)", () => {
      expect(trade.open_realized).toBe(0);
    });
  });

  describe("AMD stock rows (sold after assignment)", () => {
    let stockTrades: Trade[];

    beforeAll(() => {
      stockTrades = trades.filter((t) => t.symbol === "AMD");
    });

    it("2 stock lots", () => {
      expect(stockTrades).toHaveLength(2);
    });

    it("none flagged as assignment (stock rows are taxable)", () => {
      for (const t of stockTrades) {
        expect(t.is_assignment).toBe(false);
        expect(t.is_option).toBe(false);
        expect(t.is_long).toBe(true);
      }
    });

    it("positive realized P/L", () => {
      expect(stockTrades.map((t) => t.open_realized)).toEqual([108.38, 1250.37]);
    });

    it("partial execution code", () => {
      expect(stockTrades.map((t) => t.close_codes)).toEqual([
        ["C", "P"],
        ["C", "P"],
      ]);
    });
  });

  it("only 1 assigned option", () => {
    expect(trades.filter((t) => t.is_assignment)).toHaveLength(1);
  });
});

// ─── qqq.htm ─────────────────────────────────────────────────────
// 29 Closed Lots: 21 stock (20 QQQ assignment-delivery + 1 QQQ buyback) + 8 options
// 1 assigned option: QQQ 02MAR26 607 C (short call, code A;C)
// 3 expired options: QQQ 612C, SPY 686C, SPY 691C (code C;Ep)
// 20 QQQ stock rows with code A;C;O — these are taxable (not options)

describe("extract qqq.htm", () => {
  let trades: Trade[];

  beforeAll(() => {
    trades = extract(loadFixture("files/qqq.htm"));
  });

  it("extracts 29 closed lot rows", () => {
    expect(trades).toHaveLength(29);
  });

  it("lots add up to closing rows", () => {
    expectLotsAddUpToCloseRows(trades);
  });

  describe("QQQ stock rows (20 lots from assignment + 1 buyback)", () => {
    let qqqStocks: Trade[];

    beforeAll(() => {
      qqqStocks = trades.filter((t) => t.symbol === "QQQ");
    });

    it("21 QQQ stock rows", () => {
      expect(qqqStocks).toHaveLength(21);
    });

    it("none flagged as assignment (stock rows ARE taxable)", () => {
      for (const t of qqqStocks) {
        expect(t.is_assignment).toBe(false);
        expect(t.is_option).toBe(false);
      }
    });

    it("20 long + 1 short (buyback)", () => {
      expect(qqqStocks.filter((t) => t.is_long)).toHaveLength(20);
      expect(qqqStocks.filter((t) => t.is_short)).toHaveLength(1);
    });

    it("20 assignment-delivered lots share one closing row", () => {
      const delivered = qqqStocks.filter((t) => t.is_long);
      for (const t of delivered) {
        expect(t.close_codes).toEqual(["A", "C", "O"]);
        expect(t.close_datetime).toBe("2026-03-02, 16:20:00");
        expect(t.close_quantity).toBe(-100);
        expect(t.close_proceeds).toBe(60700);
        expect(t.close_basis).toBe(-19210.86);
        expect(t.close_realized).toBe(11186.28);
      }
    });

    it("long term lots keep their own open dates", () => {
      const openDates = qqqStocks.filter((t) => t.is_long).map((t) => t.open_date);
      expect(new Set(openDates).size).toBe(20);
      expect(openDates).toContain("2020-05-26");
      expect(openDates).toContain("2024-12-16");
    });

    it("buyback lot (short) has code C", () => {
      const buyback = qqqStocks.find((t) => t.is_short);
      expect(buyback).toMatchObject({
        open_date: "2026-03-02",
        open_quantity: -50,
        open_basis: -30397.14,
        open_realized: 455.28,
        close_date: "2026-03-03",
        close_codes: ["C"],
      });
    });

    it("first lot opened 2020-05-26 with basis 234.86", () => {
      const oldest = qqqStocks.find((t) => t.open_date === "2020-05-26");
      expect(oldest?.open_basis).toBe(234.86);
      expect(oldest?.open_realized).toBe(373.08);
      expect(oldest?.open_codes).toEqual(["LT"]);
    });
  });

  describe("QQQ 02MAR26 607 C (assigned short call)", () => {
    it("flags, codes and zero realized", () => {
      const trade = find(trades, "QQQ 02MAR26 607 C");
      expect(trade.is_option).toBe(true);
      expect(trade.is_short).toBe(true);
      expect(trade.is_assignment).toBe(true);
      expect(trade.is_exercise).toBe(false);
      expect(trade.close_codes).toEqual(["A", "C"]);
      expect(trade.open_realized).toBe(0);
    });
  });

  describe("expired options (C;Ep code)", () => {
    it("QQQ 02MAR26 612 C — long expired (loss)", () => {
      const t = find(trades, "QQQ 02MAR26 612 C");
      expect(t.is_long).toBe(true);
      expect(t.open_realized).toBe(-11.7);
      expect(t.is_assignment).toBe(false);
      expect(t.close_codes).toEqual(["C", "Ep"]);
    });

    it("SPY 02MAR26 686 C — short expired (profit)", () => {
      const t = find(trades, "SPY 02MAR26 686 C");
      expect(t.is_short).toBe(true);
      expect(t.open_basis).toBe(-61.3);
      expect(t.open_realized).toBe(61.3);
      expect(t.is_assignment).toBe(false);
      expect(t.close_codes).toEqual(["C", "Ep"]);
    });

    it("SPY 02MAR26 691 C — long expired (loss)", () => {
      const t = find(trades, "SPY 02MAR26 691 C");
      expect(t.is_long).toBe(true);
      expect(t.open_realized).toBe(-6.7);
      expect(t.close_codes).toEqual(["C", "Ep"]);
    });
  });

  describe("AVAV spread (normal closed options)", () => {
    it("AVAV 235 P — long, not assigned, not expired", () => {
      const t = find(trades, "AVAV 06MAR26 235 P");
      expect(t.is_long).toBe(true);
      expect(t.is_assignment).toBe(false);
      expect(t.open_realized).toBe(-537.3);
    });

    it("AVAV 240 P — short, not assigned", () => {
      const t = find(trades, "AVAV 06MAR26 240 P");
      expect(t.is_short).toBe(true);
      expect(t.is_assignment).toBe(false);
      expect(t.open_realized).toBe(621.7);
    });
  });

  it("only 1 assigned option (QQQ 607 C)", () => {
    expect(trades.filter((t) => t.is_assignment)).toHaveLength(1);
  });
});
