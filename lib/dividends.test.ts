import { describe, it, expect } from "vitest";
import { extractDividends, withDividendRates } from "./dividends";
import { loadFixture, parseHtml } from "./fixture";

// Mimics IBKR layout: header in thead, currency row first and total row last in tbody
function statement({ dividends, withholding }: { dividends: string[][]; withholding: string[][] }) {
  const rows = (cells: string[][]) => cells.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return parseHtml(`
    <div id="tblCombDiv_U1Body"><table>
      <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody><tr><td colspan="3">USD</td></tr>${rows(dividends)}<tr><td colspan="2">Total</td><td>0</td></tr></tbody>
    </table></div>
    <div id="tblWithholdingTax_U1Body"><table>
      <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Code</th></tr></thead>
      <tbody><tr><td colspan="4">USD</td></tr>${rows(withholding)}<tr><td colspan="2">Total</td><td>0</td><td></td></tr></tbody>
    </table></div>
  `);
}

describe("extractDividends", () => {
  it("empty document", () => {
    expect(extractDividends(parseHtml("<html></html>"))).toEqual([]);
  });

  it("qqq.htm — single dividend without withholding tax section", () => {
    expect(extractDividends(loadFixture("files/qqq.htm"))).toEqual([
      {
        date: "2026-02-27",
        identifier: "CCL(PA1436583006) Cash Dividend USD 0.15 per Share",
        description: "CCL(PA1436583006) Cash Dividend USD 0.15 per Share (Ordinary Dividend)",
        amount: 3.45,
        tax: 0,
        income: 3.45,
        rate: 0,
        income_uah: 0,
      },
    ]);
  });

  it("amd.htm — no dividends section", () => {
    expect(extractDividends(loadFixture("files/amd.htm"))).toEqual([]);
  });

  it("matches withholding tax by date and identifier", () => {
    const document = statement({
      dividends: [
        ["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share (Ordinary Dividend)", "26.00"],
        ["2026-03-12", "MSFT(US5949181045) Cash Dividend USD 0.83 per Share (Ordinary Dividend)", "83.00"],
      ],
      withholding: [
        ["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share - US Tax", "-3.90", ""],
        ["2026-03-12", "MSFT(US5949181045) Cash Dividend USD 0.83 per Share - US Tax", "-12.45", ""],
      ],
    });

    const dividends = extractDividends(document);

    expect(dividends).toHaveLength(2);
    expect(dividends[0]).toMatchObject({ identifier: "AAPL(US0378331005) Cash Dividend USD 0.26 per Share", amount: 26, tax: -3.9, income: 22.1 });
    expect(dividends[1]).toMatchObject({ identifier: "MSFT(US5949181045) Cash Dividend USD 0.83 per Share", amount: 83, tax: -12.45, income: 70.55 });
  });

  it("sums several withholding rows of the same dividend (e.g. tax and its correction)", () => {
    const document = statement({
      dividends: [["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share (Ordinary Dividend)", "26.00"]],
      withholding: [
        ["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share - US Tax", "-7.80", ""],
        ["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share - US Tax", "3.90", ""],
      ],
    });

    expect(extractDividends(document)[0]).toMatchObject({ tax: -3.9, income: 22.1 });
  });

  it("ignores withholding rows of other dates, e.g. previous year adjustments", () => {
    const document = statement({
      dividends: [["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share (Ordinary Dividend)", "26.00"]],
      withholding: [
        ["2025-02-05", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share - US Tax", "3.52", ""],
        ["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share - US Tax", "-3.90", ""],
      ],
    });

    expect(extractDividends(document)[0]).toMatchObject({ tax: -3.9, income: 22.1 });
  });

  it("removes thousands separator from amount", () => {
    const document = statement({
      dividends: [["2026-03-10", "AAPL(US0378331005) Cash Dividend USD 0.26 per Share (Ordinary Dividend)", "1,026.00"]],
      withholding: [],
    });

    expect(extractDividends(document)[0].amount).toBe(1026);
  });
});

describe("withDividendRates", () => {
  it("converts income to UAH with the rate of the dividend date", () => {
    const dividends = extractDividends(loadFixture("files/qqq.htm"));

    const [dividend] = withDividendRates(dividends, { "2026-02-26": 43.0, "2026-02-27": 43.5 });

    expect(dividend.rate).toBe(43.5);
    expect(dividend.income_uah).toBeCloseTo(3.45 * 43.5, 6); // 150.075
  });

  it("missing rate gives 0", () => {
    const dividends = extractDividends(loadFixture("files/qqq.htm"));

    const [dividend] = withDividendRates(dividends, {});

    expect(dividend.rate).toBe(0);
    expect(dividend.income_uah).toBe(0);
  });
});
