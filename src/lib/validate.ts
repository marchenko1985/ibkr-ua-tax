import { CLOSED_LOT, TRADES_HEADERS, tradesHeaders } from "./extract";

/** A statement setting which has to be changed, texts match the guide (how-card) */
export interface Problem {
  /** setting name as shown in IBKR statement configuration */
  setting: string;
  /** value the setting must have */
  expected: string;
  /** what in the uploaded statement shows the setting is wrong */
  reason: string;
}

/**
 * Checks the statement was built with settings from the guide.
 *
 * A wrongly built statement looks fine but produces wrong numbers (shifted columns,
 * no open dates of lots, opening trades), so nothing should be calculated from it.
 * Each check is backed by a sample in files/settings.
 *
 * @returns all problems found, empty when the statement is fine
 */
export function validateStatement(document: Document): Problem[] {
  const headerRows = tradesHeaders(document);
  if (headerRows.length === 0) {
    return [];
  }
  const headers = headerRows.flat();

  const problems: Problem[] = [];
  const rows = tradeRows(document);

  if (headers.includes("MTM P/L") || headers.includes("C. Price")) {
    problems.push({ setting: "Profit and Loss", expected: "Realized P/L Only", reason: "у звіті є стовпчики C. Price та MTM P/L" });
  }

  const hasClosingTrades = rows.some((row) => row.codes.includes("C"));
  const hasClosedLots = rows.some((row) => row.first === CLOSED_LOT);
  if (hasClosingTrades && !hasClosedLots) {
    problems.push({ setting: "Hide Details for Positions, Trades and Client Fees Sections?", expected: "No", reason: "у звіті немає рядків Closed Lot з датами відкриття позицій" });
  }

  if (rows.some((row) => row.first !== CLOSED_LOT && row.codes.includes("O") && !row.codes.includes("C"))) {
    problems.push({ setting: "Display Closing Trades Only?", expected: "Yes", reason: "у звіті є угоди відкриття позицій" });
  }

  // columns changed by a setting not recognized above
  const unexpected = headerRows.find((row) => row.join("|") !== TRADES_HEADERS.join("|"));
  if (problems.length === 0 && unexpected) {
    problems.push({ setting: "Section Configurations", expected: "як в інструкції", reason: `неочікувані стовпчики угод: ${unexpected.join(", ")}` });
  }

  return problems;
}

/** First cell and codes (last cell) of every trades table row */
function tradeRows(document: Document) {
  return Array.from(document.querySelectorAll('div[id^="tblTransactions_"] table tbody tr')).map((tr) => {
    const cells = Array.from(tr.querySelectorAll("td"));
    return {
      first: cells.at(0)?.textContent.trim() ?? "",
      codes: (cells.length > 1 ? (cells.at(-1)?.textContent ?? "") : "").split(";").map((code) => code.trim()),
    };
  });
}
