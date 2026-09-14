import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups } from "../setups";
import { perSymbolStats, waterfallBySymbol } from "./grouping";
import { expiryWeekExposure } from "./options";

// files/amd.htm option setups, P/L, holding days, earliest expiry:
// AMD -696.44 35d 2026-03-13, DY -626.2 31d 03-20, NUE -277.6 24d 03-20, XOM +78.2 15d 04-02, PM +112 7d 03-27, QQQ +46.82 0d 03-13
const amd = buildSetups(extract(loadFixture("files/amd.htm")));

describe("perSymbolStats", () => {
  it("largest absolute P/L first", () => {
    const stats = perSymbolStats(amd);

    expect(stats.map((s) => s.key)).toEqual(["AMD", "DY", "NUE", "PM", "XOM", "QQQ"]);
    expect(stats[0]).toMatchObject({ count: 1, avgHoldingDays: 35, winRate: 0 });
  });
});

describe("waterfallBySymbol", () => {
  it("winners first, each bar at the running total", () => {
    const points = waterfallBySymbol(amd, 6).map((p) => ({ ...p, base: round(p.base), delta: round(p.delta), pnl: round(p.pnl), cumulative: round(p.cumulative) }));

    expect(points).toEqual([
      { symbol: "PM", base: 0, delta: 112, pnl: 112, cumulative: 112 },
      { symbol: "XOM", base: 112, delta: 78.2, pnl: 78.2, cumulative: 190.2 },
      { symbol: "QQQ", base: 190.2, delta: 46.82, pnl: 46.82, cumulative: 237.02 },
      { symbol: "NUE", base: -40.58, delta: 277.6, pnl: -277.6, cumulative: -40.58 },
      { symbol: "DY", base: -666.78, delta: 626.2, pnl: -626.2, cumulative: -666.78 },
      { symbol: "AMD", base: -1363.22, delta: 696.44, pnl: -696.44, cumulative: -1363.22 },
    ]);
  });

  it("limit takes the largest absolute P/L", () => {
    expect(waterfallBySymbol(amd, 2).map((p) => p.symbol)).toEqual(["DY", "AMD"]);
  });
});

describe("expiryWeekExposure", () => {
  it("setups by Monday of the earliest expiry week", () => {
    const weeks = expiryWeekExposure(amd);

    expect(weeks.map((w) => [w.weekStart, w.weekEnd, w.count])).toEqual([
      ["2026-03-09", "2026-03-13", 2], // AMD, QQQ
      ["2026-03-16", "2026-03-20", 2], // DY, NUE
      ["2026-03-23", "2026-03-27", 1], // PM
      ["2026-03-30", "2026-04-03", 1], // XOM, Thursday expiry
    ]);
    expect(weeks[0]?.sumPnl).toBeCloseTo(-649.62, 6);
  });
});

/** values are sums of lots, compare in cents */
function round(value: number) {
  return Math.round(value * 100) / 100;
}
