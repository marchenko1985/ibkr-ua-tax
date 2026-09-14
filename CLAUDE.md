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

- Extraction (`src/lib/extract.ts`) and calculation (`src/lib/uah.ts`, `src/lib/enrich.ts`) must be covered by tests, and every change there comes with tests.
- IBKR report layout depends on statement settings — the number and order of columns changes (e.g. "Profit and Loss: Realized P/L Only" removes `C. Price` and `MTM P/L`). A one-column shift silently produces completely wrong amounts. Treat column mapping with extreme care.
- A statement built with wrong settings is rejected before anything is calculated (`validateStatement`), and `extract` refuses trades columns other than `TRADES_HEADERS`. Never relax these checks to "make a report work" — ask first.
- Test fixtures live in `files/` and are **anonymized** with `npm run anonymize -- <input> <output>`, big statements are cut down to representative symbols with `npm run trim -- <input> <output> "<symbols>"`. `files/settings/` holds the same days built with different statement settings, one file per wrong setting. This repository is **public** — never commit a real statement, account id, name, or address.

## Architecture

```
src/
  App.tsx                      reads uploaded file → parseStatement → loadStatement → <StatementCards>
  lib/                         pure logic, no React, covered by tests (*.test.ts next to the code)
    statement.ts               Statement = { document, trades, dividends }; one NBU request for all dates
    validate.ts                statement settings check; wrong settings → no calculations, list of settings to fix
    extract.ts                 trades (closed lots) from the statement HTML
    dividends.ts               dividends, taxed on gross amount (withholding tax ignored)
    rates.ts                   NBU rates: fetch, parse, rateFor (average of sibling days when missing)
    enrich.ts, uah.ts          rates + USD/UAH values of trades
    totals.ts                  totals and taxes
  components/
    cards/statement-cards.tsx  the list of cards shown for a loaded statement
    cards/<card>/              one folder (or file) per card
    ui/                        vendored shadcn components
  stats/                       optional options statistics, see below
    stats-section.tsx          the only entry point, rendered last in statement-cards.tsx
    stats-cards.tsx            list of stat cards, one line per card
    lib/setups.ts              closed option lots → setups (legs opened together)
    lib/metrics/               pure metric functions, tested
    lib/strategies/            strategy detector vendored from optionslab (not linted, own spec)
    cards/                     one file per card
```

- **Cards are modules.** Every card is `({ statement }: { statement: Statement })`, decides itself whether it has something to render, and is added or removed with one line in `statement-cards.tsx`. Cards do not fetch or parse — anything computed from the statement goes to `lib/` with tests.
- Rows rendered from the statement use stable ids (position in the statement), never array indexes, as React keys.
- **Stats are an optional module** ported from optionslab `app/stats` (its README documents every metric). The app must not depend on `src/stats` except `StatsSection` in `statement-cards.tsx` — enforced by Biome `noRestrictedImports`; removing stats is deleting the folder and that line. Setups: options only, assigned/exercised options skipped, legs grouped by underlying + open date (no open time in the statement). Cards needing external data (sector, beta, SPY) or open time are not ported.

## Commands

```bash
npm start              # dev server
npm run build          # production build to dist/
npm test               # vitest
npm run lint           # biome: lint + formatting, warnings fail too
npm run format         # biome auto-fix
npm run typecheck      # tsc
npm run unused         # knip: unused files, exports, dependencies
npm run dedup          # jscpd: copy-paste report
npm run housekeeping   # outdated deps, audit, unused, dedup, lint — run from time to time
npm run upgrade        # bump all dependencies to latest, including majors
```

## Checks

`git push` runs a lefthook pre-push gate (`lefthook.yml`): lint, typecheck, tests and knip on the whole project, ~2s. GitHub Actions runs the same checks before deploying to Pages. No pre-commit hooks — commit freely mid-task. When the gate fails, fix the errors; never bypass it with `--no-verify` or `LEFTHOOK=0`.

- Biome (`biome.jsonc`) starts from **all** rules (`"preset": "all"`) plus picked nursery rules; every rule turned off has a comment with the reason. Don't turn rules off or add `biome-ignore` without agreeing first.
- Complexity limits: 80 lines per function, cognitive complexity 20, 400 lines per file, 5 params. Tests are exempt. Temporary per-file exceptions are marked `TODO` in `biome.jsonc` and must go away.
- TypeScript is strict, including `noUncheckedIndexedAccess`.
- `src/components/ui/` holds vendored shadcn components (base-ui) — excluded from Biome, knip and jscpd; refresh them with `npx shadcn@latest add --overwrite <names>` instead of editing, then check the app in the browser. Adapt our code to changed components, not the other way around (e.g. multi-line tooltips are wrapped in `TooltipLines`, because `TooltipContent` lays children out in a row). Class names are merged with `cn` from the `cn` package, same as in the vendored components.
- No React Compiler (dropped with `@vitejs/plugin-react` 6); memoize by hand only where it matters.

## Domain notes

- Trade codes (`C`, `O`, `A`, `Ex`, `Ep`, ...) and the long/short UAH formulas are documented in comments at the top of `src/lib/extract.ts` and `src/lib/uah.ts` — read them before touching calculations.
- Assigned / exercised options are not taxable events; their economics move into the stock basis.
- Rates (Tax Code, checked on zakon.rada.gov.ua, edition 31.05.2026): trades 18% ПДФО (167.1), dividends from non-residents 9% (167.5.4, 170.11.1 "а"), military levy 5% on both (p. 16-1 subsection 10 section XX).
- Dividends are taxed on the gross amount at the NBU rate of the accrual date (164.4). Tax withheld abroad is ignored: crediting it needs a legalized certificate from the foreign tax authority (13.5, 170.11.2), a broker statement is not one. So the guide does not ask for the Withholding Tax section and the preview does not show it.
- The original English IBKR statement is always attached to the declaration; the translated preview is an optional extra copy for inspectors who ask for it, not a notarized translation.
- NBU exchange rates are fetched through a Cloudflare worker proxy (`proxy.marchenko-alexandr.workers.dev`) to get around CORS.
