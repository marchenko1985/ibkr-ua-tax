import type { Problem } from "@/lib/validate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

/** Shown instead of calculations when the statement was built with wrong settings */
export function InvalidStatementCard({ problems }: { problems: Problem[] }) {
  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Звіт сформовано з неправильними налаштуваннями</CardTitle>
        <CardDescription>Розрахунки з такого звіту будуть неправильними, тому ми їх не показуємо.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          Відредагуйте звіт у розділі <b>Custom Statements</b> кабінету IBKR та змініть налаштування:
        </p>
        <ul className="list-inside list-disc space-y-1">
          {problems.map((problem) => (
            <li key={problem.setting}>
              <b>
                {problem.setting}: {problem.expected}
              </b>{" "}
              — {problem.reason}
            </li>
          ))}
        </ul>
        <p>Після цього сформуйте звіт заново та завантажте його. Повна інструкція нижче.</p>
      </CardContent>
    </Card>
  );
}
