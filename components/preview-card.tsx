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
        <Codes document={document} />
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

function Codes({ document }: { document: Document }) {
  // extract codes from trades rows, note, we are simply extracting last cell, which not always contains code, but because we are filtering only known codes thats fine
  const extracted = Array.from(new Set(Array.from(document.querySelectorAll('div[id^="tblTransactions_"] table tbody tr td:last-child')).flatMap(el => el.textContent?.trim()?.split(';'))))
  if (!extracted?.length) return null;

  return <>
    <Section>Коди</Section>
    <table className="table-auto w-full">
      <tbody>
        {extracted.map((code) => ({ code, translation: translateCode(code) })).filter(({ translation }) => !!translation).map(({ code, translation }, index) => <tr key={index} className="border-t first:border-t-0">
          <Cell>{code}</Cell>
          <Cell>{translation}</Cell>
        </tr>)}
      </tbody>
    </table>
  </>
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

function translateCode(code: string | undefined) {
  if (!code) return "";
  const codes = [
    { "code": "A", "description": "Assignment", "translation": "Призначення (виконання опціону)" },
    { "code": "LT", "description": "Long Term P/L", "translation": "Довгостроковий прибуток/збиток" },
    { "code": "ADR", "description": "ADR Fee Accrual", "translation": "Нарахування комісії ADR" },
    { "code": "Lo", "description": "Direct Loan", "translation": "Пряма позика" },
    { "code": "AEx", "description": "Automatic exercise for dividend-related recommendation.", "translation": "Автоматичне виконання (експірація) за рекомендацією, пов’язаною з дивідендами" },
    { "code": "M", "description": "Entered manually by IB", "translation": "Введено вручну Interactive Brokers" },
    { "code": "AFx", "description": "AutoFX conversion resulting from trading", "translation": "Автоматична валютна конвертація внаслідок торгівлі" },
    { "code": "MEx", "description": "Manual exercise for dividend-related recommendation.", "translation": "Ручне виконання за рекомендацією, пов’язаною з дивідендами" },
    { "code": "Adj", "description": "Adjustment", "translation": "Коригування" },
    { "code": "ML", "description": "Maximize Losses tax basis election", "translation": "Податковий метод: максимізація збитків" },
    { "code": "Al", "description": "Allocation", "translation": "Розподіл" },
    { "code": "MLG", "description": "Maximize Long Term Gain tax basis election", "translation": "Податковий метод: максимізація довгострокового прибутку" },
    { "code": "Aw", "description": "Away Trade", "translation": "Угода поза основним ринком" },
    { "code": "MLL", "description": "Maximize Long Term Loss tax basis election", "translation": "Податковий метод: максимізація довгострокового збитку" },
    { "code": "B", "description": "Automatic Buy-in", "translation": "Автоматичне примусове закриття (buy-in)" },
    { "code": "MSG", "description": "Maximize Short Term Gain tax basis election", "translation": "Податковий метод: максимізація короткострокового прибутку" },
    { "code": "Bo", "description": "Direct Borrow", "translation": "Пряме запозичення" },
    { "code": "MSL", "description": "Maximize Short Term Loss tax basis election", "translation": "Податковий метод: максимізація короткострокового збитку" },
    { "code": "C", "description": "Closing Trade", "translation": "Закриваюча угода" },
    { "code": "O", "description": "Opening Trade", "translation": "Відкриваюча угода" },
    { "code": "CD", "description": "Cash Delivery", "translation": "Грошове постачання (розрахунок)" },
    { "code": "Off", "description": "Yes and No contracts offset to $1.00 cash settlement", "translation": "Контракти Yes/No взаємозаліковані до $1.00 грошового розрахунку" },
    { "code": "CP", "description": "Complex Position", "translation": "Складна позиція" },
    { "code": "P", "description": "Partial Execution", "translation": "Часткове виконання" },
    { "code": "Ca", "description": "Cancelled", "translation": "Скасовано" },
    { "code": "PE", "description": "Perpetual Investment", "translation": "Постійна інвестиція" },
    { "code": "Co", "description": "Corrected Trade", "translation": "Виправлена угода" },
    { "code": "PI", "description": "Price Improvement", "translation": "Покращення ціни" },
    { "code": "Cx", "description": "Part or all of this transaction was a Crossing executed as dual agent by IB for two IB customers", "translation": "Угода (частково або повністю) виконана як кросинг IB для двох клієнтів" },
    { "code": "PTA", "description": "Post Trade Allocation", "translation": "Розподіл після виконання угоди" },
    { "code": "DT", "description": "Discounted Trade", "translation": "Угода зі знижкою" },
    { "code": "Po", "description": "Interest or Dividend Accrual Posting", "translation": "Нарахування відсотків або дивідендів" },
    { "code": "De", "description": "Delivery or Conversion Action", "translation": "Поставка або конвертація" },
    { "code": "Pr", "description": "Part or all of this transaction was executed by the Exchange as a Crossing by IB against an IB affiliate and is therefore classified as a Principal and not an agency trade", "translation": "Угода (частково або повністю) виконана біржею як кросинг IB проти афілійованої сторони (principal угода)" },
    { "code": "ETF", "description": "ETF Creation/Redemption", "translation": "Створення/погашення ETF" },
    { "code": "R", "description": "Dividend Reinvestment", "translation": "Реінвестування дивідендів" },
    { "code": "Ep", "description": "Resulted from an Expired Position", "translation": "Виникло через експірацію позиції" },
    { "code": "RED", "description": "Redemption to Investor", "translation": "Погашення інвестору" },
    { "code": "Ex", "description": "Exercise", "translation": "Виконання опціону" },
    { "code": "RI", "description": "Recurring Investment", "translation": "Регулярна інвестиція" },
    { "code": "FP", "description": "The fractional portion of this trade was executed against IB or an affiliate.", "translation": "Дробова частина угоди виконана проти IB або афілійованої сторони" },
    { "code": "RP", "description": "IB acted as agent for the fractional share portion of this trade, which was executed by an IB affiliate as riskless principal.", "translation": "IB діяв як агент для дробової частини угоди, яка була виконана афілійованою стороною IB як безризикова угода" },
    { "code": "FPA", "description": "The fractional portion of this trade was executed against IB or an affiliate. IB acted as agent for the whole share portion of this trade.", "translation": "Дробова частина виконана проти IB; IB діяв як агент для повних акцій" },
    { "code": "RPA", "description": "IB acted as agent for both the fractional share portion and the whole share portion of this trade; the fractional share portion was executed by an IB Affiliate as riskless principal.", "translation": "IB діяв як агент для дробової та повної частини угоди; дробова частина виконана афілійованою стороною IB як безризикова угода" },
    { "code": "G", "description": "Trade in Guaranteed Account Segment", "translation": "Угода в сегменті гарантованого рахунку" },
    { "code": "Rb", "description": "Rebill", "translation": "Перевиставлення рахунку" },
    { "code": "GEA", "description": "Exercise or Assignment resulting from offsetting positions", "translation": "Виконання або призначення через взаємозалік позицій" },
    { "code": "Re", "description": "Interest or Dividend Accrual Reversal", "translation": "Сторнування нарахованих відсотків або дивідендів" },
    { "code": "HC", "description": "Highest Cost tax basis election", "translation": "Податковий метод: найвища собівартість" },
    { "code": "Ri", "description": "Reimbursement", "translation": "Відшкодування" },
    { "code": "HFI", "description": "Investment Transferred to Hedge Fund", "translation": "Інвестиція передана в хедж-фонд" },
    { "code": "S0", "description": "Contract settled to zero value", "translation": "Контракт закрито з нульовою вартістю" },
    { "code": "HFR", "description": "Redemption from Hedge Fund", "translation": "Погашення з хедж-фонду" },
    { "code": "S1", "description": "Contract settled to $1.00", "translation": "Контракт закрито за $1.00" },
    { "code": "I", "description": "Internal Transfer", "translation": "Внутрішній переказ" },
    { "code": "SF", "description": "Trade is subject to IBKR Lite Surcharge Fee if volume of such trades exceeds 10% of the total monthly Lite trade volume", "translation": "Угода підлягає додатковій комісії IBKR Lite при перевищенні 10% обсягу" },
    { "code": "IA", "description": "The transaction was executed against IB or an affiliate", "translation": "Угода виконана проти IB або афілійованої сторони" },
    { "code": "SI", "description": "This order was solicited by Interactive Brokers", "translation": "Ордер ініційовано Interactive Brokers" },
    { "code": "IM", "description": "A portion of the order was executed against IB or an affiliate; IB acted as agent on a portion.", "translation": "Частина ордера виконана проти IB; IB діяв як агент для іншої частини" },
    { "code": "SL", "description": "Specific Lot tax basis election", "translation": "Податковий метод: конкретні лоти" },
    { "code": "INV", "description": "Investment Transfer from Investor", "translation": "Переказ інвестиції від інвестора" },
    { "code": "SO", "description": "This order was marked as solicited by your Introducing Broker", "translation": "Ордер позначений як ініційований вашим Introducing Broker" },
    { "code": "IPO", "description": "This transaction was executed as part of an IPO in which IB was a member of the selling group and is classified as a Principal trade.", "translation": "Угода виконана в рамках IPO як principal (IB — учасник розміщення)" },
    { "code": "SS", "description": "Customer designated this trade for shortened settlement and so is subject to execution at prices above the prevailing market", "translation": "Клієнт обрав скорочений розрахунок, можливе виконання за гіршою ціною" },
    { "code": "L", "description": "Ordered by IB (Margin Violation)", "translation": "Примусова дія IB (порушення маржі)" },
    { "code": "ST", "description": "Short Term P/L", "translation": "Короткостроковий прибуток/збиток" },
    { "code": "LD", "description": "Adjusted by Loss Disallowed from Wash Sale", "translation": "Скориговано через правило wash sale" },
    { "code": "T", "description": "Transfer", "translation": "Переказ" },
    { "code": "LF", "description": "Liquidation of fractional position by IB", "translation": "Ліквідація дробової позиції IB" },
    { "code": "Un", "description": "Unvested shares from stock grant", "translation": "Невестовані акції (stock grant)" },
    { "code": "LI", "description": "Last In, First Out (LIFO) tax basis election", "translation": "Податковий метод: LIFO (останній прийшов — перший пішов)" },
    { "code": "XCH", "description": "Mutual Fund Exchange Transaction", "translation": "Обмін пайових фондів" }
  ]
  const found = codes.find(c => c.code === code);
  if (!found) return "";
  return found.translation;
}
