import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups } from "../setups";
import { holdingAsPctDteStats, singleMultiExpiryStats } from "./options";
import { creditCapturedStats, summarize } from "./summary";

// files/amd.htm option setups (P/L): AMD long put -696.44, DY -626.2, NUE -277.6, XOM +78.2, PM +112, QQQ +46.82
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("summarize", () => {
  it("files/amd.htm", () => {
    const summary = summarize(amd);

    expect(summary).toMatchObject({ count: 6, winners: 3, losers: 3, flats: 0, winRate: 0.5, largestWin: 112, largestLoss: -696.44, maxWinStreak: 3, maxLossStreak: 2, currentStreak: { kind: "loss", length: 2 } });
    expect(summary.netPnl).toBeCloseTo(-1363.22, 6);
    expect(summary.grossWin).toBeCloseTo(237.02, 6);
    expect(summary.grossLoss).toBeCloseTo(1600.24, 6);
    expect(summary.profitFactor).toBeCloseTo(237.02 / 1600.24, 6);
    expect(summary.payoffRatio).toBeCloseTo(237.02 / 3 / (1600.24 / 3), 6);
    expect(summary.expectancy).toBeCloseTo(0.5 * (237.02 / 3) - 0.5 * (1600.24 / 3), 6);
    expect(summary.avgHoldingDays).toBeCloseTo(112 / 6, 6);
    // closes in time order: AMD -696.44, XOM, PM, QQQ, DY, NUE — the curve never gets above 0
    expect(summary.maxDrawdown).toBeCloseTo(1363.22, 6);
  });

  it("no setups", () => {
    expect(summarize([])).toMatchObject({ count: 0, netPnl: 0, winRate: null, profitFactor: null, expectancy: null, avgHoldingDays: null, maxDrawdown: 0, currentStreak: { kind: "none", length: 0 } });
  });

  it("only winners — infinite profit factor", () => {
    expect(summarize(amd.filter((s) => s.isWinner)).profitFactor).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("creditCapturedStats", () => {
  it("files/amd.htm — five credit spreads lost more than collected", () => {
    const stats = creditCapturedStats(amd);

    expect(stats.sampleSize).toBe(5);
    expect(stats.totalCreditReceived).toBeCloseTo(828.8, 6);
    expect(stats.totalRealizedPnl).toBeCloseTo(-666.78, 6);
    expect(stats.weightedCaptured).toBeCloseTo(-666.78 / 828.8, 6);
  });
});

describe("options stats", () => {
  it("holding as % of DTE skips setups opened on expiration day", () => {
    const stats = holdingAsPctDteStats(amd);

    expect(stats.sampleSize).toBe(5);
    expect(stats.meanHoldingDays).toBeCloseTo(22.4, 6);
    expect(stats.meanDteAtOpen).toBeCloseTo(30.8, 6);
    expect(stats.medianRatio).toBeCloseTo(30 / 35, 6);
  });

  it("single vs multi expiry, files/qqq.htm has a merged SPY setup with two expirations", () => {
    const stats = singleMultiExpiryStats(buildSetups(extract(loadFixture("files/qqq.htm"))));

    expect(stats).toMatchObject({ singleCount: 2, multiCount: 1, multiWinRate: 1 });
    expect(stats.multiPnl).toBeCloseTo(9.4, 6);
  });
});
