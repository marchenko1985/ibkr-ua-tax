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

/** Monday first, keys as in Setup.openWeekday */
export const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WEEKDAYS: Record<string, string> = { Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Нд" };

export function weekdayLabel(weekday: string) {
  return WEEKDAYS[weekday] ?? weekday;
}

const LEG_COUNTS: Record<string, string> = { "1": "1 нога", "2": "2 ноги", "3": "3 ноги", "4+": "4+ ноги" };

export function legCountLabel(bucket: string) {
  return LEG_COUNTS[bucket] ?? bucket;
}
