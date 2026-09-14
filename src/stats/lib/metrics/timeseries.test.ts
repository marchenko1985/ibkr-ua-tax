import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups } from "../setups";
import { cumulativePnlSeries, dailyPnlSeries, drawdownEpisodes, rollingMetrics } from "./timeseries";

// files/amd.htm setups by close: 2026-03-13 AMD -696.44, XOM +78.2, PM +112, QQQ +46.82; 2026-03-16 DY -626.2, NUE -277.6
const amd = buildSetups(extract(loadFixture("files/amd.htm")));
// files/qqq.htm: 2026-03-02 AVAV +84.4, QQQ -11.7, merged SPY +9.4
const qqq = buildSetups(extract(loadFixture("files/qqq.htm")));

describe("dailyPnlSeries", () => {
  it("sums setups closed the same day", () => {
    const days = dailyPnlSeries(amd);

    expect(days.map((d) => [d.date, d.count])).toEqual([
      ["2026-03-13", 4],
      ["2026-03-16", 2],
    ]);
    expect(days[0]?.pnl).toBeCloseTo(-459.42, 6);
    expect(days[1]?.pnl).toBeCloseTo(-903.8, 6);
  });
});

describe("cumulativePnlSeries", () => {
  it("running total, peak never below zero", () => {
    const [first, second] = cumulativePnlSeries(amd);

    expect(first).toMatchObject({ date: "2026-03-13", peak: 0 });
    expect(first?.cumulative).toBeCloseTo(-459.42, 6);
    expect(first?.drawdown).toBeCloseTo(459.42, 6);
    expect(second?.cumulative).toBeCloseTo(-1363.22, 6);
    expect(second?.drawdown).toBeCloseTo(1363.22, 6);
  });
});

describe("drawdownEpisodes", () => {
  it("open episode when the curve never recovers", () => {
    const [episode, ...rest] = drawdownEpisodes(amd);

    expect(rest).toEqual([]);
    expect(episode).toMatchObject({ index: 1, peakDate: "2026-03-13", peakPnl: 0, troughDate: "2026-03-16", durationDays: 3, recoveryDate: null, recoveryDays: null, open: true });
    expect(episode?.depth).toBeCloseTo(1363.22, 6);
  });

  it("no episodes on a rising curve", () => {
    expect(drawdownEpisodes(qqq)).toEqual([]);
  });
});

describe("rollingMetrics", () => {
  it("one point per setup from the first full window", () => {
    const rolling = rollingMetrics(amd, 4);

    // by close: AMD, XOM, PM, QQQ, DY, NUE
    expect(rolling.points.map((p) => [p.index, p.date, p.winRate])).toEqual([
      [4, "2026-03-13", 0.75],
      [5, "2026-03-16", 0.75], // XOM, PM, QQQ, DY
      [6, "2026-03-16", 0.5], // PM, QQQ, DY, NUE
    ]);
    expect(rolling.baseline.winRate).toBe(0.5);
  });

  it("window larger than setups gives no points", () => {
    expect(rollingMetrics(amd, 20).points).toEqual([]);
  });
});
