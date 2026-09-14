// Trims an IBKR activity statement down to a few symbols, to keep test fixtures small.
//
//   npm run trim -- <input.htm> <output.htm> "QQQ,QQQ 02MAR26 607 C,BND"
//
// Symbols are matched exactly: "QQQ" keeps stock trades and dividends of QQQ, options
// have to be listed one by one ("QQQ 02MAR26 607 C"). Trades (closing rows, closed lots, totals),
// dividends and withholding tax rows of other symbols are removed; section headers and
// category totals are kept as is, so totals of the trimmed file are not recalculated.
// The rest of the file stays byte for byte. Run anonymize before or after.

import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const [input, output, list] = process.argv.slice(2);
if (!(input && output && list)) {
  throw new Error('usage: npm run trim -- <input.htm> <output.htm> "SYMBOL,SYMBOL,..."');
}

const symbols = list.split(",").map((symbol) => symbol.trim());

const CELL = /<td[^>]*>([\s\S]*?)<\/td>/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

let html = readFileSync(input, "utf-8");
html = trimSection(html, "tblTransactions", trimTrades);
html = trimSection(html, "tblCombDiv", trimDividends);
html = trimSection(html, "tblWithholdingTax", trimDividends);

writeFileSync(output, html);
console.log(`${input} → ${output}: kept ${symbols.join(", ")}`);

function isKept(symbol: string) {
  return symbols.includes(symbol);
}

/** Applies trim to the table of the section, leaves the file untouched when there is no such section */
function trimSection(source: string, section: string, trim: (table: string) => string) {
  const start = source.indexOf(`id="${section}_`);
  if (start === -1) {
    return source;
  }
  const tableStart = source.indexOf("<table", start);
  const tableEnd = source.indexOf("</table>", tableStart);
  return source.slice(0, tableStart) + trim(source.slice(tableStart, tableEnd)) + source.slice(tableEnd);
}

/** Plain text of a HTML fragment */
function text(fragment: string) {
  return fragment
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .trim();
}

/**
 * Trades table is a flat sequence of: thead, closing trade <tr class="row-summary"> (not wrapped in tbody),
 * its closed lots <tbody class="row-detail">, its <tbody> with "Total SYMBOL", category headers and totals.
 * Lots follow their closing trade, so every row belongs to the last seen symbol.
 */
function trimTrades(table: string) {
  let current = "";
  return table.replaceAll(/\s*(<thead[\s\S]*?<\/thead>|<tbody[^>]*>[\s\S]*?<\/tbody>|<tr[^>]*>[\s\S]*?<\/tr>)/g, (segment) => {
    const firstCell = text(segment.match(CELL)?.[1] ?? "");
    if (segment.includes('class="row-summary"')) {
      current = firstCell;
      return isKept(current) ? segment : "";
    }
    if (segment.includes('class="row-detail"')) {
      return isKept(current) ? segment : "";
    }
    if (firstCell.startsWith("Total ")) {
      return isKept(firstCell.slice("Total ".length)) ? segment : "";
    }
    return segment;
  });
}

/** Dividends and withholding tax rows start with a date, description starts with "SYMBOL(ISIN)" */
function trimDividends(table: string) {
  return table.replaceAll(/\s*<tr[^>]*>[\s\S]*?<\/tr>/g, (row) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, cell]) => text(cell ?? ""));
    if (!DATE.test(cells[0] ?? "")) {
      return row;
    }
    const symbol = (cells[1] ?? "").split("(")[0] ?? "";
    return isKept(symbol) ? row : "";
  });
}
