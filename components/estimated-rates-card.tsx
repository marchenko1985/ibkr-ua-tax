import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function EstimatedRatesCard({ title, dates }: { title: string; dates: string[] }) {
  const unique = Array.from(new Set(dates)).sort();
  if (unique.length === 0) {
    return null;
  }

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Увага: {title}</CardTitle>
        <CardDescription>Для деяких дат курс НБУ відсутній, тож його було оцінено.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>НБУ не встановив курс на ці дати — використано середнє між курсами найближчого попереднього та наступного дня.</p>
        <p>
          Дати: <b>{unique.join(", ")}</b>
        </p>
        <p>
          Такі курси в таблиці позначені <span className="text-yellow-600">жовтим кольором та зірочкою*</span>. Перевірте їх перед поданням звіту.
        </p>
      </CardContent>
    </Card>
  );
}
