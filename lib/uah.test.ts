import { describe, it, expect } from "vitest";
import { uah } from "./uah";

/**
 * Test matrix for UAH tax calculation
 *
 * Uses two different rates to capture FX effects:
 *   open_rate  = 40 UAH/USD
 *   close_rate = 42 UAH/USD
 *
 * Covers: long/short × stock/option × win/loss × expired worthless
 *
 * Commission from IB is always ≤ 0, e.g. -1
 * commission_uah = commission * close_rate = -1 * 42 = -42
 * realized_uah = close_uah - open_uah + commission_uah (adds negative = subtracts)
 */

const open_rate = 40;
const close_rate = 42;
const commission = -1;

// ─── LONG POSITIONS ──────────────────────────────────────────────
// Long: open_uah = basis * open_rate
//       close_uah = (basis + realized) * close_rate

describe("long", () => {
  describe("stock", () => {
    it("winning trade", () => {
      // Bought for $100, sold for $150 → realized = +50
      const result = uah({
        open_rate,
        close_rate,
        basis: 100,
        realized: 50,
        commission,
      });

      expect(result.open_uah).toBe(100 * 40); // 4000
      expect(result.close_uah).toBe((100 + 50) * 42); // 6300
      // 6300 - 4000 + (-42) = 2258
      // expect(result.realized_uah).toBe(2258);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(6300 - 4000); // 2300
    });

    it("losing trade", () => {
      // Bought for $100, sold for $50 → realized = -50
      const result = uah({
        open_rate,
        close_rate,
        basis: 100,
        realized: -50,
        commission,
      });

      expect(result.open_uah).toBe(100 * 40); // 4000
      expect(result.close_uah).toBe((100 + -50) * 42); // 2100
      // 2100 - 4000 + (-42) = -1942
      // expect(result.realized_uah).toBe(-1942);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(2100 - 4000); // -1900
    });
  });

  describe("option", () => {
    it("winning trade", () => {
      // Bought call for $100, sold for $150 → realized = +50
      const result = uah({
        open_rate,
        close_rate,
        basis: 100,
        realized: 50,
        commission,
      });

      expect(result.open_uah).toBe(4000);
      expect(result.close_uah).toBe(6300);
      // expect(result.realized_uah).toBe(2258);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(6300 - 4000); // 2300
    });

    it("losing trade", () => {
      // Bought call for $100, sold for $50 → realized = -50
      const result = uah({
        open_rate,
        close_rate,
        basis: 100,
        realized: -50,
        commission,
      });

      expect(result.open_uah).toBe(4000);
      expect(result.close_uah).toBe(2100);
      // expect(result.realized_uah).toBe(-1942);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(2100 - 4000); // -1900
    });

    it("expired worthless (total loss)", () => {
      // Bought option for $100, expired worthless → realized = -100
      // This goes through the long branch: close_uah = (100 + -100) * 42 = 0
      const result = uah({
        open_rate,
        close_rate,
        basis: 100,
        realized: -100,
        commission: 0,
      });

      expect(result.open_uah).toBe(100 * 40); // 4000
      expect(result.close_uah).toBe(0); // (100 + -100) * 42 = 0
      // 0 - 4000 + 0 = -4000 (full loss)
      expect(result.realized_uah).toBe(-4000);
    });
  });
});

// ─── SHORT POSITIONS ─────────────────────────────────────────────
// Short (not expired):
//   credit  = basis (negative, e.g. -100 = received $100 premium)
//   buyback = |basis| - realized
//   open_uah  = buyback * close_rate   (cost of closing, shown as "open" for readability)
//   close_uah = |credit| * open_rate   (income from opening, shown as "close" for readability)
//
// Short (expired worthless):
//   open_uah  = 0
//   close_uah = |basis| * open_rate

