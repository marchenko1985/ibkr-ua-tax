import { ReactNode } from "react";
import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";

export function PreviewCard({ document }: { document: Document | null | undefined }) {
  if (!document) return null;

  const period = document.querySelector("p.text-title span")?.textContent; // translate month names
  const generated = Array.from(document.querySelectorAll('p.text-center.text-gray')).map(p => p.textContent).find(p => p?.startsWith('Generated: '))?.replace("Generated: ", "Згенеровано: ");

  // consider: we might use `print:break-before-page` for sections to be printed on separate pages

  return <Card className="print:shadow-none print:ring-0 print:p-0">
    <CardHeader className="print:hidden">
      <CardTitle>Попередній перегляд звіту</CardTitle>
      <CardDescription>Попередній перегляд сформованного та перекладеного звіту для податкової</CardDescription>
      <CardAction>
        <Button onClick={() => window.print()}>Завантажити PDF</Button>
      </CardAction>
    </CardHeader>
    <CardContent className="print:p-0">
      <div className="p-4 space-y-4 border print:border-none print:p-0">
        <div className="flex items-center justify-between">
          <img src="https://www.interactivebrokers.com/images/common/logos/ibkr/interactive-brokers.svg" width="220" alt="Interactive Brokers" />
          <div>
            <div className="text-lg">
              {/* Activity Statement */}
              Звіт про діяльність
            </div>
            <div>{translatePeriod(period)}</div>
          </div>
        </div>
        <div className="text-center text-sm">Interactive Brokers LLC, Two Pickwick Plaza, Greenwich, CT 06830</div>
        <Account document={document} />
        <Trades document={document} />
        <div className="grid grid-cols-2 gap-4">
          <Dividends document={document} />
          <WithholdingTax document={document} />
        </div>
        <div className="text-center text-xs">{generated}</div>
      </div>
    </CardContent>
  </Card>
}

function Account({ document }: { document: Document }) {
  const account = Array.from(document.querySelectorAll('div[id^="tblAccountInformation_"] table tr')).map(tr => ({
    key: tr.querySelector('td:nth-child(1)')?.textContent,
    val: tr.querySelector('td:nth-child(2)')?.textContent,
  }))
  if (!account?.length) return null;

  return <>
    <Section>Інформація про аккаунт</Section>
    <table className="table-auto w-full">
      <tbody>
        {account.filter(item => !item.key?.startsWith("Address")).map((item, index) => <tr key={index} className="border-t first:border-t-0">
          <Cell>{translateAccount(item.key)}</Cell>
          <Cell>{translateAccount(item.val)}</Cell>
        </tr>)}
      </tbody>
    </table>
  </>
}

function Trades({ document }: { document: Document }) {
  const rows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('div[id^="tblTransactions_"] table tbody tr'))
  if (!rows?.length) return null;

  return <>
    <Section>
      Угоди
      {/* Trades */}
    </Section>
    <table className="table-auto w-full">
      <thead>
        <tr className="border-b">
          <Cell>
            Символ
            {/* Symbol */}
          </Cell>
          <Cell>
            Дата/Час
            {/* Date/Time */}
          </Cell>
          <Cell>
            Біржа
            {/* Exchange */}
          </Cell>
          <Cell>
            Кількість
            {/* Quantity */}
          </Cell>
          <Cell>
            Ціна
            {/* T. Price */}
          </Cell>
          <Cell>
            Виручка
            {/* Proceeds */}
          </Cell>
          <Cell>
            Комісія/Плата
            {/* Comm/Fee */}
          </Cell>
          <Cell>
            База
            {/* Basis */}
          </Cell>
          <Cell>
            Реалізований прибуток/збиток
            {/* Realized P/L */}
          </Cell>
          <Cell>
            Код
            {/* Code */}
          </Cell>
        </tr>
      </thead>
      <tbody>
        {rows.map((tr, index) => <TradesTableRow key={index} tr={tr} />)}
      </tbody>
    </table>
  </>
}

function TradesTableRow({ tr }: { tr: HTMLTableRowElement }) {
  if (!tr) return null;

  const cells = Array.from(tr.querySelectorAll("td"));
  const isTotal = cells.at(0)?.textContent?.startsWith("Total");

  return <tr className="border-t first:border-t-0">
    {cells.map((td, index) => <Cell className={cn(cells.length === 1 && "bg-secondary", isTotal && "bg-secondary font-semibold", index >= 3 && "text-right", isTotal && index > 0 && "text-right")} key={index} colSpan={td.colSpan}>{td.textContent?.replace("Total", "Загалом")?.replace("Closed Lot:", "Закрита позиція:")?.replace("Equity and Index Options", "Опціони на акції та індекси")?.replace("Stocks", "Акції")?.replace("USD", "Долар США")}</Cell>)}
  </tr>
}

