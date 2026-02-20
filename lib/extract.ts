/**
 * Parses transactions from Interactive Brokers statements report
 * @param document parsed HTML document
 * @returns array of transaction objects
 */
export function extract(document: Document) {
  return Array.from(document.querySelectorAll("tbody.row-detail td:nth-child(1)"))
    .filter((td) => td.textContent === "Closed Lot:")
    .map((td) => ({
      open: td.closest("tr"),
      close:
        td.closest("tr")?.previousElementSibling === null
          ? td.closest("tbody")?.previousElementSibling?.querySelector("tr")
          : ((prev) => {
              while (prev?.querySelector("td")?.textContent === "Closed Lot:") {
                prev = prev.previousElementSibling;
              }
              return prev ?? td.closest("tbody")?.previousElementSibling?.querySelector("tr");
            })(td.closest("tr")?.previousElementSibling),
    }))
    .map(({ open, close }) => ({
      open,
      close,
      count:
        close?.nextElementSibling === null
          ? 1
          : ((next: Element | null | undefined) => {
              let count = 0;
              while (next?.querySelector("td")?.textContent === "Closed Lot:") {
                count += 1;
                next = next.nextElementSibling;
              }
              return count;
            })(close?.nextElementSibling),
    }))
    .map(({ open, close, count }) => ({
      count,
      open_date: open?.querySelector("td:nth-child(2)")?.textContent ?? "",
      open_quantity: Number(open?.querySelector("td:nth-child(4)")?.textContent?.replaceAll(",", "")),
      open_tprice: Number(open?.querySelector("td:nth-child(5)")?.textContent?.replaceAll(",", "")),
      open_basis: Number(open?.querySelector("td:nth-child(8)")?.textContent?.replaceAll(",", "")),
      open_realized: Number(open?.querySelector("td:nth-child(9)")?.textContent?.replaceAll(",", "")),
      open_code: open?.querySelector("td:nth-child(10)")?.textContent ?? "",
      symbol: close?.querySelector("td:nth-child(1)")?.textContent ?? "",
      close_datetime: close?.querySelector("td:nth-child(2)")?.textContent ?? "",
      exchange: close?.querySelector("td:nth-child(3)")?.textContent ?? "",
      close_quantity: Number(close?.querySelector("td:nth-child(4)")?.textContent?.replaceAll(",", "")),
      close_tprice: Number(close?.querySelector("td:nth-child(5)")?.textContent?.replaceAll(",", "")),
      close_proceeds: Number(close?.querySelector("td:nth-child(6)")?.textContent?.replaceAll(",", "")),
      close_commfee: Number(close?.querySelector("td:nth-child(7)")?.textContent?.replaceAll(",", "")), // / count, // NOTE: previously we were thinking that we need apply commissions, and because commission is applied to order, we need to distribute it accross closed lots, but later we discovered we do not need to touch commissions at all
      close_basis: Number(close?.querySelector("td:nth-child(8)")?.textContent?.replaceAll(",", "")),
      close_realized: Number(close?.querySelector("td:nth-child(9)")?.textContent?.replaceAll(",", "")),
      close_code: close?.querySelector("td:nth-child(10)")?.textContent ?? "",

      // ---

      close_date: close?.querySelector("td:nth-child(2)")?.textContent?.substring(0, 10) ?? "",
      close_year: Number(close?.querySelector("td:nth-child(2)")?.textContent?.substring(0, 4)) ?? "",

      // ---

      is_expired: open?.querySelector("td:nth-child(10)")?.textContent?.includes("Ep") || close?.querySelector("td:nth-child(10)")?.textContent?.includes("Ep"),

      // ---

      open_rate: 0,
      close_rate: 0,

      // ---

      open_uah: 0,
      close_uah: 0,
      realized_uah: 0,
    }))
    .map((item) => ({
      ...item,
      is_long: item.open_quantity > 0,
      is_short: item.open_quantity < 0,
      is_option: isOption(item.symbol),
    }))
    .sort((a, b) => a.close_date.localeCompare(b.close_date));
}

