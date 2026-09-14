import { describe, expect, it } from "vitest";
import { extractDividends, withDividendRates } from "./dividends";
import { enrich } from "./enrich";
import { extract } from "./extract";
import { loadFixture } from "./fixture";
import { dividendsTotals, tradesTotals } from "./totals";

// Full pipeline on fixtures with fake NBU rates: extract → rates → enrich → totals

const amdRates = {
  "2026-02-06": 41.0,
  "2026-02-13": 41.1,
  "2026-02-20": 41.2,
  "2026-02-26": 41.3,
  "2026-03-06": 41.4,
  "2026-03-13": 41.5,
  "2026-03-16": 41.6,
};

const qqqRates = {
  "2020-05-26": 27.0,
  "2020-06-26": 27.1,
  "2020-07-13": 27.2,
  "2020-11-02": 28.0,
  "2022-06-22": 29.0,
  "2023-08-16": 36.5,
  "2023-09-28": 36.5,
  "2023-10-05": 36.5,
  "2023-10-31": 36.5,
  "2023-11-06": 36.5,
  "2023-11-28": 36.5,
  "2023-12-01": 36.5,
  "2023-12-26": 36.5,
  "2024-01-02": 38.0,
  "2024-01-29": 38.1,
  "2024-02-01": 38.2,
  "2024-03-04": 38.3,
  "2024-04-01": 38.4,
  "2024-05-31": 38.5,
  "2024-12-16": 41.5,
  "2026-02-03": 43.0,
  "2026-02-27": 43.05,
  "2026-03-02": 43.1,
  "2026-03-03": 43.2,
};

function taxableTrades(path: string, rates: Record<string, number>) {
  const trades = enrich(extract(loadFixture(path)), rates);
  return trades.filter((t) => !(t.is_assignment || t.is_exercise));
}

describe("tradesTotals", () => {
  it("amd.htm — USD loss but UAH profit because of FX", () => {
    const trades = taxableTrades("files/amd.htm", amdRates);

    const total = tradesTotals(trades);

    expect(trades).toHaveLength(13);
    expect(total.realized_usd).toBeCloseTo(-4.47, 6);
    expect(total.open_uah).toBeCloseTo(1181462.94, 6);
    expect(total.close_uah).toBeCloseTo(1183270.844, 6);
    expect(total.realized_uah).toBeCloseTo(1807.904, 6);
    expect(total.personal_income_tax).toBeCloseTo(325.42272, 6); // 18%
    expect(total.military_tax).toBeCloseTo(90.3952, 6); // 5%
  });

  it("qqq.htm", () => {
    const trades = taxableTrades("files/qqq.htm", qqqRates);

    const total = tradesTotals(trades);

    expect(trades).toHaveLength(28);
    expect(total.realized_usd).toBeCloseTo(11723.66, 6);
    expect(total.open_uah).toBeCloseTo(2032376.896, 6);
    expect(total.close_uah).toBeCloseTo(2663212.952, 6);
    expect(total.realized_uah).toBeCloseTo(630836.056, 6);
    expect(total.personal_income_tax).toBeCloseTo(113550.49008, 6);
    expect(total.military_tax).toBeCloseTo(31541.8028, 6);
  });

  it("no taxes on total loss", () => {
    const losing = taxableTrades("files/amd.htm", amdRates).filter((t) => t.realized_uah < 0);

    const total = tradesTotals(losing);

    expect(losing).toHaveLength(6);
    expect(total.realized_uah).toBeCloseTo(-211456.53, 6);
    expect(total.personal_income_tax).toBe(0);
    expect(total.military_tax).toBe(0);
  });

  it("empty", () => {
    expect(tradesTotals([])).toEqual({ open_uah: 0, close_uah: 0, realized_uah: 0, personal_income_tax: 0, military_tax: 0, realized_usd: 0 });
  });
});

describe("dividendsTotals", () => {
  it("qqq.htm", () => {
    const dividends = withDividendRates(extractDividends(loadFixture("files/qqq.htm")), qqqRates);

    const total = dividendsTotals(dividends);

    expect(total.amount_total).toBe(3.45);
    expect(total.us_tax_total).toBe(0);
    expect(total.income_total).toBe(3.45);
    expect(total.total_income_uah).toBeCloseTo(148.5225, 6); // 3.45 × 43.05
    // NOTE: 9% is the current behaviour, the law is to be confirmed (see README TODO)
    expect(total.dividends_tax).toBeCloseTo(13.367025, 6);
    expect(total.military_tax).toBeCloseTo(7.426125, 6);
    expect(total.total_tax).toBeCloseTo(20.79315, 6);
    expect(total.net_income_uah).toBeCloseTo(127.72935, 6);
  });
});
