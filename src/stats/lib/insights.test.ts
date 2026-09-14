import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { generateInsights, traderProfile } from "./insights";
import { groupBy, perStrategyStats } from "./metrics/grouping";
import { recentVsBaseline } from "./metrics/summary";
import { buildSetups, DTE_BUCKETS } from "./setups";

// files/amd.htm option setups:
// AMD long put -696.44 (DTE 35, held 35d), DY -626.2 (35, 31d), NUE -277.6 (28, 24d),
// XOM +78.2 (35, 15d), PM +112 (21, 7d), QQQ +46.82 (0, same day); all but AMD are bull put spreads
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("groupBy", () => {
  it("ordinal buckets keep given order, unknown keys follow sorted", () => {
    const rows = groupBy(
      amd,
      (s) => s.dteAtOpenBucket,
      DTE_BUCKETS.map((b) => b.label),
    );

    expect(rows.map((r) => [r.key, r.count])).toEqual([
      ["0", 1],
      ["8-21", 1],
      ["22-45", 4],
    ]);
    expect(rows[2]?.sumPnl).toBeCloseTo(-1522.04, 6);
    expect(rows[2]).toMatchObject({ winners: 1, losers: 3, winRate: 0.25 });
  });

  it("null key skips a setup", () => {
    expect(groupBy(amd, (s) => (s.isWinner ? "win" : null)).map((r) => r.count)).toEqual([3]);
  });
});

describe("perStrategyStats", () => {
  it("most used first", () => {
    expect(perStrategyStats(amd).map((s) => [s.name, s.slug, s.count])).toEqual([
      ["Bull Put Spread", "bull-put-spread", 5],
      ["Long Put", "long-put", 1],
    ]);
  });
});

describe("traderProfile", () => {
  it("files/amd.htm", () => {
    const profile = traderProfile(amd);

    expect(profile).toMatchObject({ tradeCount: 6, period: { from: "2026-02-06", to: "2026-03-13", months: 1 }, topWinners: [] });
    expect(profile.topByVolume.map((s) => [s.name, s.count, s.pct])).toEqual([
      ["Bull Put Spread", 5, 5 / 6],
      ["Long Put", 1, 1 / 6],
    ]);
    // Long Put has a sample of 1, below 3
    expect(profile.topLosers.map((s) => s.name)).toEqual(["Bull Put Spread"]);
  });

  it("no setups", () => {
    expect(traderProfile([])).toEqual({ tradeCount: 0, period: null, topByVolume: [], topWinners: [], topLosers: [] });
  });
});

describe("generateInsights", () => {
  it("files/amd.htm — losing strategy, DTE and holding buckets with sample of 3+", () => {
    const insights = generateInsights(amd);

    expect(insights.map((i) => [i.id, i.kind])).toEqual([
      ["dte-worst-22-45", "avoid"], // 1522.04 × log10(5) ≈ 1064
      ["holding-worst-22-45d", "avoid"], // 1600.24 × log10(4) × 0.9 ≈ 867
      ["strategy-loser-bull-put-spread", "avoid"], // 666.78 × log10(6) × 1.2 ≈ 623
    ]);
    expect(insights[2]?.title).toBe("Bull Put Spread втрачає гроші");
  });

  it("no setups", () => {
    expect(generateInsights([])).toEqual([]);
  });
});

describe("recentVsBaseline", () => {
  it("needs at least 20 setups", () => {
    expect(recentVsBaseline(amd)).toEqual({ recentCount: 6, baselineCount: 0, rows: [] });
  });

  it("last setups against the ones before them", () => {
    const diff = recentVsBaseline(amd, 2, 3);

    // by close time: AMD, XOM, PM, QQQ, DY, NUE → baseline XOM, PM, QQQ; recent DY, NUE
    expect(diff).toMatchObject({ recentCount: 2, baselineCount: 3 });
    const [net] = diff.rows;
    expect(net?.label).toBe("Чистий P/L");
    expect(net?.baseline).toBeCloseTo(237.02, 6);
    expect(net?.recent).toBeCloseTo(-903.8, 6);
    expect(net?.delta).toBeCloseTo(-903.8 - 237.02, 6);
    // baseline has no losses — infinite profit factor is shown as no value
    expect(diff.rows[3]).toMatchObject({ label: "Profit factor", baseline: null, delta: null });
  });
});
