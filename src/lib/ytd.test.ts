import { beforeAll, describe, expect, it } from "vitest";
import { type Dividend, extractDividends } from "./dividends";
import { extract, type Trade } from "./extract";
import { expectLotsAddUpToCloseRows, loadFixture } from "./fixture";
import { validateStatement } from "./validate";

// files/ytd: a real year to date statement (January 1 – September 11, 2026), anonymized and trimmed
// to contracts covering the interesting cases:
//
//   npm run anonymize -- ytd.htm anonymized.htm
//   npm run trim -- anonymized.htm files/ytd/proper.htm "QQQ,QQQ 02MAR26 607 C,QQQ 02MAR26 612 C,QQQ 15MAY26 664 P,SNDK,SNDK 06FEB26 592.5 C,SNDK 06FEB26 592.5 P,POWL,POWL 17APR26 163.33 P,POWL 17APR26 166.67 P,VOO,RBLX,RBLX 13MAR26 60 P,RBLX 13MAR26 55 P,W,W 20MAR26 95 P,SPY 06FEB26 678 P,BND,TLT,CCL"
//
// proper.htm is built with the guide settings, group_by_symbol.htm additionally with
// "Group Buys and Sells per Symbol in Trades Section?: Yes". "Combine by Underlying" and
// "Breakout Positions into Long and Short" produced byte-identical statements, so no fixtures for them.

function lots(trades: Trade[], symbol: string) {
  return trades.filter((trade) => trade.symbol === symbol);
}

describe("files/ytd/proper.htm", () => {
  let document: Document;
  let trades: Trade[];

  beforeAll(() => {
    document = loadFixture("files/ytd/proper.htm");
    trades = extract(document);
  });

  it("is a valid statement", () => {
    expect(validateStatement(document)).toEqual([]);
  });

  it("54 closed lots of 17 contracts", () => {
    expect(trades).toHaveLength(54);
    expect(new Set(trades.map((trade) => trade.symbol)).size).toBe(17);
  });

  it("lots add up to closing rows", () => {
    expectLotsAddUpToCloseRows(trades);
  });

  it("QQQ — 20 long term lots delivered by assignment in one close, then short buyback", () => {
    const qqq = lots(trades, "QQQ");
    const delivered = qqq.filter((trade) => trade.is_long);

    expect(delivered).toHaveLength(20);
    expect(new Set(delivered.map((trade) => trade.close_datetime)).size).toBe(1);
    expect(delivered.every((trade) => trade.close_codes.join(";") === "A;C;O" && trade.close_quantity === -100)).toBe(true);
    expect(delivered[0]).toMatchObject({ open_date: "2020-05-26", open_quantity: 1, open_basis: 234.86, open_realized: 373.08, open_codes: ["LT"] });
    expect(qqq.filter((trade) => trade.is_short)).toHaveLength(1);
  });

  it("assigned options are flagged and have no realized P/L", () => {
    const assigned = trades.filter((trade) => trade.is_assignment);

    expect(assigned.map((trade) => trade.symbol).sort()).toEqual(["QQQ 02MAR26 607 C", "RBLX 13MAR26 60 P", "SNDK 06FEB26 592.5 C", "W 20MAR26 95 P"]);
    expect(assigned.every((trade) => trade.is_option && trade.is_short && trade.open_realized === 0)).toBe(true);
  });

  it("stocks received or delivered by assignment are not flagged", () => {
    for (const symbol of ["QQQ", "SNDK", "RBLX", "W"]) {
      expect(
        lots(trades, symbol).every((trade) => !(trade.is_option || trade.is_assignment)),
        symbol,
      ).toBe(true);
    }
  });

  it("expired options — long lose basis, short keep premium", () => {
    expect(lots(trades, "QQQ 02MAR26 612 C")).toMatchObject([{ is_long: true, close_codes: ["C", "Ep"], open_basis: 11.7, open_realized: -11.7 }]);
    expect(lots(trades, "RBLX 13MAR26 55 P")).toMatchObject([{ is_long: true, close_codes: ["C", "Ep"], open_basis: 19.7, open_realized: -19.7 }]);
    expect(lots(trades, "SNDK 06FEB26 592.5 P")).toMatchObject([{ is_short: true, close_codes: ["C", "Ep"], open_basis: -741.95, open_realized: 741.95 }]);
  });

  it("SNDK — short stock after assigned call", () => {
    expect(lots(trades, "SNDK")).toMatchObject([{ is_short: true, is_option: false, open_date: "2026-02-06", close_date: "2026-02-09", open_quantity: -100, open_basis: -60033.93, open_realized: 3523.69 }]);
  });

  it("POWL — adjusted option strikes and partially filled spread, 3 lots each", () => {
    const long = lots(trades, "POWL 17APR26 163.33 P");
    const short = lots(trades, "POWL 17APR26 166.67 P");

    expect(long).toHaveLength(3);
    expect(short).toHaveLength(3);
    expect([...long, ...short].every((trade) => trade.is_option && trade.close_codes.join(";") === "C;P")).toBe(true);
    expect(lots(trades, "POWL").every((trade) => trade.open_codes.includes("LT"))).toBe(true);
  });

  it("VOO — fractional shares sold 9 times", () => {
    const voo = lots(trades, "VOO");

    expect(voo).toHaveLength(9);
    expect(voo.every((trade) => trade.close_codes.join(";") === "C;FP")).toBe(true);
    expect(voo.find((trade) => trade.close_date === "2026-01-02")).toMatchObject({ open_date: "2025-09-23", open_quantity: 0.143, open_basis: 87.94, open_realized: 1.9 });
  });

  it("SPY 06FEB26 678 P — same contract closed twice, once normally and once expired", () => {
    expect(lots(trades, "SPY 06FEB26 678 P").map((trade) => trade.close_codes.join(";"))).toEqual(["C", "C;Ep"]);
  });

  describe("dividends", () => {
    let dividends: Dividend[];

    function dividend(date: string, symbol: string) {
      return dividends.filter((div) => div.date === date && div.identifier.startsWith(`${symbol}(`));
    }

    beforeAll(() => {
      dividends = extractDividends(document);
    });

    it("24 dividends of 5 symbols", () => {
      expect(dividends).toHaveLength(24);
      expect(new Set(dividends.map((div) => div.identifier.split("(")[0]))).toEqual(new Set(["BND", "TLT", "CCL", "POWL", "VOO"]));
    });

    it("gross amounts, withholding tax section is ignored", () => {
      expect(dividend("2026-02-04", "BND")).toMatchObject([{ amount: 24.55 }]);
      expect(dividend("2026-07-07", "TLT")).toMatchObject([{ amount: 23.85 }, { amount: 13.36 }]);
      expect(dividend("2026-05-29", "CCL")).toMatchObject([{ amount: 3.45 }]);
      expect(dividends.every((div) => !("tax" in div))).toBe(true);
    });
  });
});

describe("files/ytd/group_by_symbol.htm", () => {
  it("same trades as proper.htm, only the order within a day differs", () => {
    const document = loadFixture("files/ytd/group_by_symbol.htm");
    const withoutId = ({ id: _, ...trade }: Trade) => JSON.stringify(trade);

    const grouped = extract(document).map(withoutId).sort();
    const proper = extract(loadFixture("files/ytd/proper.htm")).map(withoutId).sort();

    expect(validateStatement(document)).toEqual([]);
    expect(grouped).toEqual(proper);
  });
});
