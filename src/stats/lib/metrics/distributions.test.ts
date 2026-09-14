import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups } from "../setups";
import { pnlCdf, pnlHistogram, rocDistribution } from "./distributions";

// files/amd.htm option setups P/L and return on open value:
// AMD -696.44 (-0.974), DY -626.2 (-1.666), NUE -277.6 (-2.865), QQQ +46.82 (0.885), XOM +78.2 (0.545), PM +112 (0.702)
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("pnlCdf", () => {
  it("sorted P/L with running share", () => {
    const cdf = pnlCdf(amd);

    // P/L is a sum of lots, compare in cents
    expect(cdf.map((p) => Math.round(p.pnl * 100) / 100)).toEqual([-696.44, -626.2, -277.6, 46.82, 78.2, 112]);
    expect(cdf.map((p) => p.fraction)).toEqual([1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1]);
  });

  it("empty", () => {
    expect(pnlCdf([])).toEqual([]);
  });
});

describe("pnlHistogram", () => {
  it("nice width and every value counted", () => {
    // range 808.44 / 18 = 44.9 → width 50, buckets -700..150
    const buckets = pnlHistogram(amd, 18);

    expect(buckets).toHaveLength(17);
    expect(buckets[0]).toEqual({ from: -700, to: -650, count: 1 });
    expect(buckets.at(-1)).toEqual({ from: 100, to: 150, count: 1 });
    expect(buckets.filter((b) => b.count > 0).map((b) => b.from)).toEqual([-700, -650, -300, 0, 50, 100]);
    expect(buckets.reduce((acc, b) => acc + b.count, 0)).toBe(6);
  });

  it("value on a bucket edge goes to the upper bucket", () => {
    const [xom, pm] = amd.filter((s) => s.isWinner && s.realizedPnl > 50);
    if (!(xom && pm)) {
      throw new Error("fixture changed");
    }
    // 78.2 and 112: range 33.8 / 1 → width 50, 50..100 and 100..150
    expect(pnlHistogram([xom, pm], 1)).toEqual([
      { from: 50, to: 100, count: 1 },
      { from: 100, to: 150, count: 1 },
    ]);
  });

  it("single value", () => {
    expect(pnlHistogram(amd.slice(0, 1), 18)).toEqual([{ from: -696.44, to: -696.44, count: 1 }]);
  });
});

describe("rocDistribution", () => {
  it("clipped at -200%", () => {
    const buckets = rocDistribution(amd, 0.1);

    // -2 (NUE clipped) .. 0.8
    expect(buckets).toHaveLength(29);
    expect(buckets[0]?.from).toBeCloseTo(-2, 6);
    expect(buckets[0]?.count).toBe(1);
    expect(buckets.at(-1)?.from).toBeCloseTo(0.8, 6);
    expect(buckets.filter((b) => b.count > 0).map((b) => Math.round(b.from * 10))).toEqual([-20, -17, -10, 5, 7, 8]);
  });

  it("empty", () => {
    expect(rocDistribution([], 0.1)).toEqual([]);
  });
});
