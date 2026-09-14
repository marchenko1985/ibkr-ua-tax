# CLAUDE.md

Static site (GitHub Pages) that takes an Interactive Brokers **Activity Statement** HTML report, parses it in the browser, and prepares everything a Ukrainian tax resident needs for the yearly declaration: closed positions converted to UAH with NBU rates, the Ф1 appendix table, dividends, and a translated printable copy of the statement.

Key idea: calculations are made from the same HTML statement that is attached to the declaration as the proving document — not from Flex reports.

## Working agreements

- **Commit and push often**, at every meaningful stage (a finished step, a green refactor, a new test suite). Small commits, short lowercase subjects, matching the existing history.
- **Consult before deciding.** Do not make decisions on your own — propose, explain the trade-off, wait for an answer. The only exception is genuinely obvious things (a typo, an unused import, a failing check caused by your own change).
- **Keep it simple.** Prefer plain, boring code over clever code. Go is the reference mindset:
  - plain data + plain functions; no classes, no abstraction layers "for later"
  - explicit loops and early returns when they read better than long method chains
  - small named functions instead of nested inline lambdas / IIFEs
  - fail loudly on unexpected input instead of silently defaulting to `0` or `""`
  - few dependencies; add one only when it clearly pays for itself

## Correctness is the product

Wrong numbers in a tax report are worse than no numbers. So:

- Extraction (`lib/extract.ts`) and calculation (`lib/uah.ts`, `lib/enrich.ts`) must be covered by tests, and every change there comes with tests.
- IBKR report layout depends on statement settings — the number and order of columns changes (e.g. "Profit and Loss: Realized P/L Only" removes `C. Price` and `MTM P/L`). A one-column shift silently produces completely wrong amounts. Treat column mapping with extreme care.
- Test fixtures live in `files/` and are **anonymized**. This repository is **public** — never commit a real statement, account id, name, or address.

## Commands

```bash
npm start            # dev server
npm run build        # production build to dist/
npm test             # vitest
```

## Domain notes

- Trade codes (`C`, `O`, `A`, `Ex`, `Ep`, ...) and the long/short UAH formulas are documented in comments at the top of `lib/extract.ts` and `lib/uah.ts` — read them before touching calculations.
- Assigned / exercised options are not taxable events; their economics move into the stock basis.
- NBU exchange rates are fetched through a Cloudflare worker proxy (`proxy.marchenko-alexandr.workers.dev`) to get around CORS.
