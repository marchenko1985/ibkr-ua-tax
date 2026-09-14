import { describe, expect, it } from "vitest";
import { extract } from "./extract";
import { expectLotsAddUpToCloseRows, loadFixture, parseHtml } from "./fixture";
import { validateStatement } from "./validate";

// files/settings: the same days built with different statement settings, see how-card guide
const PNL = "Profit and Loss";
const DETAILS = "Hide Details for Positions, Trades and Client Fees Sections?";
const CLOSING_ONLY = "Display Closing Trades Only?";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function settings(path: string) {
  return validateStatement(loadFixture(path)).map((problem) => problem.setting);
}

describe("validateStatement", () => {
  it.each(["files/settings/proper_09.htm", "files/settings/proper_11.htm", "files/amd.htm", "files/qqq.htm"])("%s — no problems", (path) => {
    expect(validateStatement(loadFixture(path))).toEqual([]);
  });

  it("defaults_09 — default settings, a day with opening trade", () => {
    expect(settings("files/settings/defaults_09.htm")).toEqual([PNL, DETAILS, CLOSING_ONLY]);
  });

  it("defaults_11 — default settings, a day without opening trades", () => {
    expect(settings("files/settings/defaults_11.htm")).toEqual([PNL, DETAILS]);
  });

  it.each(["files/settings/display_closing_trades_only_09.htm", "files/settings/display_closing_trades_only_11.htm"])("%s — only closing trades fixed", (path) => {
    expect(settings(path)).toEqual([PNL, DETAILS]);
  });

  it("hide_details_for_positions_no_09 — only details fixed, a day with opening trade", () => {
    expect(settings("files/settings/hide_details_for_positions_no_09.htm")).toEqual([PNL, CLOSING_ONLY]);
  });

  it("hide_details_for_positions_no_11 — only details fixed, a day without opening trades", () => {
    expect(settings("files/settings/hide_details_for_positions_no_11.htm")).toEqual([PNL]);
  });

  it.each(["files/settings/mtm_and_pnl_09.htm", "files/settings/mtm_and_pnl_11.htm"])("%s — everything but profit and loss fixed", (path) => {
    expect(validateStatement(loadFixture(path))).toEqual([{ setting: PNL, expected: "Realized P/L Only", reason: "у звіті є стовпчики C. Price та MTM P/L" }]);
  });

  it("unknown column layout", () => {
    const document = parseHtml(`<div id="tblTransactions_U1Body"><table>
      <thead><tr><th>Symbol</th><th>Date/Time</th><th>Exchange</th><th>Quantity</th><th>T. Price</th><th>Proceeds</th><th>Comm/Fee</th><th>Basis</th><th>Code</th><th>Realized P/L</th></tr></thead>
      <tbody><tr><td>AAPL</td><td>2026-09-09, 14:19:01</td><td>NASDAQ</td><td>-10</td><td>1</td><td>10</td><td>0</td><td>-5</td><td>C</td><td>5</td></tr></tbody>
      <tbody class="row-detail"><tr><td>Closed Lot:</td><td>2026-09-01</td><td></td><td>10</td><td>0.5</td><td></td><td></td><td>5</td><td>ST</td><td>5</td></tr></tbody>
    </table></div>`);

    expect(validateStatement(document)).toEqual([{ setting: "Section Configurations", expected: "як в інструкції", reason: "неочікувані стовпчики угод: Symbol, Date/Time, Exchange, Quantity, T. Price, Proceeds, Comm/Fee, Basis, Code, Realized P/L" }]);
  });

  it("cancelled trades", () => {
    // no real sample: a proper closing trade with its lot, plus a cancelled trade (code Ca)
    const document = parseHtml(`<div id="tblTransactions_U1Body"><table>
      <thead><tr><th>Symbol</th><th>Date/Time</th><th>Exchange</th><th>Quantity</th><th>T. Price</th><th>Proceeds</th><th>Comm/Fee</th><th>Basis</th><th>Realized P/L</th><th>Code</th></tr></thead>
      <tr class="row-summary"><td>AAPL</td><td>2026-09-09, 14:19:01</td><td>NASDAQ</td><td>-10</td><td>1</td><td>10</td><td>0</td><td>-5</td><td>5</td><td>C</td></tr>
      <tbody class="row-detail"><tr><td>Closed Lot:</td><td>2026-09-01</td><td></td><td>10</td><td>0.5</td><td></td><td></td><td>5</td><td>5</td><td>ST</td></tr></tbody>
      <tr class="row-summary"><td>AAPL</td><td>2026-09-10, 10:00:00</td><td>NASDAQ</td><td>-10</td><td>1</td><td>10</td><td>0</td><td>-5</td><td>5</td><td>C;Ca</td></tr>
    </table></div>`);

    expect(validateStatement(document)).toEqual([{ setting: "Display Canceled Trades?", expected: "No", reason: "у звіті є скасовані угоди" }]);
  });

  it("statement without trades section", () => {
    expect(validateStatement(parseHtml("<html></html>"))).toEqual([]);
  });
});

describe("extract with statement settings", () => {
  it.each(["files/settings/defaults_11.htm", "files/settings/hide_details_for_positions_no_11.htm", "files/settings/mtm_and_pnl_11.htm"])("%s — refuses shifted columns", (path) => {
    expect(() => extract(loadFixture(path))).toThrow("Unexpected trades table columns");
  });

  it("proper_09 — one closed lot", () => {
    const trades = extract(loadFixture("files/settings/proper_09.htm"));

    expect(trades).toHaveLength(1);
    expectLotsAddUpToCloseRows(trades);
  });

  it("proper_11 — eleven closed lots", () => {
    const trades = extract(loadFixture("files/settings/proper_11.htm"));

    expect(trades).toHaveLength(11);
    expectLotsAddUpToCloseRows(trades);
    for (const trade of trades) {
      expect(trade.open_date).toMatch(DATE);
      expect(trade.close_date).toBe("2026-09-11");
      expect(trade.exchange).not.toBe("");
      expect(Number.isFinite(trade.open_basis)).toBe(true);
      expect(Number.isFinite(trade.open_realized)).toBe(true);
    }
  });
});