describe("short", () => {
  describe("stock", () => {
    it("winning trade", () => {
      // Shorted for $100, bought back for $90 → realized = +10
      // buyback = 100 - 10 = 90
      const result = uah({
        open_rate,
        close_rate,
        basis: -100,
        realized: 10,
        commission,
      });

      expect(result.open_uah).toBe(90 * 42); // 3780 (buyback cost)
      expect(result.close_uah).toBe(100 * 40); // 4000 (initial credit)
      // 4000 - 3780 + (-42) = 178
      // expect(result.realized_uah).toBe(178);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(4000 - 3780); // 220
    });

    it("losing trade", () => {
      // Shorted for $100, bought back for $110 → realized = -10
      // buyback = 100 - (-10) = 110
      const result = uah({
        open_rate,
        close_rate,
        basis: -100,
        realized: -10,
        commission,
      });

      expect(result.open_uah).toBe(110 * 42); // 4620 (buyback cost)
      expect(result.close_uah).toBe(100 * 40); // 4000 (initial credit)
      // 4000 - 4620 + (-42) = -662
      // expect(result.realized_uah).toBe(-662);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(4000 - 4620); // -620
    });
  });

  describe("option", () => {
    it("winning trade", () => {
      // Sold option for $100 premium, bought back for $50 → realized = +50
      // buyback = 100 - 50 = 50
      const result = uah({
        open_rate,
        close_rate,
        basis: -100,
        realized: 50,
        commission,
      });

      expect(result.open_uah).toBe(50 * 42); // 2100 (buyback cost)
      expect(result.close_uah).toBe(100 * 40); // 4000 (initial credit)
      // 4000 - 2100 + (-42) = 1858
      // expect(result.realized_uah).toBe(1858);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(4000 - 2100); // 1900
    });

    it("losing trade", () => {
      // Sold option for $100, bought back for $110 → realized = -10
      // buyback = 100 - (-10) = 110
      const result = uah({
        open_rate,
        close_rate,
        basis: -100,
        realized: -10,
        commission,
      });

      expect(result.open_uah).toBe(110 * 42); // 4620
      expect(result.close_uah).toBe(100 * 40); // 4000
      // 4000 - 4620 + (-42) = -662
      // expect(result.realized_uah).toBe(-662);
      // NOTE: we do not need touch commissions
      expect(result.realized_uah).toBe(4000 - 4620); // -620
    });

    it("expired worthless (IBKR reports realized = |basis|)", () => {
      // IBKR always reports realized = |basis| for expired short options
      // e.g. NVDA 114 C: basis=-54.42, realized=54.42, commission=0
      // buyback = 100 - 100 = 0 → open_uah = 0 (no buyback needed)
      const result = uah({
        open_rate,
        close_rate,
        basis: -100,
        realized: 100,
        commission: 0,
      });

      expect(result.open_uah).toBe(0); // buyback = 100 - 100 = 0
      expect(result.close_uah).toBe(100 * 40); // 4000
      expect(result.realized_uah).toBe(4000);
    });
  });
});

// ─── SAME RATE (no FX effect) ────────────────────────────────────
// Verifies that when open_rate === close_rate, realized_uah ≈ realized * rate + commission * rate

describe("same rate (no FX effect)", () => {
  const rate = 40;

  it("long winning", () => {
    const result = uah({
      open_rate: rate,
      close_rate: rate,
      basis: 100,
      realized: 50,
      commission: -1,
    });

    // realized_uah should be (realized + commission) * rate = (50 - 1) * 40 = 1960
    expect(result.open_uah).toBe(4000);
    expect(result.close_uah).toBe(6000);
    // 6000 - 4000 + (-40) = 1960
    // expect(result.realized_uah).toBe(1960);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBe(6000 - 4000); // 2000
  });

  it("short winning", () => {
    const result = uah({
      open_rate: rate,
      close_rate: rate,
      basis: -100,
      realized: 50,
      commission: -1,
    });

    // buyback = 100 - 50 = 50
    expect(result.open_uah).toBe(50 * 40); // 2000
    expect(result.close_uah).toBe(100 * 40); // 4000
    // 4000 - 2000 + (-40) = 1960
    // expect(result.realized_uah).toBe(1960);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBe(4000 - 2000); // 2000
  });
});

// ─── REAL EXAMPLES FROM IB STATEMENTS ────────────────────────────
// Using actual trade data, with hypothetical rates open=40, close=42

