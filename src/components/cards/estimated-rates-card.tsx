import type { Statement } from "@/lib/statement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function EstimatedRatesCard({ statement }: { statement: Statement }) {
  const dates = estimatedRateDates(statement);
  if (dates.length === 0) {
    return null;
  }

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Увага: курси НБУ</CardTitle>
        <CardDescription>Для деяких дат курс НБУ відсутній, тож його було оцінено.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>НБУ не встановив курс на ці дати — використано середнє між курсами найближчого попереднього та наступного дня.</p>
        <p>
          Дати: <b>{dates.join(", ")}</b>
        </p>
        <p>
          Такі курси в таблиці позначені <span className="text-yellow-600">жовтим кольором та зірочкою*</span>. Перевірте їх перед поданням звіту.
        </p>
      </CardContent>
    </Card>
  );
}

/** Unique sorted dates of estimated rates used by taxable trades and dividends */
function estimatedRateDates({ trades, dividends }: Statement) {
  const dates: string[] = [];
  for (const trade of trades.filter((t) => !(t.is_assignment || t.is_exercise))) {
    if (trade.open_rate_estimated) {
      dates.push(trade.open_date);
    }
    if (trade.close_rate_estimated) {
      dates.push(trade.close_date);
    }
  }
  for (const dividend of dividends.filter((d) => d.rate_estimated)) {
    dates.push(dividend.date);
  }
  return Array.from(new Set(dates)).sort();
}
