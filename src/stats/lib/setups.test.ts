import { describe, expect, it } from "vitest";
import { extract } from "@/lib/extract";
import { loadFixture } from "@/lib/fixture";
import { buildSetups, type Setup } from "./setups";

function setups(path: string) {
  return buildSetups(extract(loadFixture(path)));
}

function find(list: Setup[], setupId: string): Setup {
  const setup = list.find((s) => s.setupId === setupId);
  if (!setup) {
    throw new Error(`setup ${setupId} not found`);
  }
  return setup;
}

describe("buildSetups files/amd.htm", () => {
  const list = setups("files/amd.htm");

  it("options only, assigned option and stock lots skipped", () => {
    expect(list.map((s) => s.setupId)).toEqual(["AMD:2026-02-06", "DY:2026-02-13", "NUE:2026-02-20", "XOM:2026-02-26", "PM:2026-03-06", "QQQ:2026-03-13"]);
    expect(list.flatMap((s) => s.items).every((t) => t.is_option && !t.is_assignment)).toBe(true);
  });

  it("put spread legs opened the same day form one credit setup", () => {
    expect(find(list, "DY:2026-02-13")).toMatchObject({
      underlyingSymbol: "DY",
      strategyName: "Bull Put Spread",
      strategySlug: "bull-put-spread",
      strategySentiment: ["bullish"],
      legCount: 2,
      legCountBucket: "2",
      isCredit: true,
      isDebit: false,
      openDate: "2026-02-13",
      closeDate: "2026-03-16",
      closedAt: "2026-03-16T12:27:50",
      openWeekday: "Fri",
      closeWeekday: "Mon",
      holdingDays: 31,
      holdingDaysBucket: "22-45d",
      minExpiry: "2026-03-20",
      singleExpiry: true,
      putCall: "puts",
      dteAtOpenMin: 35,
      dteAtOpenBucket: "22-45",
    });
    expect(find(list, "DY:2026-02-13").openNetValue).toBeCloseTo(-375.9, 6); // 1813.05 long 400 P - 2188.95 short 410 P
    expect(find(list, "DY:2026-02-13").realizedPnl).toBeCloseTo(-626.2, 6); // 2885.9 - 3512.1
    expect(find(list, "DY:2026-02-13").returnOnOpenNetValue).toBeCloseTo(-626.2 / 375.9, 6);
  });

  it("long put which was a spread with the assigned 195 P stays alone", () => {
    expect(find(list, "AMD:2026-02-06")).toMatchObject({ strategyName: "Long Put", legCount: 1, openNetValue: 714.99, realizedPnl: -696.44, isDebit: true, isLoser: true });
  });

  it("same-day expiration", () => {
    expect(find(list, "QQQ:2026-03-13")).toMatchObject({ holdingDays: 0, holdingDaysBucket: "same-day", dteAtOpenMin: 0, dteAtOpenBucket: "0" });
  });
});

describe("buildSetups files/qqq.htm", () => {
  const list = setups("files/qqq.htm");

  it("unrelated spreads on the same underlying opened the same day become one setup", () => {
    // known limitation: statement lots have no open time, SPY 686/691 C and 695/700 C spreads merge
    expect(find(list, "SPY:2026-03-02")).toMatchObject({ legCount: 4, legCountBucket: "4+", strategyName: "Custom", putCall: "calls", singleExpiry: false, expiryCount: 2, dteAtOpenMin: 0, dteAtOpenMax: 4 });
  });

  it("puts and calls in one setup are mixed", () => {
    const trades = extract(loadFixture("files/qqq.htm"));
    const withPut = trades.map((t) => (t.symbol === "SPY 06MAR26 700 C" ? { ...t, symbol: "SPY 06MAR26 700 P" } : t));

    expect(find(buildSetups(withPut), "SPY:2026-03-02").putCall).toBe("mixed");
    expect(find(list, "QQQ:2026-03-02").putCall).toBe("calls");
  });
});

describe("buildSetups files/ytd/proper.htm", () => {
  const list = setups("files/ytd/proper.htm");

  it("lots of one contract are summed into one leg", () => {
    // 3 lots of 163.33 P and 3 lots of 166.67 P
    expect(find(list, "POWL:2026-02-17")).toMatchObject({ strategyName: "Bull Put Spread", legCount: 2, dteAtOpenMin: 59, holdingDays: 50 });
    expect(find(list, "POWL:2026-02-17").items).toHaveLength(6);
  });

  it("no setups without options", () => {
    expect(buildSetups(extract(loadFixture("files/settings/proper_09.htm")))).toEqual([]);
  });
});
