import type { Trade } from "@/lib/extract";
import { detectType, type OptionContract } from "./strategies/detectType";

/**
 * A closed option position: legs opened together, possibly closed at different times.
 *
 * Ported from optionslab `app/stats/lib/flex.ts` (EnrichedClosedSetup), keeping field names so
 * metrics port unchanged. Fields depending on data an IBKR statement does not have (open time,
 * sector, beta, account) are dropped.
 */
export interface Setup {
  /** underlying + open date, stable identity for UI */
  setupId: string;
  underlyingSymbol: string;

  /** YYYY-MM-DD, statement closed lots have no open time */
  openDate: string;
  /** YYYY-MM-DD of the last closing trade */
  closeDate: string;
  /** "YYYY-MM-DDTHH:MM:SS" of the last closing trade, statement (exchange) time */
  closedAt: string;
  openYearMonth: string;
  closeYearMonth: string;
  openWeekday: Weekday;
  closeWeekday: Weekday;

  /** whole calendar days between open and last close */
  holdingDays: number;
  holdingDaysBucket: HoldingDaysBucket;

  /** debit (paid to open) > 0, credit (received to open) < 0 */
  openNetValue: number;
  closeNetValue: number;
  /** net of commissions */
  realizedPnl: number;
  /** realizedPnl / |openNetValue| */
  returnOnOpenNetValue: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isFlat: boolean;
  isCredit: boolean;
  isDebit: boolean;

  legCount: number;
  legCountBucket: LegCountBucket;
  hasMultipleLegs: boolean;

  /** YYYY-MM-DD */
  minExpiry: string;
  maxExpiry: string;
  expiryCount: number;
  singleExpiry: boolean;
  /** puts only, calls only, or both (straddles, condors) */
  putCall: "puts" | "calls" | "mixed";
  dteAtOpenMin: number;
  dteAtOpenMax: number;
  dteAtOpenBucket: DteBucket;

  strategyName: string;
  strategySlug: string;
  strategySentiment: readonly string[];
  strategyCategory: string;

  items: Trade[];
}

type Weekday = (typeof WEEKDAYS)[number];
type HoldingDaysBucket = (typeof HOLDING_DAYS_BUCKETS)[number]["label"];
type DteBucket = (typeof DTE_BUCKETS)[number]["label"];
type LegCountBucket = (typeof LEG_COUNT_BUCKETS)[number]["label"];

/** Buckets in display order, a value goes to the first bucket with max >= value */
export const HOLDING_DAYS_BUCKETS = [
  { label: "same-day", max: 0 },
  { label: "1-7d", max: 7 },
  { label: "8-21d", max: 21 },
  { label: "22-45d", max: 45 },
  { label: "46d+", max: Number.POSITIVE_INFINITY },
] as const;

export const DTE_BUCKETS = [
  { label: "0", max: 0 },
  { label: "1-7", max: 7 },
  { label: "8-21", max: 21 },
  { label: "22-45", max: 45 },
  { label: "46-90", max: 90 },
  { label: "90+", max: Number.POSITIVE_INFINITY },
] as const;

export const LEG_COUNT_BUCKETS = [
  { label: "1", max: 1 },
  { label: "2", max: 2 },
  { label: "3", max: 3 },
  { label: "4+", max: Number.POSITIVE_INFINITY },
] as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
/** shares per equity option contract, the statement does not show it */
const CONTRACT_MULTIPLIER = 100;
const DAY_MS = 86_400_000;

/** WMT 17OCT25 92.5 P — underlying, expiration day/month/year, strike, put or call */
const OPTION_SYMBOL = /^(\S+)\s+(\d{2})([A-Z]{3})(\d{2})\s+(\d+(?:\.\d+)?)\s+([CP])$/;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

interface OptionSymbol {
  underlying: string;
  /** YYYY-MM-DD */
  expiry: string;
  strike: number;
  type: "call" | "put";
}

/**
 * Closed option setups for statistics.
 *
 * Only options are taken; assigned or exercised options are skipped — their P/L is 0 in the
 * statement because their economics moved into the stock. Legs are grouped by underlying and open
 * date: the statement has no open time, so unrelated positions on the same underlying opened the
 * same day become one setup.
 */
export function buildSetups(trades: readonly Trade[]): Setup[] {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades.filter((t) => t.is_option && !(t.is_assignment || t.is_exercise))) {
    const key = `${parseOptionSymbol(trade.symbol).underlying}:${trade.open_date}`;
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }

  return [...groups.entries()].map(([key, items]) => toSetup(key, items)).sort((a, b) => a.openDate.localeCompare(b.openDate) || a.setupId.localeCompare(b.setupId));
}

