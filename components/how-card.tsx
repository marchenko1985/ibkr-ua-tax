import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function HowCard() {
  return <Card className="print:hidden">
    <CardHeader>
      <CardTitle>Як сформувати звіт</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <ol className="list-decimal list-inside space-y-2">
        <li>Переходимо у розділ <b>Performance & Reports / Statements</b> в кабінеті IBKR.</li>
        <li>У секції <b>Custom Statements</b> клікаємо на кнопочку плюсика за для створення нового звіту.</li>
        <li><b>Statement Name</b> вводимо назву звіту, наприклад: <b>yearly_tax_report</b>.</li>
        <li><b>Statement Type</b> залишаємо значення за замовчуванням <b>Activity Statement</b>.</li>
        <li>У розділі <b>Default Sections</b> відмічаємо наступні секції:
          <ul className="list-disc list-inside ml-4">
            <li><b>Account Information</b> - інформація про рахунок</li>
            <li><b>Trades</b> - інформація про угоди</li>
            <li><b>Combined Dividends</b> - загальна інформація по всім дивідендам</li>
            <li><b>Withholding Tax</b> - інформація про утриманий податок США</li>
          </ul>
        </li>
        <li>У розділі <b>Section Configurations</b> виставляємо наступні параметри:
          <ul className="list-disc list-inside ml-4">
            <li><b>Profit and Loss: Realized P/L Only</b> - просимо показувати лише фактично реалізований прибуток/збиток.</li>
            <li><b>Breakout Positions into Long and Short?: No</b> - залишаємо за замовчуванням.</li>
            <li><b>Combine by Underlying (MTD/YTD only)?: No</b> - залишаємо за замовчуванням.</li>
            <li><b>Display Canceled Trades?: No</b> - залишаємо за замовчуванням.</li>
            <li><b>Display Closing Trades Only?: Yes</b> - це потрібно, щоб показувати лише закриті угоди, інакше у звіті будуть показані усі угоди, включно з покупкою акцій - а це нам не потрібно.</li>
            <li><b>Group Buys and Sells per Symbol in Trades Section?: No</b> - залишаємо за замовчуванням.</li>
            <li><b>Hide Details for Positions, Trades and Client Fees Sections?: No</b> - переключаємо на No, ця опція додає до звіту інформацію про закриваємі лоти з датою їх покупки, що необхідно для розрахунку курсових різниць.</li>
            <li><b>Replace Account ID with Account Alias?: Yes</b> - опціонально, якщо хочемо замінити ідентифікатор рахунку на його псевдонім.</li>
            <li><b>Display Mailing Address in Account Information Section?: Yes</b> - опціонально, якщо хочемо відображати поштову адресу в секції інформації про рахунок.</li>
          </ul>
        </li>
        <li>В розділі <b>Delivery Configuration</b> залишаємо все за замовчуванням.</li>
      </ol>
      <p>Після збереження, звіт з'явиться у списку доступних звітів в секції <b>Custom Statements</b>.</p>
      <p>Залишиться лише сформувати звіт за попередній рік, та підвантажити його у форму вище.</p>
    </CardContent>
  </Card>
}
