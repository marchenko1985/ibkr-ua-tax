/**
 * Parses transactions from Interactive Brokers statements report.
 *
 * Reconstructs closed positions from "Closed Lot:" detail rows in the IBKR HTML statement.
 * Each closed lot becomes one row — the parent (close) row provides the closing context
 * (date, symbol, proceeds, code), while the detail (open) row provides the opening context
 * (date, basis, realized P&L).
 *
 * IBKR trade codes (semicolon-delimited in the Code column):
 *   C  — Closing trade: the position was closed normally
 *   O  — Opening trade: a new position was opened
 *   A  — Assignment: an option was converted into stock by the counterparty exercising.
 *         For OPTION rows: this is NOT a taxable event — the option transforms into stock,
 *         and its basis is embedded into the resulting stock position's cost basis.
 *         For STOCK rows: the stock row IS a taxable event — it represents the actual
 *         trade created by the assignment (e.g., forced sale or purchase at strike price).
 *   Ex — Exercise: the option holder exercised their own option, converting it to stock.
 *         Same treatment as Assignment — not a taxable event for the option itself,
 *         the stock trade that results from it IS the taxable event.
 *   Ep — Expired Position: the option expired worthless. This IS a taxable event —
 *         the full premium is either a realized loss (long) or realized profit (short).
 *
 * @param document parsed HTML document
 * @returns array of transaction objects with derived flags for filtering and calculation,
 *   id is the position of the closed lot in the statement, stable identity for UI
 */
export function extract(document: Document) {
  return Array.from(document.querySelectorAll("tbody.row-detail td:nth-child(1)"))
    .filter((td) => td.textContent === CLOSED_LOT)
    .map((td) => td.closest("tr"))
    .filter((lot) => lot !== null)
    .map((lot, index) => ({ id: index + 1, ...toTrade(lot, findCloseRow(lot)) }))
    .sort((a, b) => a.close_date.localeCompare(b.close_date));
}

const CLOSED_LOT = "Closed Lot:";

/**
 * Trades table columns (1-based), statement built with "Profit and Loss: Realized P/L Only".
 * TODO: read positions from table header instead, other statement settings add or remove columns.
 */
const COLUMN = {
  symbol: 1,
  datetime: 2,
  exchange: 3,
  quantity: 4,
  tprice: 5,
  proceeds: 6,
  commfee: 7,
  basis: 8,
  realized: 9,
  code: 10,
};

/** "2026-03-13, 11:41:16" → "2026-03-13" */
const DATE_LENGTH = "YYYY-MM-DD".length;

/** Example: WMT 17OCT25 92.5 P — underlying, expiration date, strike, put or call */
const OPTION_SYMBOL = /\s+\d{2}[A-Z]{3}\d{2}\s+\d+(\.\d+)?\s+[CP]$/;

function toTrade(open: Element, close: Element | null | undefined) {
  const symbol = cellText(close, COLUMN.symbol);
  const open_quantity = cellNumber(open, COLUMN.quantity);
  const close_codes = parseCodes(cellText(close, COLUMN.code));
  const is_option = OPTION_SYMBOL.test(symbol);

  return {
    open_date: cellText(open, COLUMN.datetime),
    open_quantity,
    open_tprice: cellNumber(open, COLUMN.tprice),
    open_basis: cellNumber(open, COLUMN.basis),
    open_realized: cellNumber(open, COLUMN.realized),
    open_code: cellText(open, COLUMN.code),
    symbol,
    close_datetime: cellText(close, COLUMN.datetime),
    exchange: cellText(close, COLUMN.exchange),
    close_quantity: cellNumber(close, COLUMN.quantity),
    close_tprice: cellNumber(close, COLUMN.tprice),
    close_proceeds: cellNumber(close, COLUMN.proceeds),
    // commissions are not used in calculations, IBKR already includes them in basis and realized P/L
    close_commfee: cellNumber(close, COLUMN.commfee),
    close_basis: cellNumber(close, COLUMN.basis),
    close_realized: cellNumber(close, COLUMN.realized),
    close_code: cellText(close, COLUMN.code),
    close_date: cellText(close, COLUMN.datetime).slice(0, DATE_LENGTH),

    // --- Parsed code arrays (semicolon-delimited IBKR trade codes)

    open_codes: parseCodes(cellText(open, COLUMN.code)),
    close_codes,

    // --- Exchange rates (assigned by withRates)

    open_rate: 0,
    open_rate_estimated: false,
    close_rate: 0,
    close_rate_estimated: false,

    // --- UAH and USD intermediate values (computed during enrichment, not extraction)

    open_uah: 0,
    close_uah: 0,
    realized_uah: 0,
    open_usd: 0,
    close_usd: 0,
    realized_usd: 0,

    is_long: open_quantity > 0,
    is_short: open_quantity < 0,
    is_option,

    // --- Assignment/Exercise flags
    // These flags are used to exclude option rows from Ф1 tax form output.
    // When an option is assigned (A) or exercised (Ex), it is converted into a stock position.
    // This is NOT a taxable event for the option — the option's economics (premium, fees)
    // are embedded into the resulting stock's cost basis. The taxable event occurs later
    // when that stock position is closed.
    //
    // IMPORTANT: only option rows are flagged. Stock rows may also have "A" in their code
    // (e.g., "A;C;O" for stock delivered via assignment), but those stock rows ARE taxable
    // events and must NOT be excluded. The is_option check ensures this.
    //
    // Note: "Ex" (exercise) is supported preemptively but has not been observed in real
    // IBKR statements yet. It follows the same logic as "A" — option converts to stock.

    is_assignment: is_option && close_codes.includes("A"),
    is_exercise: is_option && close_codes.includes("Ex"),
  };
}

function isClosedLotRow(row: Element | null | undefined) {
  return row?.querySelector("td")?.textContent === CLOSED_LOT;
}

/**
 * Closing trade row of a closed lot row.
 *
 * Several lots of one closing trade follow its row, so the nearest previous row which
 * is not a closed lot is the closing trade. When lots start a new tbody, the closing
 * trade is the first row of the previous tbody.
 */
function findCloseRow(lot: Element) {
  let row = lot.previousElementSibling;
  while (row && isClosedLotRow(row)) {
    row = row.previousElementSibling;
  }
  return row ?? lot.closest("tbody")?.previousElementSibling?.querySelector("tr");
}

function cellText(row: Element | null | undefined, column: number) {
  return row?.querySelector(`td:nth-child(${column})`)?.textContent ?? "";
}

/** Numbers have thousands separators: "17,128.55" */
function cellNumber(row: Element | null | undefined, column: number) {
  return Number(row?.querySelector(`td:nth-child(${column})`)?.textContent?.replaceAll(",", ""));
}

/**
 * Parses IBKR semicolon-delimited trade code string into an array of trimmed code tokens.
 * Example: "A;C;O" → ["A", "C", "O"]
 * Example: "C;Ep" → ["C", "Ep"]
 * Example: "C" → ["C"]
 */
function parseCodes(code: string): string[] {
  return code
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x !== "");
}
