import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups, DTE_BUCKETS } from "../setups";
import { classifySampleSize } from "./sample-size";
import { breakEvenPayoff, strategyCrosstab, strategyFrontierPoints } from "./strategy";

// files/amd.htm option setups:
// AMD long put -696.44 (DTE 35), bull put spreads: DY -626.2 (35), NUE -277.6 (28), XOM +78.2 (35), PM +112 (21), QQQ +46.82 (0)
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("strategyCrosstab", () => {
  const crosstab = strategyCrosstab(
    amd,
    (s) => s.dteAtOpenBucket,
    DTE_BUCKETS.map((b) => b.label),
    10,
  );

  it("rows by usage, every column present", () => {
    expect(crosstab.strategies).toEqual(["Bull Put Spread", "Long Put"]);
    expect(crosstab.columns).toEqual(["0", "1-7", "8-21", "22-45", "46-90", "90+"]);
    expect(crosstab.cells.map((row) => row.map((cell) => cell.count))).toEqual([
      [1, 0, 1, 3, 0, 0],
      [0, 0, 0, 1, 0, 0],
    ]);
    expect(crosstab.totalCount).toBe(6);
  });

  it("cell values", () => {
    const cell = crosstab.cells[0]?.[3];

    expect(cell?.sumPnl).toBeCloseTo(-825.6, 6); // DY, NUE, XOM
    expect(cell?.winRate).toBeCloseTo(1 / 3, 6);
    expect(crosstab.cells[0]?.[1]).toEqual({ count: 0, sumPnl: 0, winRate: null });
    expect(crosstab.maxAbsPnl).toBeCloseTo(825.6, 6);
  });

  it("limit keeps the most used strategies", () => {
    expect(strategyCrosstab(amd, (s) => s.dteAtOpenBucket, ["0"], 1).strategies).toEqual(["Bull Put Spread"]);
  });
});

describe("strategyFrontierPoints", () => {
  it("payoff ratio is average win over average loss", () => {
    const [point, ...rest] = strategyFrontierPoints(amd, 3);

    // long put: single setup, skipped
    expect(rest).toEqual([]);
    expect(point).toMatchObject({ name: "Bull Put Spread", count: 5, winRate: 0.6, aboveBreakeven: false });
    expect(point?.payoffRatio).toBeCloseTo(237.02 / 3 / (903.8 / 2), 6);
  });

  it("strategies without losers are skipped", () => {
    expect(
      strategyFrontierPoints(
        amd.filter((s) => s.isWinner),
        1,
      ),
    ).toEqual([]);
  });

  it("break-even payoff", () => {
    expect(breakEvenPayoff(0.5)).toBe(1);
    expect(breakEvenPayoff(0.8)).toBeCloseTo(0.25, 6);
  });
});

describe("classifySampleSize", () => {
  it("thresholds scale with the total", () => {
    // total 6: solid from 5, small from 3
    expect([5, 3, 2].map((count) => classifySampleSize(count, 6))).toEqual(["solid", "small", "noisy"]);
    // total 1000: solid from 30, small from 30 too
    expect([30, 29].map((count) => classifySampleSize(count, 1000))).toEqual(["solid", "noisy"]);
    // total 200: solid from 20, small from 6
    expect([20, 6, 5].map((count) => classifySampleSize(count, 200))).toEqual(["solid", "small", "noisy"]);
    expect(classifySampleSize(0, 0)).toBe("noisy");
  });
});
