interface TableCellData {
  /** position of the cell in the row, stable identity for UI */
  id: number;
  text: string;
  colSpan: number;
}

export interface TableRowData {
  /** position of the row in the table, stable identity for UI */
  id: number;
  cells: TableCellData[];
}

/** Rows of statement table(s) matching selector, copied as plain data */
export function tableRows(document: Document, selector: string): TableRowData[] {
  return Array.from(document.querySelectorAll(selector)).map((tr, rowIndex) => ({
    id: rowIndex + 1,
    cells: Array.from(tr.querySelectorAll("td")).map((td, cellIndex) => ({
      id: cellIndex + 1,
      text: td.textContent,
      colSpan: td.colSpan,
    })),
  }));
}