/**
 * Determines if a symbol represents an option contract
 * Example: WMT 17OCT25 92.5 P
 * Where:
 * - WMT is the underlying stock symbol
 * - 17OCT25 is the expiration date (October 17, 2025)
 * - 92.5 is the strike price
 * - P indicates it's a put option (C would indicate a call option)
 * @param symbol
 */
function isOption(symbol: string) {
  return /\s+\d{2}[A-Z]{3}\d{2}\s+\d+(\.\d+)?\s+[CP]$/.test(symbol);
}

/*
document.querySelector('div[id^="tblTransactions_"].sectionContent')
document.querySelector('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable')
document.querySelectorAll('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable tbody:not(.row-detail) tr.row-summary')


document.querySelectorAll('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable tr.row-summary')
document.querySelectorAll('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable tbody.row-detail tr')

document.querySelectorAll('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable tr.row-summary').item(0).closest('tbody').nextElementSibling


Array.from(document.querySelectorAll('div[id^="tblTransactions_"].sectionContent table#summaryDetailTable tr.row-summary')).map(tr => ({
    symbol: tr.querySelector('td:nth-child(1)').textContent,
    datetime: tr.querySelector('td:nth-child(2)').textContent,
    exchange: tr.querySelector('td:nth-child(3)').textContent,
    quantity: tr.querySelector('td:nth-child(4)').textContent,
    tprice: tr.querySelector('td:nth-child(5)').textContent,
    cprice: tr.querySelector('td:nth-child(6)').textContent,
    proceeds: tr.querySelector('td:nth-child(7)').textContent,
    commfee: tr.querySelector('td:nth-child(8)').textContent,
    basis: tr.querySelector('td:nth-child(9)').textContent,
    realized: tr.querySelector('td:nth-child(10)').textContent,
    mtm: tr.querySelector('td:nth-child(11)').textContent,
    code: tr.querySelector('td:nth-child(12)').textContent,
})).slice(0, 3)


Array.from(document.querySelectorAll('tbody.row-detail td:nth-child(1)')).filter(td => td.textContent === 'Closed Lot:').map(td => ({
    opendate: td.parentNode.querySelector('td:nth-child(2)').textContent,
    quantity: td.parentNode.querySelector('td:nth-child(4)').textContent,
    //tprice: td.parentNode.querySelector('td:nth-child(5)').textContent,
    //basis: td.parentNode.querySelector('td:nth-child(9)').textContent,
    //realized: td.parentNode.querySelector('td:nth-child(10)').textContent,
    //code: td.parentNode.querySelector('td:nth-child(12)').textContent,
    s: td.closest('tr'),
    e: td.closest('tr').previousElementSibling?.querySelector('td:nth-child(1)').textContent === 'Closed Lot:' ? td.closest('tbody').previousElementSibling.querySelector('tr:nth-child(1)') : td.closest('tr').previousElementSibling
})).slice(0, 20)



// $0.closest('tr').previousElementSibling === null ? $0.closest('tbody').previousElementSibling.querySelector('tr') : (prev => { while(prev.querySelector('td').textContent === 'Closed Lot:') { prev = prev.previousElementSibling }; return prev; })($0.closest('tr').previousElementSibling)


// FINAL

Array.from(document.querySelectorAll('tbody.row-detail td:nth-child(1)')).filter(td => td.textContent === 'Closed Lot:').map(td => ({
    open: td.closest('tr'),
    close: td.closest('tr').previousElementSibling === null ? td.closest('tbody').previousElementSibling.querySelector('tr') : (prev => { while(prev.querySelector('td').textContent === 'Closed Lot:') { prev = prev.previousElementSibling }; return prev; })(td.closest('tr').previousElementSibling)
})).map(({open, close}) => ({
    open,
    close,
    count: close.nextElementSibling === null ? 1 : ((next) => { let count = 0; while(next?.querySelector('td').textContent === 'Closed Lot:') { count+=1; next = next.nextElementSibling; } return count; })(close.nextElementSibling)
})).map(({open, close, count}) => ({
    count,
    open_date: open.querySelector('td:nth-child(2)').textContent,
    open_quantity: open.querySelector('td:nth-child(4)').textContent,
    open_tprice: open.querySelector('td:nth-child(5)').textContent,
    open_basis: open.querySelector('td:nth-child(9)').textContent,
    open_realized: open.querySelector('td:nth-child(10)').textContent,
    open_code: open.querySelector('td:nth-child(12)').textContent,
    symbol: close.querySelector('td:nth-child(1)').textContent,
    close_datetime: close.querySelector('td:nth-child(2)').textContent,
    exchange: close.querySelector('td:nth-child(3)').textContent,
    close_quantity: close.querySelector('td:nth-child(4)').textContent,
    close_tprice: close.querySelector('td:nth-child(5)').textContent,
    close_cprice: close.querySelector('td:nth-child(6)').textContent,
    close_proceeds: close.querySelector('td:nth-child(7)').textContent,
    close_commfee: close.querySelector('td:nth-child(8)').textContent,
    close_basis: close.querySelector('td:nth-child(9)').textContent,
    close_realized: close.querySelector('td:nth-child(10)').textContent,
    close_mtm: close.querySelector('td:nth-child(11)').textContent,
    close_code: close.querySelector('td:nth-child(12)').textContent,
})).slice(0, 20)


console.table(Array.from(document.querySelectorAll('tbody.row-detail td:nth-child(1)')).filter(td => td.textContent === 'Closed Lot:').map(td => ({
    open: td.closest('tr'),
    close: td.closest('tr').previousElementSibling === null ? td.closest('tbody').previousElementSibling.querySelector('tr') : (prev => { while(prev.querySelector('td').textContent === 'Closed Lot:') { prev = prev.previousElementSibling }; return prev; })(td.closest('tr').previousElementSibling)
})).map(({open, close}) => ({
    open,
    close,
    count: close.nextElementSibling === null ? 1 : ((next) => { let count = 0; while(next?.querySelector('td').textContent === 'Closed Lot:') { count+=1; next = next.nextElementSibling; } return count; })(close.nextElementSibling)
})).map(({open, close, count}) => ({
    count,
    open_date: open.querySelector('td:nth-child(2)').textContent,
    open_quantity: Number(open.querySelector('td:nth-child(4)').textContent.replaceAll(',', '')),
    open_tprice: Number(open.querySelector('td:nth-child(5)').textContent.replaceAll(',', '')),
    open_basis: Number(open.querySelector('td:nth-child(9)').textContent.replaceAll(',', '')),
    open_realized: Number(open.querySelector('td:nth-child(10)').textContent.replaceAll(',', '')),
    open_code: open.querySelector('td:nth-child(12)').textContent,
    symbol: close.querySelector('td:nth-child(1)').textContent,
    close_datetime: close.querySelector('td:nth-child(2)').textContent,
    exchange: close.querySelector('td:nth-child(3)').textContent,
    close_quantity: Number(close.querySelector('td:nth-child(4)').textContent.replaceAll(',', '')),
    close_tprice: Number(close.querySelector('td:nth-child(5)').textContent.replaceAll(',', '')),
    close_cprice: Number(close.querySelector('td:nth-child(6)').textContent.replaceAll(',', '')),
    close_proceeds: Number(close.querySelector('td:nth-child(7)').textContent.replaceAll(',', '')),
    close_commfee: Number(close.querySelector('td:nth-child(8)').textContent.replaceAll(',', '')),
    close_basis: Number(close.querySelector('td:nth-child(9)').textContent.replaceAll(',', '')),
    close_realized: Number(close.querySelector('td:nth-child(10)').textContent.replaceAll(',', '')),
    close_mtm: Number(close.querySelector('td:nth-child(11)').textContent.replaceAll(',', '')),
    close_code: close.querySelector('td:nth-child(12)').textContent,

    close_date: close.querySelector('td:nth-child(2)').textContent.substring(0, 10)
})))

*/
