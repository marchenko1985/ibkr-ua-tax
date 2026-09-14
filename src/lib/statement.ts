import { type Dividend, extractDividends, withDividendRates } from "./dividends";
import { enrich } from "./enrich";
import { extract, type Trade } from "./extract";
import { fetchRates } from "./rates";

/** Everything parsed and computed from an uploaded IBKR statement, input for all cards */
export interface Statement {
  document: Document;
  trades: Trade[];
  dividends: Dividend[];
}

/**
 * Parses the statement and fetches NBU rates once for all its dates.
 * Throws when a rate is missing and can not be estimated.
 */
export async function loadStatement(document: Document): Promise<Statement> {
  const trades = extract(document);
  const dividends = extractDividends(document);

  const dates = [...trades.flatMap((trade) => [trade.open_date, trade.close_date]), ...dividends.map((dividend) => dividend.date)].sort();
  const rates = await fetchRates(dates.at(0) ?? "", dates.at(-1) ?? "");

  return {
    document,
    trades: enrich(trades, rates),
    dividends: withDividendRates(dividends, rates),
  };
}

/**
 * Parses uploaded HTML and checks it looks like an IBKR activity statement.
 * DOMParser never throws, so the check is done manually by required tables.
 */
export function parseStatement(html: string): Document {
  const document = new DOMParser().parseFromString(html, "text/html");
  const hasTradesTable = document.querySelectorAll('div[id^="tblTransactions_"] table tbody tr').length > 0;
  const hasDividendsTable = document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr').length > 0;
  if (!(hasTradesTable || hasDividendsTable)) {
    throw new Error("Завантажений файл не містить необхідної інформації про угоди чи дивіденди. Будь ласка, переконайтеся, що ви завантажуєте правильний HTML-файл звіту з Interactive Brokers.");
  }
  return document;
}
