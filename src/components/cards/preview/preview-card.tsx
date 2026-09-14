import type { Statement } from "@/lib/statement";
import { Button } from "../../ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { AccountSection } from "./account-section";
import { CodesSection } from "./codes-section";
import { DividendsSection } from "./dividends-section";
import { TradesSection } from "./trades-section";
import { translatePeriod } from "./translations";
import { WithholdingSection } from "./withholding-section";

/** Translated printable copy of the statement, attached to the declaration as proving document */
export function PreviewCard({ statement }: { statement: Statement }) {
  const { document } = statement;

  const period = document.querySelector("p.text-title span")?.textContent;
  const generated = Array.from(document.querySelectorAll("p.text-center.text-gray"))
    .map((p) => p.textContent)
    .find((p) => p.startsWith("Generated: "))
    ?.replace("Generated: ", "Згенеровано: ");

  // consider: we might use `print:break-before-page` for sections to be printed on separate pages

  return (
    <Card className="print:p-0 print:shadow-none print:ring-0">
      <CardHeader className="print:hidden">
        <CardTitle>Попередній перегляд звіту</CardTitle>
        <CardDescription>Попередній перегляд сформованного та перекладеного звіту для податкової</CardDescription>
        <CardAction>
          <Button onClick={() => globalThis.print()}>Завантажити PDF</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="print:p-0">
        <div className="space-y-4 border p-4 print:border-none print:p-0">
          <div className="flex items-center justify-between">
            <img src="https://www.interactivebrokers.com/images/common/logos/ibkr/interactive-brokers.svg" width="220" height="34" alt="Interactive Brokers" />
            <div>
              <div className="text-lg">Звіт про діяльність</div>
              <div>{translatePeriod(period)}</div>
            </div>
          </div>
          <div className="text-center text-sm">Interactive Brokers LLC, Two Pickwick Plaza, Greenwich, CT 06830</div>
          <AccountSection document={document} />
          <TradesSection document={document} />
          <div className="grid grid-cols-2 gap-4">
            <DividendsSection document={document} />
            <WithholdingSection document={document} />
          </div>
          <CodesSection document={document} />
          <div className="text-center text-xs">{generated}</div>
        </div>
      </CardContent>
    </Card>
  );
}
