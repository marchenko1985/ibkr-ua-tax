import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups, type Setup } from "../setups";
import { concentrationStats, dispositionStats, revengeTradeStats } from "./behavioral";

// files/amd.htm option setups, |open value|, P/L, holding days:
// AMD 714.99 -696.44 35d, DY 375.9 -626.2 31d, NUE 96.9 -277.6 24d, XOM 143.6 +78.2 15d, PM 159.5 +112 7d, QQQ 52.9 +46.82 0d
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("dispositionStats", () => {
  it("losers held longer than winners", () => {
    const stats = dispositionStats(amd);

    expect(stats).toMatchObject({ winnerCount: 3, loserCount: 3, winnerMedianHoldingDays: 7, loserMeanHoldingDays: 30, loserMedianHoldingDays: 31 });
    expect(stats.winnerMeanHoldingDays).toBeCloseTo(22 / 3, 6);
    expect(stats.ratio).toBeCloseTo(22 / 3 / 30, 6);
  });

  it("no ratio without losers", () => {
    expect(dispositionStats(amd.filter((s) => s.isWinner)).ratio).toBeNull();
  });
});

describe("concentrationStats", () => {
  it("exposure shares and HHI", () => {
    const stats = concentrationStats(amd);
    const exposures = [714.99, 375.9, 96.9, 143.6, 159.5, 52.9];
    const total = exposures.reduce((acc, e) => acc + e, 0);

    expect(stats.distinctSymbols).toBe(6);
    expect(stats.totalExposure).toBeCloseTo(total, 6);
    expect(stats.hhi).toBeCloseTo(
      exposures.reduce((acc, e) => acc + (e / total) ** 2, 0),
      6,
    );
    expect(stats.topThree.map((e) => e.symbol)).toEqual(["AMD", "DY", "PM"]);
    expect(stats.topOneShare).toBeCloseTo(714.99 / total, 6);
    expect(stats.topThreeShare).toBeCloseTo((714.99 + 375.9 + 159.5) / total, 6);
    expect(stats.verdict).toBe("concentrated"); // HHI ≈ 0.30
  });

  it("diversified when spread evenly", () => {
    // 7 symbols with equal exposure: HHI 1/7 ≈ 0.143
    const even = Array.from({ length: 7 }, (_, index) => setup({ underlyingSymbol: `S${index}`, openNetValue: -100 }));

    expect(concentrationStats(even).verdict).toBe("diversified");
  });

  it("none without exposure", () => {
    expect(concentrationStats([]).verdict).toBe("none");
  });
});

describe("revengeTradeStats", () => {
  it("setups opened the day after a loss", () => {
    const setups = [
      setup({ openDate: "2026-01-01", closedAt: "2026-01-05T10:00:00", realizedPnl: -100 }),
      // opened the next day after the loss: -50, +10
      setup({ openDate: "2026-01-06", closedAt: "2026-01-06T15:00:00", realizedPnl: -50 }),
      setup({ openDate: "2026-01-06", closedAt: "2026-01-09T10:00:00", realizedPnl: 10 }),
      // the day after the -50 close: after loss again
      setup({ openDate: "2026-01-07", closedAt: "2026-01-07T12:00:00", realizedPnl: 30 }),
      // the day after the +30 close: after win
      setup({ openDate: "2026-01-08", closedAt: "2026-01-12T10:00:00", realizedPnl: 20 }),
      // 3 days after the +10 close: outside the window
      setup({ openDate: "2026-01-12", closedAt: "2026-01-13T10:00:00", realizedPnl: 40 }),
    ];
    const stats = revengeTradeStats(setups, 1);

    expect(stats).toMatchObject({ afterLossCount: 3, afterWinCount: 1, afterWinAvgPnl: 20, afterWinWinRate: 1, verdict: "insufficient" });
    expect(stats.afterLossAvgPnl).toBeCloseTo(-10 / 3, 6);
    expect(stats.afterLossWinRate).toBeCloseTo(2 / 3, 6);
    expect(stats.baselineAvgPnl).toBeCloseTo(-50 / 6, 6);
  });

  it("closes on the open day are not counted", () => {
    const setups = [setup({ openDate: "2026-01-01", closedAt: "2026-01-02T10:00:00", realizedPnl: -100 }), setup({ openDate: "2026-01-02", closedAt: "2026-01-03T10:00:00", realizedPnl: 10 })];

    expect(revengeTradeStats(setups, 1)).toMatchObject({ afterLossCount: 0, afterWinCount: 0 });
  });

  it("verdicts", () => {
    // loss on day 1 and an unrelated setup moving the baseline, then setups opened on day 2 with the given P/L
    const verdictOf = (pnls: number[], unrelated: number) =>
      revengeTradeStats([setup({ openDate: "2026-01-01", closedAt: "2026-01-01T10:00:00", realizedPnl: -10 }), setup({ openDate: "2026-01-01", closedAt: "2026-01-10T10:00:00", realizedPnl: unrelated }), ...pnls.map((pnl) => setup({ openDate: "2026-01-02", closedAt: "2026-01-03T10:00:00", realizedPnl: pnl }))], 1)
        .verdict;
    const five = [10, 10, 10, 10, 10];

    expect(verdictOf(five, 10)).toBe("disciplined"); // after loss 10, baseline 50/7 ≈ 7.1
    expect(verdictOf(five, 600)).toBe("revenge"); // baseline 640/7 ≈ 91.4, 10 is far below
    expect(verdictOf(five, 40)).toBe("neutral"); // baseline 80/7 ≈ 11.4, revenge only under 8.6
    expect(verdictOf([10, 10, 10, 10], 600)).toBe("insufficient");
  });
});

/** synthetic setup: a real one with dates and values replaced */
function setup(fields: Partial<Setup>): Setup {
  const [base] = amd;
  if (!base) {
    throw new Error("fixture changed");
  }
  const merged = { ...base, ...fields };
  return { ...merged, closeDate: merged.closedAt.slice(0, "YYYY-MM-DD".length), isWinner: merged.realizedPnl > 0, isLoser: merged.realizedPnl < 0 };
}