function Dividends({ document }: { document: Document }) {
  const rows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr'))
  if (!rows?.length) return null;
  return <div className="space-y-4">
    <Section>Дивіденди</Section>
    <table className="table-auto w-full">
      <thead>
        <tr className="border-b">
          <Cell>Дата</Cell>
          <Cell>Опис</Cell>
          <Cell>Сума</Cell>
        </tr>
      </thead>
      <tbody>
        {rows.map((tr, index) => <tr key={index} className={cn("border-t first:border-t-0", index === 0 && "bg-secondary", index === rows.length - 1 && "bg-secondary font-semibold")}>
          {Array.from(tr.querySelectorAll("td")).map((td, tdIndex) => <Cell key={tdIndex} className={cn(tdIndex === 2 && "text-right")} colSpan={td.colSpan}>{td.textContent?.replace("USD", "Долар США")?.replace("Total", "Загалом")}</Cell>)}
        </tr>)}
      </tbody>
    </table>
  </div>
}

function WithholdingTax({ document }: { document: Document }) {
  const rows: HTMLTableRowElement[] = Array.from(document.querySelectorAll('div[id^="tblWithholdingTax_"] table tbody tr'))
  if (!rows?.length) return null;

  // NOTE: somehow IBKR passes withdrawals for previous year, so we are going to filter them, also, we should manually count total
  const dividends = Array.from(document.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr')).slice(1, -1).map(tr => ({
    date: tr.querySelector('td:nth-child(1)')?.textContent,
    identifier: tr.querySelector('td:nth-child(2)')?.textContent?.split(' (')?.shift()
  })).filter((item): item is { date: string; identifier: string } => !!item.date && !!item.identifier);

  const filteredRows = rows.slice(1, -1).filter(row => {
    const date = row.querySelector('td:nth-child(1)')?.textContent;
    const identifier = row.querySelector('td:nth-child(2)')?.textContent;
    return !!date && !!identifier && dividends.some(div => div.date === date && identifier.startsWith(div.identifier));
  })

  const total = filteredRows.reduce((acc, row) => {
    const amount = Number(row.querySelector('td:nth-child(3)')?.textContent?.replaceAll(",", ""));
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return <div className="space-y-4">
    <Section>
      Утриманий податок
    </Section>
    <table className="table-auto w-full">
      <thead>
        <tr className="border-b">
          <Cell>Дата</Cell>
          <Cell>Опис</Cell>
          <Cell>Сума</Cell>
          <Cell>Код</Cell>
        </tr>
      </thead>
      <tbody>
        <tr>
          <Cell className="bg-secondary" colSpan={4}>Долар США</Cell>
        </tr>
        {filteredRows.map((tr, index) => <tr key={index} className="border-t">
          {Array.from(tr.querySelectorAll("td")).map((td, tdIndex) => <Cell key={tdIndex} className={cn(tdIndex === 2 && "text-right")} colSpan={td.colSpan}>{td.textContent}</Cell>)}
        </tr>)}
        <tr>
          <Cell className="bg-secondary font-semibold" colSpan={2}>Загалом</Cell>
          <Cell className="bg-secondary font-semibold text-right">{total.toFixed(2)}</Cell>
          <Cell className="bg-secondary">
            <></>
          </Cell>
        </tr>
      </tbody>
    </table>
  </div>
}

function Cell({ children, className, colSpan }: { children: ReactNode, className?: string, colSpan?: number }) {
  return <td className={cn("break-words text-xs align-top border-l first:border-l-0 py-0 px-0.5", className)} colSpan={colSpan}>{children}</td>
}

function Section({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={cn("text-lg bg-secondary text-secondary-foreground border px-2 py-1 rounded", className)}>{children}</div>
}

function translatePeriod(period: string | undefined) {
  if (!period) return "";

  const months: Record<string, string> = {
    "January": "Січень",
    "February": "Лютий",
    "March": "Березень",
    "April": "Квітень",
    "May": "Травень",
    "June": "Червень",
    "July": "Липень",
    "August": "Серпень",
    "September": "Вересень",
    "October": "Жовтень",
    "November": "Листопад",
    "December": "Грудень",
  }

  for (const en of Object.keys(months)) {
    period = period.replaceAll(en, months[en])
  }

  return period
}


function translateAccount(str: string | undefined) {
  if (!str) return "";

  const accounts: Record<string, string> = {
    "Individual": "Індивідуальний",
    "Joint": "Спільний",
    "IRA": "IRA",
    "Trust": "Траст",
    "Other": "Інший",
    // ---
    "Margin": "Маржинальний",
    "Cash": "Готівковий",
    "USD": "Долар США",
    // ---
    "Name": "Ім'я",
    "Account Alias": "Псевдонім аккаунта",
    "Address of Account Holder(s)": "Адреса власника(ов) аккаунта",
    "Account Type": "Тип аккаунта",
    "Customer Type": "Тип клієнта",
    "Account Capabilities": "Можливості аккаунта",
    "Base Currency": "Базова валюта"
  }

  for (const en of Object.keys(accounts)) {
    str = str.replaceAll(en, accounts[en])
  }

  return str;
}
