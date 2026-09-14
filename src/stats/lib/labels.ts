// Ukrainian labels of setup buckets and tags

const SENTIMENTS: Record<string, string> = {
  bullish: "бичачі",
  bearish: "ведмежі",
  neutral: "нейтральні",
  directional: "напрямлені",
  income: "на дохід",
  unknown: "невизначені",
};

const HOLDING_DAYS: Record<string, string> = {
  "same-day": "в той самий день",
  "1-7d": "1–7 днів",
  "8-21d": "8–21 день",
  "22-45d": "22–45 днів",
  "46d+": "46+ днів",
};

export function sentimentLabel(sentiment: string) {
  return SENTIMENTS[sentiment] ?? sentiment;
}

export function holdingDaysLabel(bucket: string) {
  return HOLDING_DAYS[bucket] ?? bucket;
}
