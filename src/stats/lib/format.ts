// Ported from optionslab app/stats/lib/format.ts. Amounts are USD, as in the statement.

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const dec2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const EMPTY = "—";

function isNumber(n: number | null): n is number {
  return n !== null && Number.isFinite(n);
}

export function formatUsd(n: number | null, fractionDigits: 0 | 2 = 0): string {
  if (!isNumber(n)) {
    return EMPTY;
  }
  return fractionDigits === 2 ? usd2.format(n) : usd0.format(n);
}

export function formatInt(n: number | null): string {
  return isNumber(n) ? int.format(n) : EMPTY;
}

const PERCENT = 100;

/** ratio input: 0.123 → "12.3%" */
export function formatPercent(n: number | null, fractionDigits: 0 | 1 = 1): string {
  if (!isNumber(n)) {
    return EMPTY;
  }
  return `${(fractionDigits === 0 ? int : dec1).format(n * PERCENT)}%`;
}

/** profit factor, payoff ratio: two decimals, "∞" when there was nothing to divide by */
export function formatRatio(n: number | null): string {
  if (n === null) {
    return EMPTY;
  }
  return Number.isFinite(n) ? dec2.format(n) : "∞";
}

/** compact signed USD for sentences: "+$500", "-$1.2k", "+$12k" */
export function formatSignedUsdShort(n: number | null): string {
  if (!isNumber(n)) {
    return EMPTY;
  }
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "+";
  if (abs >= THOUSAND) {
    return `${sign}$${(abs / THOUSAND).toFixed(abs >= TEN_THOUSAND ? 0 : 1)}k`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

const THOUSAND = 1000;
const TEN_THOUSAND = 10_000;

/** days, "12.5 дн." */
export function formatDays(n: number | null): string {
  return isNumber(n) ? `${dec1.format(n)} дн.` : EMPTY;
}

export type Tone = "good" | "bad" | "warn" | "muted";

const TONES: Record<Tone, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  bad: "text-destructive",
  warn: "text-amber-600 dark:text-amber-400",
  muted: "text-muted-foreground",
};

export function toneClass(tone: Tone): string {
  return TONES[tone];
}

/** positive P/L green, negative red */
export function pnlClass(value: number | null): string {
  if (!isNumber(value) || value === 0) {
    return "";
  }
  return value > 0 ? TONES.good : TONES.bad;
}

const shortDate = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-03-13" → "13 бер." */
export function formatShortDate(date: string): string {
  return shortDate.format(new Date(`${date}T00:00:00Z`));
}

/** "2026-03-13" → "13 бер. 2026 р." */
export function formatDate(date: string): string {
  return fullDate.format(new Date(`${date}T00:00:00Z`));
}

const shortMonth = new Intl.DateTimeFormat("uk-UA", { month: "short", timeZone: "UTC" });

/** "2026-03" → "бер. 2026" */
export function formatMonth(yearMonth: string): string {
  return `${shortMonth.format(new Date(`${yearMonth}-01T00:00:00Z`))} ${yearMonth.slice(0, "YYYY".length)}`;
}