function parseOptionSymbol(symbol: string): OptionSymbol {
  const match = OPTION_SYMBOL.exec(symbol);
  const [, underlying, day, month, year, strike, putCall] = match ?? [];
  const monthIndex = MONTHS.indexOf(month ?? "");
  if (!(underlying && day && year && strike && putCall) || monthIndex === -1) {
    throw new Error(`Unexpected option symbol: ${symbol}`);
  }
  return {
    underlying,
    expiry: `20${year}-${String(monthIndex + 1).padStart("MM".length, "0")}-${day}`,
    strike: Number(strike),
    type: putCall === "C" ? "call" : "put",
  };
}

function toSetup(setupId: string, items: Trade[]): Setup {
  const legs = items.map((item) => ({ item, option: parseOptionSymbol(item.symbol) }));
  const [first] = legs;
  if (!first) {
    throw new Error(`Empty setup ${setupId}`);
  }

  const openDate = first.item.open_date;
  const closedAt =
    items
      .map(closedAtOf)
      .sort((a, b) => a.localeCompare(b))
      .at(-1) ?? "";
  const closeDate = closedAt.slice(0, "YYYY-MM-DD".length);
  const expiries = [...new Set(legs.map((leg) => leg.option.expiry))].sort((a, b) => a.localeCompare(b));
  const dtes = expiries.map((expiry) => daysBetween(openDate, expiry));
  const holdingDays = daysBetween(openDate, closeDate);
  const legCount = new Set(items.map((item) => item.symbol)).size;

  return {
    setupId,
    underlyingSymbol: first.option.underlying,
    openDate,
    closeDate,
    closedAt,
    openYearMonth: openDate.slice(0, "YYYY-MM".length),
    closeYearMonth: closeDate.slice(0, "YYYY-MM".length),
    openWeekday: weekdayOf(openDate),
    closeWeekday: weekdayOf(closeDate),
    holdingDays,
    holdingDaysBucket: bucketOf(HOLDING_DAYS_BUCKETS, holdingDays),
    ...values(items),
    legCount,
    legCountBucket: bucketOf(LEG_COUNT_BUCKETS, legCount),
    hasMultipleLegs: legCount > 1,
    minExpiry: expiries.at(0) ?? "",
    maxExpiry: expiries.at(-1) ?? "",
    expiryCount: expiries.length,
    singleExpiry: expiries.length === 1,
    putCall: putCallOf(legs.map((leg) => leg.option.type)),
    dteAtOpenMin: Math.min(...dtes),
    dteAtOpenMax: Math.max(...dtes),
    dteAtOpenBucket: bucketOf(DTE_BUCKETS, Math.min(...dtes)),
    ...strategy(legs, openDate),
    items,
  };
}

/** P/L and cash flow values of a setup, see Setup for sign conventions */
function values(items: readonly Trade[]) {
  const openNetValue = items.reduce((acc, item) => acc + item.open_basis, 0);
  const realizedPnl = items.reduce((acc, item) => acc + item.open_realized, 0);
  return {
    openNetValue,
    closeNetValue: openNetValue + realizedPnl,
    realizedPnl,
    returnOnOpenNetValue: openNetValue === 0 ? null : realizedPnl / Math.abs(openNetValue),
    isWinner: realizedPnl > 0,
    isLoser: realizedPnl < 0,
    isFlat: realizedPnl === 0,
    isCredit: openNetValue < 0,
    isDebit: openNetValue > 0,
  };
}

/** Strategy of the setup legs, lots of the same contract are summed into one leg */
function strategy(legs: readonly { item: Trade; option: OptionSymbol }[], openDate: string) {
  const contracts = new Map<string, OptionContract>();
  for (const { item, option } of legs) {
    const contract = contracts.get(item.symbol);
    if (contract) {
      contract.position += item.open_quantity;
    } else {
      contracts.set(item.symbol, { type: option.type, position: item.open_quantity, strike: option.strike, dte: daysBetween(openDate, option.expiry), multiplier: CONTRACT_MULTIPLIER });
    }
  }
  const detected = detectType([...contracts.values()]);
  return {
    strategyName: detected.name,
    strategySlug: detected.slug,
    strategySentiment: detected.sentiment,
    strategyCategory: detected.category,
  };
}

function putCallOf(types: readonly OptionSymbol["type"][]): Setup["putCall"] {
  if (types.every((type) => type === "put")) {
    return "puts";
  }
  return types.every((type) => type === "call") ? "calls" : "mixed";
}

/** "2026-03-13, 11:41:16" → "2026-03-13T11:41:16" */
function closedAtOf(item: Trade) {
  return item.close_datetime.replace(", ", "T");
}

/** whole calendar days from one YYYY-MM-DD to another */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function weekdayOf(date: string): Weekday {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "Sun";
}

function bucketOf<T extends { label: string; max: number }>(buckets: readonly T[], value: number): T["label"] {
  const bucket = buckets.find((b) => value <= b.max) ?? buckets.at(-1);
  if (!bucket) {
    throw new Error("No buckets");
  }
  return bucket.label;
}
