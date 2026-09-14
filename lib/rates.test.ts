import { describe, it, expect, vi, afterEach } from "vitest";
import { addDays, fetchRates, parseRates, rateFor, ratesUrl } from "./rates";
import { fetchRates as fetchTradeRates, withRates } from "./fetchRates";
import { extract } from "./extract";
import { loadFixture } from "./fixture";

// Shape of https://bank.gov.ua/NBU_Exchange/exchange_site?valcode=usd&json
const nbuResponse = [
  { exchangedate: "02.03.2026", r030: 840, cc: "USD", txt: "Долар США", enname: "US Dollar", rate: 41.5, units: 1, rate_per_unit: 41.5, group: "1", calcdate: "27.02.2026" },
  { exchangedate: "03.03.2026", r030: 840, cc: "USD", txt: "Долар США", enname: "US Dollar", rate: 41.6123, units: 1, rate_per_unit: 41.6123, group: "1", calcdate: "02.03.2026" },
  { exchangedate: "03.03.2026", r030: 978, cc: "EUR", txt: "Євро", enname: "Euro", rate: 45.1, units: 1, rate_per_unit: 45.1, group: "1", calcdate: "02.03.2026" },
];

function stubFetch(data: unknown) {
  const fetch = vi.fn(async (_url: URL, _init?: RequestInit) => new Response(JSON.stringify(data)));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseRates", () => {
  it("maps dd.mm.yyyy to yyyy-mm-dd and keeps only USD", () => {
    expect(parseRates(nbuResponse)).toEqual({
      "2026-03-02": 41.5,
      "2026-03-03": 41.6123,
    });
  });

  it("empty response", () => {
    expect(parseRates([])).toEqual({});
  });
});

describe("ratesUrl", () => {
  it("builds proxied NBU url for date range", () => {
    expect(ratesUrl("2020-05-26", "2026-03-03").toString()).toBe("https://proxy.marchenko-alexandr.workers.dev/NBU_Exchange/exchange_site?start=20200526&end=20260303&valcode=usd&json=true");
  });
});

describe("addDays", () => {
  it("shifts across month and year boundaries", () => {
    expect(addDays("2026-03-02", -7)).toBe("2026-02-23");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-12-28", 7)).toBe("2026-01-04");
  });
});

describe("rateFor", () => {
  const rates = { "2026-03-01": 41.0, "2026-03-02": 41.5, "2026-03-05": 42.5 };

  it("exact rate", () => {
    expect(rateFor(rates, "2026-03-02")).toEqual({ rate: 41.5, estimated: false });
  });

  it("missing rate is the average of nearest earlier and later days", () => {
    expect(rateFor(rates, "2026-03-03")).toEqual({ rate: 42, estimated: true }); // (41.5 + 42.5) / 2
    expect(rateFor(rates, "2026-03-04")).toEqual({ rate: 42, estimated: true });
  });

  it("fails without earlier day", () => {
    expect(() => rateFor(rates, "2026-02-28")).toThrow("Немає курсу НБУ на 2026-02-28");
  });

  it("fails without later day", () => {
    expect(() => rateFor(rates, "2026-03-06")).toThrow("Немає курсу НБУ на 2026-03-06");
  });

  it("fails without rates", () => {
    expect(() => rateFor({}, "2026-03-02")).toThrow();
  });
});

describe("fetchRates", () => {
  it("requests range extended by a week on both sides and parses response", async () => {
    const fetch = stubFetch(nbuResponse);

    const rates = await fetchRates("2026-03-02", "2026-03-03");

    expect(rates).toEqual({ "2026-03-02": 41.5, "2026-03-03": 41.6123 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(ratesUrl("2026-02-23", "2026-03-10").toString());
    expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({ "x-host": "bank.gov.ua", "x-cache-control": "public, max-age=604800" });
  });

  it("does not fetch without range", async () => {
    const fetch = stubFetch(nbuResponse);

    expect(await fetchRates("", "2026-03-03")).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("trade rates", () => {
  it("fetches from earliest open date to latest close date (plus a week on both sides)", async () => {
    // only the edges of the range are known, so every trade rate is estimated between them
    const fetch = stubFetch([
      { cc: "USD", exchangedate: "19.05.2020", rate_per_unit: 27 },
      { cc: "USD", exchangedate: "10.03.2026", rate_per_unit: 43 },
    ]);
    const trades = extract(loadFixture("files/qqq.htm"));

    const withRates = await fetchTradeRates(trades);

    expect(fetch.mock.calls[0]?.[0].toString()).toBe(ratesUrl("2020-05-19", "2026-03-10").toString());
    expect(withRates.every((t) => t.open_rate === 35 && t.open_rate_estimated && t.close_rate === 35 && t.close_rate_estimated)).toBe(true);
  });

  it("does not fetch without trades", async () => {
    const fetch = stubFetch(nbuResponse);

    expect(await fetchTradeRates([])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("assigns open rate by open date and close rate by close date", () => {
    const trades = extract(loadFixture("files/qqq.htm"));
    const buyback = trades.find((t) => t.symbol === "QQQ" && t.is_short);
    if (!buyback) throw new Error("buyback not found");

    const [trade] = withRates([buyback], { "2026-03-02": 41.5, "2026-03-03": 41.6123 });

    expect(trade).toMatchObject({ open_rate: 41.5, open_rate_estimated: false, close_rate: 41.6123, close_rate_estimated: false });
  });

  it("marks estimated rates", () => {
    const trades = extract(loadFixture("files/qqq.htm"));
    const buyback = trades.find((t) => t.symbol === "QQQ" && t.is_short);
    if (!buyback) throw new Error("buyback not found");

    const [trade] = withRates([buyback], { "2026-03-01": 41.0, "2026-03-03": 41.6, "2026-03-04": 41.8 });

    expect(trade).toMatchObject({ open_rate: 41.3, open_rate_estimated: true, close_rate: 41.6, close_rate_estimated: false });
  });

  it("fails when rate can not be estimated", () => {
    expect(() => withRates(extract(loadFixture("files/qqq.htm")), {})).toThrow("Немає курсу НБУ на 2020-05-26");
  });
});
