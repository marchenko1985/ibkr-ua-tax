import { describe, it, expect, beforeAll } from "vitest";
import { extract } from "./extract";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

function loadFixture(filename: string): Document {
  const html = readFileSync(`files/${filename}`, "utf-8");
  return new JSDOM(html).window.document;
}

// ─── amd.htm ─────────────────────────────────────────────────────
// 14 Closed Lots: 2 stock (AMD sold after assignment) + 12 options
// 1 assigned option: AMD 13MAR26 195 P (short put, code A;C)
// 0 expired options

describe("extract amd.htm", () => {
  let trades: ReturnType<typeof extract>;

  beforeAll(() => {
    trades = extract(loadFixture("amd.htm"));
  });

  it("extracts 14 closed lot rows", () => {
    expect(trades).toHaveLength(14);
  });

  it("sorted by close_date ascending", () => {
    for (let i = 1; i < trades.length; i++) {
      expect(trades[i].close_date >= trades[i - 1].close_date).toBe(true);
    }
  });

  describe("AMD 13MAR26 195 P (assigned short put)", () => {
    let trade: ReturnType<typeof extract>[number];

    beforeAll(() => {
      trade = trades.find((t) => t.symbol === "AMD 13MAR26 195 P")!;
    });

    it("found", () => {
      expect(trade).toBeDefined();
    });

    it("flags", () => {
      expect(trade.is_option).toBe(true);
      expect(trade.is_short).toBe(true);
      expect(trade.is_long).toBe(false);
      expect(trade.is_assignment).toBe(true);
      expect(trade.is_exercise).toBe(false);
      expect(trade.is_expired).toBe(false);
    });

    it("codes parsed", () => {
      expect(trade.close_codes).toEqual(["A", "C"]);
    });

    it("realized is 0 (economics embedded in stock)", () => {
      expect(trade.open_realized).toBe(0);
    });
  });

  describe("AMD stock rows (sold after assignment)", () => {
    let stockTrades: ReturnType<typeof extract>;

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
      expect(stockTrades[0].open_realized).toBe(108.38);
      expect(stockTrades[1].open_realized).toBe(1250.37);
    });
  });

  describe("AMD 13MAR26 190 P (closed long put, not assigned)", () => {
    let trade: ReturnType<typeof extract>[number];

    beforeAll(() => {
      trade = trades.find((t) => t.symbol === "AMD 13MAR26 190 P")!;
    });

    it("flags", () => {
      expect(trade.is_option).toBe(true);
      expect(trade.is_long).toBe(true);
      expect(trade.is_assignment).toBe(false);
      expect(trade.is_expired).toBe(false);
    });

    it("losing trade", () => {
      expect(trade.open_realized).toBe(-696.44);
    });
  });

  it("no expired options in amd.htm", () => {
    expect(trades.filter((t) => t.is_expired)).toHaveLength(0);
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
  let trades: ReturnType<typeof extract>;

  beforeAll(() => {
    trades = extract(loadFixture("qqq.htm"));
  });

  it("extracts 29 closed lot rows", () => {
    expect(trades).toHaveLength(29);
  });

  describe("QQQ stock rows (20 lots from assignment + 1 buyback)", () => {
    let qqqStocks: ReturnType<typeof extract>;

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
      const longs = qqqStocks.filter((t) => t.is_long);
      const shorts = qqqStocks.filter((t) => t.is_short);
      expect(longs).toHaveLength(20);
      expect(shorts).toHaveLength(1);
    });

    it("20 assignment-delivered lots have code A;C;O", () => {
      const delivered = qqqStocks.filter((t) => t.is_long);
      for (const t of delivered) {
        expect(t.close_codes).toContain("A");
        expect(t.close_codes).toContain("C");
        expect(t.close_codes).toContain("O");
      }
    });

    it("buyback lot (short) has code C", () => {
      const buyback = qqqStocks.find((t) => t.is_short)!;
      expect(buyback.close_codes).toEqual(["C"]);
      expect(buyback.open_realized).toBe(455.28);
    });

    it("first lot opened 2020-05-26 with basis 234.86", () => {
      const oldest = qqqStocks.find((t) => t.open_date === "2020-05-26")!;
      expect(oldest).toBeDefined();
      expect(oldest.open_basis).toBe(234.86);
      expect(oldest.open_realized).toBe(373.08);
    });

    it("all 20 assignment lots have count=1 (each in own detail row)", () => {
      const delivered = qqqStocks.filter((t) => t.is_long);
      for (const t of delivered) {
        expect(t.count).toBe(1);
      }
    });
  });

  describe("QQQ 02MAR26 607 C (assigned short call)", () => {
    let trade: ReturnType<typeof extract>[number];

    beforeAll(() => {
      trade = trades.find((t) => t.symbol === "QQQ 02MAR26 607 C")!;
    });

    it("found", () => {
      expect(trade).toBeDefined();
    });

    it("flags", () => {
      expect(trade.is_option).toBe(true);
      expect(trade.is_short).toBe(true);
      expect(trade.is_assignment).toBe(true);
      expect(trade.is_exercise).toBe(false);
      expect(trade.is_expired).toBe(false);
    });

    it("codes", () => {
      expect(trade.close_codes).toEqual(["A", "C"]);
    });

    it("realized = 0", () => {
      expect(trade.open_realized).toBe(0);
    });
  });

  describe("expired options (C;Ep)", () => {
    let expired: ReturnType<typeof extract>;

    beforeAll(() => {
      expired = trades.filter((t) => t.is_expired);
    });

    it("3 expired options", () => {
      expect(expired).toHaveLength(3);
    });

    it("QQQ 02MAR26 612 C — long expired (loss)", () => {
      const t = expired.find((t) => t.symbol === "QQQ 02MAR26 612 C")!;
      expect(t.is_long).toBe(true);
      expect(t.open_realized).toBe(-11.7);
      expect(t.is_assignment).toBe(false);
    });

    it("SPY 02MAR26 686 C — short expired (profit)", () => {
      const t = expired.find((t) => t.symbol === "SPY 02MAR26 686 C")!;
      expect(t.is_short).toBe(true);
      expect(t.open_realized).toBe(61.3);
      expect(t.is_assignment).toBe(false);
    });

    it("SPY 02MAR26 691 C — long expired (loss)", () => {
      const t = expired.find((t) => t.symbol === "SPY 02MAR26 691 C")!;
      expect(t.is_long).toBe(true);
      expect(t.open_realized).toBe(-6.7);
    });
  });

  describe("AVAV spread (normal closed options)", () => {
    it("AVAV 235 P — long, not assigned, not expired", () => {
      const t = trades.find((t) => t.symbol === "AVAV 06MAR26 235 P")!;
      expect(t.is_long).toBe(true);
      expect(t.is_assignment).toBe(false);
      expect(t.is_expired).toBe(false);
      expect(t.open_realized).toBe(-537.3);
    });

    it("AVAV 240 P — short, not assigned, not expired", () => {
      const t = trades.find((t) => t.symbol === "AVAV 06MAR26 240 P")!;
      expect(t.is_short).toBe(true);
      expect(t.is_assignment).toBe(false);
      expect(t.is_expired).toBe(false);
      expect(t.open_realized).toBe(621.7);
    });
  });

  it("only 1 assigned option (QQQ 607 C)", () => {
    expect(trades.filter((t) => t.is_assignment)).toHaveLength(1);
  });
});