describe("real IB examples", () => {
  it("TSLA long stock win", () => {
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: 495.4,
      realized: 277.58,
      commission: -1.02,
    });

    expect(result.open_uah).toBeCloseTo(495.4 * 40, 2); // 19816.00
    expect(result.close_uah).toBeCloseTo((495.4 + 277.58) * 42, 2); // 32465.16
    // 32465.16 - 19816.00 + (-1.02 * 42) = 32465.16 - 19816 - 42.84 = 12606.32
    // expect(result.realized_uah).toBeCloseTo(12606.32, 2);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBeCloseTo(32465.16 - 19816, 2); // 12649.16
  });

  it("NVDA short option win (bought back)", () => {
    // basis=-39.95, realized=37.09 → buyback = 39.95 - 37.09 = 2.86
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: -39.95,
      realized: 37.09,
      commission: -0.86,
    });

    expect(result.open_uah).toBeCloseTo(2.86 * 42, 2); // 120.12
    expect(result.close_uah).toBeCloseTo(39.95 * 40, 2); // 1598.00
    // 1598.00 - 120.12 + (-0.86 * 42) = 1598 - 120.12 - 36.12 = 1441.76
    // expect(result.realized_uah).toBeCloseTo(1441.76, 2);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBeCloseTo(1598 - 120.12, 2); // 1477.88
  });

  it("NVDA short option expired (realized = |basis|)", () => {
    // basis=-54.42, realized=54.42 → buyback = 0
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: -54.42,
      realized: 54.42,
      commission: 0,
    });

    expect(result.open_uah).toBeCloseTo(0, 2);
    expect(result.close_uah).toBeCloseTo(54.42 * 40, 2); // 2176.80
    expect(result.realized_uah).toBeCloseTo(2176.8, 2);
  });

  it("AAPL short stock win (USD win, possible UAH loss due to FX)", () => {
    // basis=-1149.19, realized=9.95
    // buyback = 1149.19 - 9.95 = 1139.24
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: -1149.19,
      realized: 9.95,
      commission: -0.34,
    });

    expect(result.open_uah).toBeCloseTo(1139.24 * 42, 2); // 47848.08
    expect(result.close_uah).toBeCloseTo(1149.19 * 40, 2); // 45967.60
    // 45967.60 - 47848.08 + (-0.34 * 42) = -1894.76
    // USD win but UAH loss due to rising exchange rate!
    // expect(result.realized_uah).toBeCloseTo(-1894.76, 2);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBeCloseTo(45967.6 - 47848.08, 2); // -1880.48
  });

  it("SMCI short option expired worthless (realized = |basis|)", () => {
    // IBKR reports realized=164.95 for expired short with basis=-164.95
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: -164.95,
      realized: 164.95,
      commission: 0,
    });

    expect(result.open_uah).toBe(0); // buyback = 164.95 - 164.95 = 0
    expect(result.close_uah).toBeCloseTo(164.95 * 40, 2); // 6598.00
    expect(result.realized_uah).toBeCloseTo(6598.0, 2);
  });

  it("AMD long option loss", () => {
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: 74.66,
      realized: -73.88,
      commission: -1.22,
    });

    expect(result.open_uah).toBeCloseTo(74.66 * 40, 2); // 2986.40
    expect(result.close_uah).toBeCloseTo((74.66 + -73.88) * 42, 2); // 32.76
    // 32.76 - 2986.40 + (-1.22 * 42) = 32.76 - 2986.4 - 51.24 = -3004.88
    // expect(result.realized_uah).toBeCloseTo(-3004.88, 2);
    // NOTE: we do not need touch commissions
    expect(result.realized_uah).toBeCloseTo(32.76 - 2986.4, 2); // -2953.64
  });

  it("APP short option expired worthless (realized = |basis|)", () => {
    // IBKR reports realized=479.78 for expired short with basis=-479.78
    const result = uah({
      open_rate: 40,
      close_rate: 42,
      basis: -479.78,
      realized: 479.78,
      commission: 0,
    });

    expect(result.open_uah).toBe(0); // buyback = 479.78 - 479.78 = 0
    expect(result.close_uah).toBeCloseTo(479.78 * 40, 2); // 19191.20
    expect(result.realized_uah).toBeCloseTo(19191.2, 2);
  });
});

// ─── REAL DATA FROM HTML FIXTURES ────────────────────────────────
// These tests use actual trade data from amd.htm and qqq.htm fixtures.
// Rates are hypothetical (40/42) to verify formula correctness.

