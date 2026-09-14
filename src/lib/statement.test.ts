// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFixture, parseHtml, stubFetch } from "./fixture";
import { ratesUrl } from "./rates";
import { loadStatement, parseStatement } from "./statement";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadStatement", () => {
  it("fetches rates once, from earliest to latest date of trades and dividends (plus a week on both sides)", async () => {
    // only the edges of the range are known, so every rate is estimated between them
    const fetch = stubFetch([
      { cc: "USD", exchangedate: "19.05.2020", rate_per_unit: 27 },
      { cc: "USD", exchangedate: "10.03.2026", rate_per_unit: 43 },
    ]);
    const document = loadFixture("files/qqq.htm");

    const statement = await loadStatement(document);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(ratesUrl("2020-05-19", "2026-03-10").toString());
    expect(statement.document).toBe(document);
    expect(statement.trades).toHaveLength(29);
    expect(statement.trades.every((t) => t.open_rate === 35 && t.open_rate_estimated && t.close_rate === 35 && t.close_rate_estimated)).toBe(true);
    expect(statement.dividends).toMatchObject([{ date: "2026-02-27", rate: 35, rate_estimated: true }]);
  });

  it("computes trade values", async () => {
    stubFetch([
      { cc: "USD", exchangedate: "19.05.2020", rate_per_unit: 40 },
      { cc: "USD", exchangedate: "10.03.2026", rate_per_unit: 40 },
    ]);

    const statement = await loadStatement(loadFixture("files/qqq.htm"));
    const buyback = statement.trades.find((t) => t.symbol === "QQQ" && t.is_short);

    expect(buyback?.realized_uah).toBeCloseTo(455.28 * 40, 6);
  });

  it("does not fetch for a statement without trades and dividends", async () => {
    const fetch = stubFetch([]);

    const statement = await loadStatement(parseHtml("<html></html>"));

    expect(statement.trades).toEqual([]);
    expect(statement.dividends).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails when rates can not be estimated", async () => {
    stubFetch([]);

    await expect(loadStatement(loadFixture("files/qqq.htm"))).rejects.toThrow("Немає курсу НБУ");
  });
});

describe("parseStatement", () => {
  it("parses statement with trades", () => {
    const html = loadFixture("files/amd.htm").documentElement.outerHTML;

    expect(parseStatement(html).querySelectorAll('div[id^="tblTransactions_"]')).toHaveLength(1);
  });

  it("fails for html without trades and dividends", () => {
    expect(() => parseStatement("<html><body><p>hello</p></body></html>")).toThrow("Завантажений файл не містить необхідної інформації");
  });
});
