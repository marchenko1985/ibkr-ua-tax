import { describe, expect, it } from "vitest";
import { detectType } from "./detectType";
import { strategies } from "./strategies";

describe("detectType comprehensive tests", () => {
  // Group 1: Single Position Strategies
  describe("Single Position Strategies", () => {
    it("Long Call", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call option
      ]);
      expect(actual.name).toEqual(strategies.longCall.name);
    });

    it("Long Put", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put option
      ]);
      expect(actual.name).toEqual(strategies.longPut.name);
    });

    it("Short Call", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call option
      ]);
      expect(actual.name).toEqual(strategies.shortCall.name);
    });

    it("Short Put", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put option
      ]);
      expect(actual.name).toEqual(strategies.shortPut.name);
    });

    it("Cash-Secured Put", () => {
      const actual = detectType(
        [
          { type: "put", position: -1, strike: 100, dte: 30 }, // Short put option
        ],
        true, // isCashSecured = true
      );
      expect(actual.name).toEqual(strategies.cashSecuredPut.name);
    });

    it("Long Stock", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 50 }, // Long 100 shares of stock
      ]);
      expect(actual.name).toEqual(strategies.longEquity.name);
    });

    it("Short Stock", () => {
      const actual = detectType([
        { type: "stock", position: -100, basis: 50 }, // Short 100 shares of stock
      ]);
      expect(actual.name).toEqual(strategies.shortEquity.name);
    });
  });

  // Group 2: Vertical Spread Strategies
  describe("Vertical Spread Strategies", () => {
    it("Bull Call Spread", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long lower strike call
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher strike call
      ]);
      expect(actual.name).toEqual(strategies.bullCallSpread.name);
    });

    it("Bear Call Spread", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short lower strike call
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.bearCallSpread.name);
    });

    it("Bull Put Spread", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short higher strike put
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long lower strike put
      ]);
      expect(actual.name).toEqual(strategies.bullPutSpread.name);
    });

    it("Bear Put Spread", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long higher strike put
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short lower strike put
      ]);
      expect(actual.name).toEqual(strategies.bearPutSpread.name);
    });
  });

  // Group 3: Calendar & Diagonal Spread Strategies
  describe("Calendar & Diagonal Spread Strategies", () => {
    it("Calendar Call Spread", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short near-term call
        { type: "call", position: 1, strike: 100, dte: 60 }, // Long far-term call at same strike
      ]);
      expect(actual.name).toEqual(strategies.calendarCallSpread.name);
    });

    it("Calendar Put Spread", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short near-term put
        { type: "put", position: 1, strike: 100, dte: 60 }, // Long far-term put at same strike
      ]);
      expect(actual.name).toEqual(strategies.calendarPutSpread.name);
    });

    it("Diagonal Call Spread", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short near-term call at lower strike
        { type: "call", position: 1, strike: 110, dte: 60 }, // Long far-term call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.diagonalCallSpread.name);
    });

    it("Diagonal Put Spread", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short near-term put at higher strike
        { type: "put", position: 1, strike: 100, dte: 60 }, // Long far-term put at lower strike
      ]);
      expect(actual.name).toEqual(strategies.diagonalPutSpread.name);
    });

    it("Reverse Calendar Call Spread", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long near-term call
        { type: "call", position: -1, strike: 100, dte: 60 }, // Short far-term call at same strike
      ]);
      expect(actual.name).toEqual(strategies.reverseCalendarCallSpread.name);
    });

    it("Reverse Diagonal Call Spread", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long near-term call at lower strike
        { type: "call", position: -1, strike: 110, dte: 60 }, // Short far-term call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.reverseDiagonalCallSpread.name);
    });

    it("Reverse Calendar Put Spread", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long near-term put
        { type: "put", position: -1, strike: 100, dte: 60 }, // Short far-term put at same strike
      ]);
      expect(actual.name).toEqual(strategies.reverseCalendarPutSpread.name);
    });

    it("Reverse Diagonal Put Spread", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long near-term put at higher strike
        { type: "put", position: -1, strike: 100, dte: 60 }, // Short far-term put at lower strike
      ]);
      expect(actual.name).toEqual(strategies.reverseDiagonalPutSpread.name);
    });
  });

  // Group 4: Straddles and Strangles
  describe("Straddles and Strangles", () => {
    it("Long Straddle", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call at the strike
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put at the same strike
      ]);
      expect(actual.name).toEqual(strategies.straddle.name);
    });

    it("Short Straddle", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at the strike
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at the same strike
      ]);
      expect(actual.name).toEqual(strategies.shortStraddle.name);
    });

    it("Long Strangle", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long lower strike put
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.strangle.name);
    });

    it("Short Strangle", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short lower strike put
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher strike call
      ]);
      expect(actual.name).toEqual(strategies.shortStrangle.name);
    });

    it("Long Guts", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 90, dte: 30 }, // Long in-the-money call
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long in-the-money put
      ]);
      expect(actual.name).toEqual(strategies.guts.name);
    });

    it("Short Guts", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 90, dte: 30 }, // Short in-the-money call
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short in-the-money put
      ]);
      expect(actual.name).toEqual(strategies.shortGuts.name);
    });
  });

  // Group 5: Butterfly and Condor Strategies
  describe("Butterfly and Condor Strategies", () => {
    it("Long Call Butterfly", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 90, dte: 30 }, // Long lower strike call
        { type: "call", position: -2, strike: 100, dte: 30 }, // Short 2 middle strike calls
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.longCallButterfly.name);
    });

    it("Long Put Butterfly", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long lower strike put
        { type: "put", position: -2, strike: 100, dte: 30 }, // Short 2 middle strike puts
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long higher strike put
      ]);
      expect(actual.name).toEqual(strategies.longPutButterfly.name);
    });

    it("Short Call Butterfly", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 90, dte: 30 }, // Short lower strike call
        { type: "call", position: 2, strike: 100, dte: 30 }, // Long 2 middle strike calls
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher strike call
      ]);
      expect(actual.name).toEqual(strategies.shortCallButterfly.name);
    });

    it("Short Put Butterfly", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short lower strike put
        { type: "put", position: 2, strike: 100, dte: 30 }, // Long 2 middle strike puts
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short higher strike put
      ]);
      expect(actual.name).toEqual(strategies.shortPutButterfly.name);
    });

    it("Long Call Condor", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 80, dte: 30 }, // Long lowest strike call
        { type: "call", position: -1, strike: 90, dte: 30 }, // Short lower middle strike call
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher middle strike call
        { type: "call", position: 1, strike: 120, dte: 30 }, // Long highest strike call
      ]);
      expect(actual.name).toEqual(strategies.longCallCondor.name);
    });

    it("Long Put Condor", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 80, dte: 30 }, // Long lowest strike put
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short lower middle strike put
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short higher middle strike put
        { type: "put", position: 1, strike: 120, dte: 30 }, // Long highest strike put
      ]);
      expect(actual.name).toEqual(strategies.longPutCondor.name);
    });

    it("Short Call Condor", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 80, dte: 30 }, // Short lowest strike call
        { type: "call", position: 1, strike: 90, dte: 30 }, // Long lower middle strike call
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long higher middle strike call
        { type: "call", position: -1, strike: 120, dte: 30 }, // Short highest strike call
      ]);
      expect(actual.name).toEqual(strategies.shortCallCondor.name);
    });

    it("Short Put Condor", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 80, dte: 30 }, // Short lowest strike put
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long lower middle strike put
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long higher middle strike put
        { type: "put", position: -1, strike: 120, dte: 30 }, // Short highest strike put
      ]);
      expect(actual.name).toEqual(strategies.shortPutCondor.name);
    });
  });

  // Group 6: Iron Strategies
  describe("Iron Strategies", () => {
    it("Iron Condor", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 80, dte: 30 }, // Long lower strike put
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short middle-low put
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short middle-high call
        { type: "call", position: 1, strike: 120, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.ironCondor.name);
    });

    it("Iron Butterfly", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long lower strike put
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at middle strike
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at middle strike
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.ironButterfly.name);
    });

    it("Inverse Iron Butterfly", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short lower strike put
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call at middle strike
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put at middle strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher strike call
      ]);
      expect(actual.name).toEqual(strategies.inverseIronButterfly.name);
    });

    it("Inverse Iron Condor", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 80, dte: 30 }, // Short lower strike put
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long middle-low put
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long middle-high call
        { type: "call", position: -1, strike: 120, dte: 30 }, // Short higher strike call
      ]);
      expect(actual.name).toEqual(strategies.inverseIronCondor.name);
    });
  });

  // Group 7: Multi-legged and Specialized Strategies
  describe("Multi-legged and Specialized Strategies", () => {
    it("Collar", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 100 }, // Long 100 shares of stock
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long protective put
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short covered call
      ]);
      expect(actual.name).toEqual(strategies.collar.name);
    });

    it("Covered Short Strangle", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 100 }, // Long 100 shares of stock
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short put at lower strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.coveredShortStrangle.name);
    });

    it("Covered Short Straddle", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 100 }, // Long 100 shares of stock
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at same strike
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at same strike
      ]);
      expect(actual.name).toEqual(strategies.coveredShortStraddle.name);
    });

    it("Protective Put", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 100 }, // Long 100 shares of stock
        { type: "put", position: 1, strike: 95, dte: 30 }, // Long protective put
      ]);
      expect(actual.name).toEqual(strategies.protectivePut.name);
    });

    it("Synthetic Put", () => {
      const actual = detectType([
        { type: "stock", position: -100, basis: 100 }, // Short 100 shares of stock
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call option
      ]);
      expect(actual.name).toEqual(strategies.syntheticPut.name);
    });

    it("Call Broken Wing", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 90, dte: 30 }, // Long lowest strike call
        { type: "call", position: -2, strike: 100, dte: 30 }, // Short 2 middle strike calls
        { type: "call", position: 1, strike: 120, dte: 30 }, // Long highest strike call (wider spread on upper side)
      ]);
      expect(actual.name).toEqual(strategies.brokenWingCalls.name);
    });

    it("Inverse Call Broken Wing", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 90, dte: 30 }, // Short lowest strike call
        { type: "call", position: 2, strike: 100, dte: 30 }, // Long 2 middle strike calls
        { type: "call", position: -1, strike: 120, dte: 30 }, // Short highest strike call (wider spread on upper side)
      ]);
      expect(actual.name).toEqual(strategies.inverseBrokenWingCalls.name);
    });

    it("Bear Call Ladder", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 90, dte: 30 }, // Short lowest strike call
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long middle strike call
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long highest strike call
      ]);
      expect(actual.name).toEqual(strategies.bearCallLadder.name);
    });

    it("Bull Call Ladder", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 90, dte: 30 }, // Long lowest strike call
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short middle strike call
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short highest strike call
      ]);
      expect(actual.name).toEqual(strategies.bullCallLadder.name);
    });

    it("Bear Put Ladder", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short lowest strike put
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short middle strike put
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long highest strike put
      ]);
      expect(actual.name).toEqual(strategies.bearPutLadder.name);
    });

    it("Bull Put Ladder", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long lowest strike put
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long middle strike put
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short highest strike put
      ]);
      expect(actual.name).toEqual(strategies.bullPutLadder.name);
    });

    it("Put Broken Wing", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 80, dte: 30 }, // Long lowest strike put (wider spread on lower side)
        { type: "put", position: -2, strike: 100, dte: 30 }, // Short 2 middle strike puts
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long highest strike put
      ]);
      expect(actual.name).toEqual(strategies.brokenWingPuts.name);
    });

    it("Inverse Put Broken Wing", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 80, dte: 30 }, // Short lowest strike put (wider spread on lower side)
        { type: "put", position: 2, strike: 100, dte: 30 }, // Long 2 middle strike puts
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short highest strike put
      ]);
      expect(actual.name).toEqual(strategies.inverseBrokenWingPuts.name);
    });

    it("Call Ratio Spread", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long 1 lower strike call
        { type: "call", position: -2, strike: 110, dte: 30 }, // Short 2 higher strike calls
      ]);
      expect(actual.name).toEqual(strategies.ratioCallSpread.name);
    });

    it("Put Ratio Spread", () => {
      // In the detectType function, the Put Ratio Spread is detected when:
      // 1. All options are puts
      // 2. optionPositions[0].size === 2 * optionPositions[1].size
      // 3. optionPositions[1].isLong && optionPositions[0].isShort
      // After sorting, index 0 will be the lower strike
      const actual = detectType([
        // This will be at index 0 after sorting (lower strike)
        { type: "put", position: -2, strike: 90, dte: 30 }, // Short 2 put contracts at lower strike
        // This will be at index 1 after sorting (higher strike)
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long 1 put contract at higher strike
      ]);
      expect(actual.name).toEqual(strategies.ratioPutSpread.name);
    });

    it("Call Ratio Backspread", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short 1 lower strike call
        { type: "call", position: 2, strike: 110, dte: 30 }, // Long 2 higher strike calls
      ]);
      expect(actual.name).toEqual(strategies.callRatioBackspread.name);
    });

    it("Put Ratio Backspread", () => {
      const actual = detectType([
        { type: "put", position: 2, strike: 90, dte: 30 }, // Long 2 lower strike puts
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short 1 higher strike put
      ]);
      expect(actual.name).toEqual(strategies.putRatioBackspread.name);
    });

    it("Long Synthetic Future", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call at strike
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at same strike
      ]);
      expect(actual.name).toEqual(strategies.longSyntheticFuture.name);
    });

    it("Short Synthetic Future", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put at strike
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at same strike
      ]);
      expect(actual.name).toEqual(strategies.shortSyntheticFuture.name);
    });

    it("Short Combo", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long put at lower strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.shortCombo.name);
    });

    it("Long Combo", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short put at lower strike
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.longCombo.name);
    });

    it("Jade Lizard", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short put at lower strike
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at middle strike
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.jadeLizard.name);
    });

    it("Reverse Jade Lizard", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long put at lower strike
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at middle strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short call at higher strike
      ]);
      expect(actual.name).toEqual(strategies.reverseJadeLizard.name);
    });

    it("Strap", () => {
      const actual = detectType([
        { type: "call", position: 2, strike: 100, dte: 30 }, // Long 2 calls at the strike
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long 1 put at the same strike
      ]);
      expect(actual.name).toEqual(strategies.strap.name);
    });

    it("Strip", () => {
      const actual = detectType([
        { type: "put", position: 2, strike: 100, dte: 30 }, // Long 2 puts at the strike
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long 1 call at the same strike
      ]);
      expect(actual.name).toEqual(strategies.strip.name);
    });
  });

  // Group 8: Multiple Similar Options Strategies
  describe("Multiple Similar Options Strategies", () => {
    it("Long Calls", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call at strike 100
        { type: "call", position: 1, strike: 110, dte: 30 }, // Long call at strike 110
        { type: "call", position: 1, strike: 120, dte: 30 }, // Long call at strike 120
      ]);
      expect(actual.name).toEqual(strategies.longCalls.name);
    });

    it("Long Puts", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 90, dte: 30 }, // Long put at strike 90
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put at strike 100
        { type: "put", position: 1, strike: 110, dte: 30 }, // Long put at strike 110
      ]);
      expect(actual.name).toEqual(strategies.longPuts.name);
    });

    it("Short Calls", () => {
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short call at strike 100
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short call at strike 110
        { type: "call", position: -1, strike: 120, dte: 30 }, // Short call at strike 120
      ]);
      expect(actual.name).toEqual(strategies.shortCalls.name);
    });

    it("Short Puts", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short put at strike 90
        { type: "put", position: -1, strike: 100, dte: 30 }, // Short put at strike 100
        { type: "put", position: -1, strike: 110, dte: 30 }, // Short put at strike 110
      ]);
      expect(actual.name).toEqual(strategies.shortPuts.name);
    });
  });

  // Group 9: Multi-expiry Advanced Strategies
  describe("Multi-expiry Advanced Strategies", () => {
    it("Double Diagonal", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 80, dte: 60 }, // Long far-term put at lowest strike
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short near-term put at lower middle strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short near-term call at higher middle strike
        { type: "call", position: 1, strike: 120, dte: 60 }, // Long far-term call at highest strike
      ]);
      expect(actual.name).toEqual(strategies.doubleDiagonal.name);
    });

    it("Double Calendar", () => {
      const actual = detectType([
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short near-term put
        { type: "put", position: 1, strike: 90, dte: 60 }, // Long far-term put at same strike
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short near-term call
        { type: "call", position: 1, strike: 110, dte: 60 }, // Long far-term call at same strike
      ]);
      expect(actual.name).toEqual(strategies.doubleCalendar.name);
    });
  });

  // Group 10: Edge Cases
  describe("Edge Cases", () => {
    it("Empty Collection", () => {
      const actual = detectType([]);
      expect(actual.name).toEqual(strategies.empty.name);
    });

    it("Custom Strategy (No Known Pattern)", () => {
      const actual = detectType([
        // Completely random positions that don't match any known strategy
        { type: "call", position: 1, strike: 100, dte: 30 },
        { type: "put", position: -2, strike: 105, dte: 30 },
        { type: "call", position: -1, strike: 95, dte: 60 },
        { type: "stock", position: 50, basis: 102 },
      ]);
      expect(actual.name).toEqual(strategies.custom.name);
    });
  });

  describe("sorting", () => {
    it("Long Straddle test with position in wrong order to check sorting by option type", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 100, dte: 30 }, // Long put at the same strike
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long call at the strike
      ]);
      expect(actual.name).toEqual(strategies.straddle.name);
    });
  });

  describe("spc", () => {
    it("Covered Call", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 100 }, // Long 100 shares of stock
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short covered call
      ]);
      expect(actual.name).toEqual(strategies.coveredCall.name);
    });
  });

  describe("intial sample tests", () => {
    it("Bull Call Spread", () => {
      const actual = detectType([
        { type: "call", position: 1, strike: 100, dte: 30 }, // Long lower strike call (will be first after sorting)
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short higher strike call (will be second after sorting)
      ]);
      expect(actual.name).toEqual(strategies.bullCallSpread.name);
    });

    it("Iron Condor", () => {
      const actual = detectType([
        { type: "put", position: 1, strike: 80, dte: 30 }, // Long lower strike put
        { type: "put", position: -1, strike: 90, dte: 30 }, // Short middle-low put
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short middle-high call
        { type: "call", position: 1, strike: 120, dte: 30 }, // Long higher strike call
      ]);
      expect(actual.name).toEqual(strategies.ironCondor.name);
    });

    it("Covered Call", () => {
      const actual = detectType([
        { type: "stock", position: 100, basis: 105 }, // Long 100 shares of stock
        { type: "call", position: -1, strike: 110, dte: 30 }, // Short 1 call option
      ]);
      expect(actual.name).toEqual(strategies.coveredCall.name);
    });

    it("Calendar Call Spread", () => {
      // Different expirations
      const actual = detectType([
        { type: "call", position: -1, strike: 100, dte: 30 }, // Short near-term call
        { type: "call", position: 1, strike: 100, dte: 60 }, // Long far-term call at same strike
      ]);
      expect(actual.name).toEqual(strategies.calendarCallSpread.name);
    });

    it("Cash-Secured Put", () => {
      const actual = detectType(
        [
          { type: "put", position: -1, strike: 95, dte: 30 }, // Short put option
        ],
        true, // isCashSecured = true
      );
      expect(actual.name).toEqual(strategies.cashSecuredPut.name);
    });
  });
});