describe("real fixture data", () => {
  describe("amd.htm trades", () => {
    it("AMD 13MAR26 190 P — long put, losing trade (closed normally)", () => {
      // basis=714.99, realized=-696.44, commission=-1.45
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 714.99,
        realized: -696.44,
        commission: -1.45,
      });

      // Long: open_uah = basis * open_rate = 714.99 * 40 = 28599.60
      expect(result.open_uah).toBeCloseTo(714.99 * 40, 2);
      // Long: close_uah = (basis + realized) * close_rate = (714.99 + -696.44) * 42 = 18.55 * 42 = 779.10
      expect(result.close_uah).toBeCloseTo((714.99 + -696.44) * 42, 2);
      // realized_uah = 779.10 - 28599.60 = -27820.50
      expect(result.realized_uah).toBeCloseTo(779.1 - 28599.6, 2);
    });

    it("AMD stock lot 1 — long stock from assignment, winning", () => {
      // basis=1489.44, realized=108.38, commission=-0.34
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 1489.44,
        realized: 108.38,
        commission: -0.34,
      });

      expect(result.open_uah).toBeCloseTo(1489.44 * 40, 2); // 59577.60
      expect(result.close_uah).toBeCloseTo((1489.44 + 108.38) * 42, 2); // 67108.44
      expect(result.realized_uah).toBeCloseTo(67108.44 - 59577.6, 2); // 7530.84
    });

    it("DY 20MAR26 410 P — short put, losing trade (bear put spread leg)", () => {
      // basis=-2188.95, realized=-3512.10, commission=-1.05
      // buyback = |basis| - realized = 2188.95 - (-3512.10) = 5701.05
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: -2188.95,
        realized: -3512.1,
        commission: -1.05,
      });

      const buyback = 2188.95 - -3512.1; // 5701.05
      expect(result.open_uah).toBeCloseTo(buyback * 42, 2); // 239444.10
      expect(result.close_uah).toBeCloseTo(2188.95 * 40, 2); // 87558.00
      expect(result.realized_uah).toBeCloseTo(87558.0 - 239444.1, 2); // -151886.10
    });
  });

  describe("qqq.htm trades", () => {
    it("QQQ stock first lot — long from assignment, winning", () => {
      // basis=234.86, realized=373.08
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 234.86,
        realized: 373.08,
        commission: 0,
      });

      expect(result.open_uah).toBeCloseTo(234.86 * 40, 2); // 9394.40
      expect(result.close_uah).toBeCloseTo((234.86 + 373.08) * 42, 2); // 25533.48
      expect(result.realized_uah).toBeCloseTo(25533.48 - 9394.4, 2); // 16139.08
    });

    it("QQQ stock buyback — short stock, winning", () => {
      // basis=-30397.14, realized=455.28, commission=-0.36
      // buyback = 30397.14 - 455.28 = 29941.86
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: -30397.14,
        realized: 455.28,
        commission: -0.36,
      });

      const buyback = 30397.14 - 455.28; // 29941.86
      expect(result.open_uah).toBeCloseTo(buyback * 42, 2);
      expect(result.close_uah).toBeCloseTo(30397.14 * 40, 2);
      expect(result.realized_uah).toBeCloseTo(30397.14 * 40 - buyback * 42, 2);
    });

    it("QQQ 02MAR26 612 C — long call, expired worthless (loss)", () => {
      // basis=11.70, realized=-11.70 (total loss)
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 11.7,
        realized: -11.7,
        commission: 0,
      });

      expect(result.open_uah).toBeCloseTo(11.7 * 40, 2); // 468.00
      expect(result.close_uah).toBeCloseTo(0, 2); // (11.70 + -11.70) * 42 = 0
      expect(result.realized_uah).toBeCloseTo(-468.0, 2); // full loss
    });

    it("SPY 02MAR26 686 C — short call, expired worthless (full win)", () => {
      // basis=-61.30, realized=61.30 → buyback = 0
      // Regular short branch handles this (realized = |basis|)
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: -61.3,
        realized: 61.3,
        commission: 0,
      });

      expect(result.open_uah).toBeCloseTo(0, 2); // buyback = 61.30 - 61.30 = 0
      expect(result.close_uah).toBeCloseTo(61.3 * 40, 2); // 2452.00
      expect(result.realized_uah).toBeCloseTo(2452.0, 2);
    });

    it("SPY 02MAR26 691 C — long call, expired worthless (loss)", () => {
      // basis=6.70, realized=-6.70
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 6.7,
        realized: -6.7,
        commission: 0,
      });

      expect(result.open_uah).toBeCloseTo(6.7 * 40, 2); // 268.00
      expect(result.close_uah).toBeCloseTo(0, 2);
      expect(result.realized_uah).toBeCloseTo(-268.0, 2);
    });

    it("AVAV 06MAR26 235 P — long put, losing trade", () => {
      // basis=610.25, realized=-537.30, commission=-1.05
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: 610.25,
        realized: -537.3,
        commission: -1.05,
      });

      expect(result.open_uah).toBeCloseTo(610.25 * 40, 2); // 24410.00
      expect(result.close_uah).toBeCloseTo((610.25 + -537.3) * 42, 2); // 72.95 * 42 = 3063.90
      expect(result.realized_uah).toBeCloseTo(3063.9 - 24410.0, 2); // -21346.10
    });

    it("AVAV 06MAR26 240 P — short put, winning trade (spread leg)", () => {
      // basis=-726.75, realized=621.70, commission=-1.05
      // buyback = 726.75 - 621.70 = 105.05
      const result = uah({
        open_rate: 40,
        close_rate: 42,
        basis: -726.75,
        realized: 621.7,
        commission: -1.05,
      });

      const buyback = 726.75 - 621.7; // 105.05
      expect(result.open_uah).toBeCloseTo(buyback * 42, 2); // 4412.10
      expect(result.close_uah).toBeCloseTo(726.75 * 40, 2); // 29070.00
      expect(result.realized_uah).toBeCloseTo(29070.0 - 4412.1, 2); // 24657.90
    });
  });
});
