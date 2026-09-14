import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRates, parseRates, ratesUrl } from "./rates";
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

describe("fetchRates", () => {
  it("requests range through proxy and parses response", async () => {
    const fetch = stubFetch(nbuResponse);

    const rates = await fetchRates("2026-03-02", "2026-03-03");

    expect(rates).toEqual({ "2026-03-02": 41.5, "2026-03-03": 41.6123 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0].toString()).toBe(ratesUrl("2026-03-02", "2026-03-03").toString());
    expect(fetch.mock.calls[0][1]?.headers).toEqual({ "x-host": "bank.gov.ua", "x-cache-control": "public, max-age=604800" });
  });

  it("does not fetch without range", async () => {
    const fetch = stubFetch(nbuResponse);

    expect(await fetchRates("", "2026-03-03")).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("trade rates", () => {
  it("fetches from earliest open date to latest close date", async () => {
    const fetch = stubFetch(nbuResponse);
    const trades = extract(loadFixture("files/qqq.htm"));

    await fetchTradeRates(trades);

    expect(fetch.mock.calls[0][0].toString()).toBe(ratesUrl("2020-05-26", "2026-03-03").toString());
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

    expect(trade.open_rate).toBe(41.5);
    expect(trade.close_rate).toBe(41.6123);
  });

  it("missing rate gives null", () => {
    const [trade] = withRates(extract(loadFixture("files/qqq.htm")), {});

    expect(trade.open_rate).toBeNull();
    expect(trade.close_rate).toBeNull();
  });
});
