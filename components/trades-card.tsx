import { extract } from "@/lib/extract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchRates } from "@/lib/fetchRates";
import { enrich } from "@/lib/enrich";
import { ErrorCard } from "./error-card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";


export function TradesCard({ document }: { document: Document | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);
  const [trades, setTrades] = useState<ReturnType<typeof extract>>([]);
  const min_close_date = useMemo(() => [...trades].sort((a, b) => a.close_date.localeCompare(b.close_date))[0]?.close_date, [trades]);
  const max_close_date = useMemo(() => [...trades].sort((a, b) => b.close_date.localeCompare(a.close_date))[0]?.close_date, [trades]);

  // Single filtered array for Ф1, totals, and taxes — excludes assigned/exercised options
  // which are not taxable events (they convert to stock, their economics are in stock basis)
  const taxableTrades = useMemo(() => trades.filter(t => !t.is_assignment && !t.is_exercise), [trades]);
  const convertedCount = trades.length - taxableTrades.length;

  useEffect(() => {
    if (!document) return;

    startTransition(async () => {
      setError(null)
      try {
        const tradesWithoutRates = extract(document)
        const tradesWithRates = await fetchRates(tradesWithoutRates)
        const trades = enrich(tradesWithRates)
        setTrades(trades)
      } catch (error) {
        setError(error as Error);
      }
    })
  }, [document])

  if (!document) return null;

  if (isPending) {
    return <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Угоди</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        Завантаження...
      </CardContent>
    </Card>
  }

  if (error) {
    return <ErrorCard error={error} />
  }

  if (trades.length === 0) {
    return <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Угоди</CardTitle>
      </CardHeader>
      <CardContent>
        Звіт не містить інформації про закриті угоди за вибраний період.
      </CardContent>
    </Card>
  }


  return <>
    {trades.some(trade => trade.close_commfee > 10) && <Card>
      <CardHeader>
        <CardTitle>Увага</CardTitle>
        <CardDescription>Схоже, що деякі угоди мають незвично високі комісії.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Перевірте що в налаштуваннях звіту <b>Profit and Loss</b> виставлено в <b>Realized P/L Only</b>.</p>
        <p>Це налаштування міняє порядок стовпчиків. Із-за чого, замість комісії може враховуватися прибуток.</p>
        <p>Додаток вичитує комісію з сьомого стовпчика оригінального html - відкрийте його в браузері та перевірте щоб там був стовпчик commfee а не proceeds.</p>
      </CardContent>
    </Card>}
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Угоди</CardTitle>
        <CardDescription>
          Усього {trades.length} позицій було закрито у проміжку між {min_close_date} та {max_close_date}
          {convertedCount > 0 && <span className="text-muted-foreground"> (з них {convertedCount} — конвертовані опціони, не включені до Ф1)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TradesTable trades={trades} taxableTrades={taxableTrades} />
      </CardContent>
    </Card>
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Додаток Ф1</CardTitle>
        <CardDescription>
          <p>Скопіюйти табличку у додаток Ф1 податкового звіту</p>
          <p>Перша колонка - номер угоди, друга - 4 - інвестиційні активи з джерел за межами України, третя - символ закритої позиції, четверта - сума у гривнях при закритті, п'ята - сума у гривнях при відкритті</p>
          <p>Вставивши цю табличку у додаток Ф1 він сам розрахує необхідну суму до сплати податків</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {taxableTrades.map((trade, i) => <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>4</TableCell>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell>{trade.close_uah.toFixed(2)}</TableCell>
              <TableCell>{trade.open_uah.toFixed(2)}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </>
}

function TradesTable({ trades, taxableTrades }: { trades: ReturnType<typeof extract>; taxableTrades: ReturnType<typeof extract> }) {
  // Totals computed only from taxable trades — assigned/exercised options excluded
  const total = useMemo(() => {
    const open_uah = taxableTrades.reduce((acc, trade) => acc + trade.open_uah, 0);
    const close_uah = taxableTrades.reduce((acc, trade) => acc + trade.close_uah, 0);
    const realized_uah = taxableTrades.reduce((acc, trade) => acc + trade.realized_uah, 0);
    const personal_income_tax = realized_uah > 0 ? realized_uah * 0.18 : 0;
    const military_tax = realized_uah > 0 ? realized_uah * 0.05 : 0;
    const realized_usd = taxableTrades.reduce((acc, trade) => acc + trade.open_realized, 0);
    return {
      open_uah,
      close_uah,
      realized_uah,
      personal_income_tax,
      military_tax,
      realized_usd,
    }
  }, [taxableTrades])

  return <Table className="text-center">
    <TableHeader>
      <TableRow>
        <TableHead className="text-center" colSpan={6}>Interactive Brokers Statement</TableHead>
        <TableHead className="text-center border-l" colSpan={3}>USD</TableHead>
        <TableHead className="text-center border-l" colSpan={2}>Exchange Rates</TableHead>
        <TableHead className="text-center border-l" colSpan={3}>UAH</TableHead>
      </TableRow>
    </TableHeader>
    <TableHeader>
      <TableRow>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Date</TooltipTrigger>
            <TooltipContent>Дата закриття позиції</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Symbol</TooltipTrigger>
            <TooltipContent>Символ закритої позиції</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Quantity</TooltipTrigger>
            <TooltipContent>Кількість<br />Зауважте, що для short позицій значення буде від'ємним</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Basis</TooltipTrigger>
            <TooltipContent>Базова вартість закритої позиції<br />Сумма грошей, що була витрачена на відкриття позиції.<br />Для short позицій значення буде від'ємним</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Realized P/L</TooltipTrigger>
            <TooltipContent>Реалізований прибуток/збиток при відкритті позиції. Не залежно від того чи була позиція long чи short - значення буде відповідати фактичному результату</TooltipContent>
          </Tooltip>
        </TableHead>
        {/* Commission column hidden — data kept in trade.close_commfee */}
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Open Date</TooltipTrigger>
            <TooltipContent>Дата відкриття позиції</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center border-l">
          <Tooltip>
            <TooltipTrigger>Open</TooltipTrigger>
            <TooltipContent>
              <p>Витрати в доларах (скориговане значення)</p>
              <p className="text-muted-foreground text-xs mt-1">Long: Basis (вартість придбання)</p>
              <p className="text-muted-foreground text-xs">Short: |Basis| − Realized (вартість зворотнього викупу)</p>
              <p className="text-muted-foreground text-xs">Expired short: 0 (нічого не викуповували, опціон згорів)</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Close</TooltipTrigger>
            <TooltipContent>
              <p>Дохід в доларах (скориговане значення)</p>
              <p className="text-muted-foreground text-xs mt-1">Long: Basis + Realized (виручка від продажу з урахуванням комісій)</p>
              <p className="text-muted-foreground text-xs">Short: |Basis| (премія від продажу)</p>
              <p className="text-muted-foreground text-xs">Expired long: 0 (опціон згорів, нічого не отримано)</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Realized</TooltipTrigger>
            <TooltipContent>
              <p>Реалізований прибуток/збиток в доларах</p>
              <p className="text-muted-foreground text-xs mt-1">Close USD − Open USD</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center border-l">
          <Tooltip>
            <TooltipTrigger>Open Rate</TooltipTrigger>
            <TooltipContent>Курс долара на дату відкриття позиції</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Close Rate</TooltipTrigger>
            <TooltipContent>Курс долара на дату закриття позиції</TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="border-l text-center">
          <Tooltip>
            <TooltipTrigger>Open</TooltipTrigger>
            <TooltipContent>
              <p>Витрати в гривнях</p>
              <p className="text-muted-foreground text-xs mt-1">Long: Basis × OpenRate (вартість купівлі)</p>
              <p className="text-muted-foreground text-xs">Short: (|Basis| − Realized) × CloseRate (вартість зворотнього викупу)</p>
              <p className="text-muted-foreground text-xs">Expired: 0 (нічого не викуповували)</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Close</TooltipTrigger>
            <TooltipContent>
              <p>Дохід в гривнях</p>
              <p className="text-muted-foreground text-xs mt-1">Long: (Basis + Realized) × CloseRate (виручка від продажу)</p>
              <p className="text-muted-foreground text-xs">Short: |Basis| × OpenRate (премія від продажу)</p>
              <p className="text-muted-foreground text-xs">Expired: |Basis| × OpenRate (вся премія як дохід)</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
        <TableHead className="text-center">
          <Tooltip>
            <TooltipTrigger>Realized</TooltipTrigger>
            <TooltipContent>
              <p>Реалізований прибуток/збиток в гривнях</p>
              <p className="text-muted-foreground text-xs mt-1">Close UAH − Open UAH</p>
            </TooltipContent>
          </Tooltip>
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {trades.map((trade, i) => {
        const isConverted = trade.is_assignment || trade.is_exercise;
        return <TableRow key={i} className={cn(isConverted && "opacity-40")}>
          <TableCell>{trade.close_date}</TableCell>
          <TableCell>{trade.symbol}</TableCell>
          <TableCell className={cn(trade.open_quantity > 0 && "text-blue-500", trade.open_quantity < 0 && "text-red-500")}>{trade.open_quantity}</TableCell>
          <TableCell>{trade.open_basis}</TableCell>
          <TableCell className={cn(trade.open_realized > 0 && "text-green-500", trade.open_realized < 0 && "text-red-500")}>{trade.open_realized}</TableCell>
          {/* <TableCell>{trade.close_commfee / trade.count}</TableCell> */}
          <TableCell>{trade.open_date}</TableCell>
          {isConverted ? (
            <>
              <TableCell colSpan={3} className="border-l text-center">
                <Tooltip>
                  <TooltipTrigger>—</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Опціон конвертовано в акції ({trade.is_assignment ? "assignment" : "exercise"})</p>
                    <p className="text-muted-foreground text-xs mt-1">Це не є податковою подією — вартість опціону включена в базову вартість акцій.</p>
                    <p className="text-muted-foreground text-xs">Результат буде відображено при закритті позиції в акціях.</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell colSpan={2} className="border-l text-center">
                <Tooltip>
                  <TooltipTrigger>—</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Опціон конвертовано в акції</p>
                    <p className="text-muted-foreground text-xs mt-1">Курси не застосовуються — позиція не є податковою подією.</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell colSpan={3} className="border-l text-center">
                <Tooltip>
                  <TooltipTrigger>—</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Опціон конвертовано в акції ({trade.is_assignment ? "assignment" : "exercise"})</p>
                    <p className="text-muted-foreground text-xs mt-1">Це не є податковою подією — вартість опціону включена в базову вартість акцій.</p>
                    <p className="text-muted-foreground text-xs">Результат буде відображено при закритті позиції в акціях.</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </>
          ) : (
            <>
              <TableCell className="border-l">
                <Tooltip>
                  <TooltipTrigger>{trade.open_usd.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{trade.is_long ? "Витрати на придбання" : "Витрати на зворотній викуп"} {trade.is_option ? "опціону" : "акцій"}</p>
                    {trade.is_long ? (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">Basis (вартість придбання)</p>
                        <p>{trade.open_basis.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">|Basis| − Realized (вартість зворотнього викупу)</p>
                        <p>{Math.abs(trade.open_basis).toFixed(2)} − {trade.open_realized.toFixed(2)} = {trade.open_usd.toFixed(2)}</p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>{trade.close_usd.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{trade.is_long ? "Дохід від продажу" : "Дохід (премія від продажу)"} {trade.is_option ? "опціону" : "акцій"}</p>
                    {trade.is_long ? (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">Basis + Realized (виручка з урахуванням комісій)</p>
                        <p>{trade.open_basis.toFixed(2)} + {trade.open_realized.toFixed(2)} = {trade.close_usd.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">|Basis| (премія від продажу)</p>
                        <p>{Math.abs(trade.open_basis).toFixed(2)}</p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger className={cn(trade.realized_usd > 0 && "text-green-500", trade.realized_usd < 0 && "text-red-500")}>{trade.realized_usd.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Реалізований {trade.realized_usd >= 0 ? "прибуток" : "збиток"} в доларах</p>
                    <p className="text-muted-foreground text-xs mt-1">Close USD − Open USD</p>
                    <p>{trade.close_usd.toFixed(2)} − {trade.open_usd.toFixed(2)} = {trade.realized_usd.toFixed(2)}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="border-l">
                <Tooltip>
                  <TooltipTrigger>{trade.open_rate.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p>Курс долара на дату відкриття позиції</p>
                    <p>Дата: {trade.open_date}</p>
                    <p>Курс: {trade.open_rate}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>{trade.close_rate.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p>Курс долара на дату закриття позиції</p>
                    <p>Дата: {trade.close_date}</p>
                    <p>Курс: {trade.close_rate}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="border-l">
                <Tooltip>
                  <TooltipTrigger>{trade.open_uah.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{trade.is_long ? "Витрати на купівлю" : "Витрати на зворотній викуп"} {trade.is_option ? "опціону" : "акцій"}</p>
                    {trade.is_long ? (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">Basis × OpenRate</p>
                        <p>{trade.open_basis} × {trade.open_rate} = {trade.open_uah.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">(|Basis| − Realized) × CloseRate</p>
                        <p>({Math.abs(trade.open_basis)} − {trade.open_realized}) × {trade.close_rate}</p>
                        <p>= {(Math.abs(trade.open_basis) - trade.open_realized).toFixed(2)} × {trade.close_rate} = {trade.open_uah.toFixed(2)}</p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>{trade.close_uah.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{trade.is_long ? "Виручка від продажу" : "Премія від продажу"} {trade.is_option ? "опціону" : "акцій"}</p>
                    {trade.is_long ? (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">(Basis + Realized) × CloseRate</p>
                        <p>({trade.open_basis} + {trade.open_realized}) × {trade.close_rate}</p>
                        <p>= {(trade.open_basis + trade.open_realized).toFixed(2)} × {trade.close_rate} = {trade.close_uah.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-xs mt-1">|Basis| × OpenRate</p>
                        <p>{Math.abs(trade.open_basis)} × {trade.open_rate} = {trade.close_uah.toFixed(2)}</p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger className={cn(trade.realized_uah > 0 && "text-green-500", trade.realized_uah < 0 && "text-red-500")}>{trade.realized_uah.toFixed(2)}</TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Реалізований {trade.realized_uah >= 0 ? "прибуток" : "збиток"} в гривнях</p>
                    <p className="text-muted-foreground text-xs mt-1">Close UAH − Open UAH</p>
                    <p>{trade.close_uah.toFixed(2)} − {trade.open_uah.toFixed(2)}</p>
                    <p>= {trade.realized_uah.toFixed(2)}</p>
                    {trade.is_short && trade.open_realized > 0 && trade.realized_uah < 0 && (
                      <p className="text-yellow-500 text-xs mt-1">⚠️ Прибуткова угода в USD, але збиткова в UAH через зміну курсу</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </>
          )}
        </TableRow>
      })}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={4} className="text-right font-bold">Загалом:</TableCell>
        <TableCell className={cn(total.realized_usd < 0 && "text-red-500", total.realized_usd > 0 && "text-green-500")}>{total.realized_usd.toFixed(2)}</TableCell>
        <TableCell colSpan={6} />
        <TableCell>
          <Tooltip>
            <TooltipTrigger>{total.open_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Open UAH</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger>{total.close_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Close UAH</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger className={cn(total.realized_uah > 0 && "text-green-500", total.realized_uah < 0 && "text-red-500")}>{total.realized_uah.toFixed(2)}</TooltipTrigger>
            <TooltipContent>Сума колонки Realized UAH</TooltipContent>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">Податок з доходу ПДФО (18%):</TableCell>
        <TableCell>{total.personal_income_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">Військовий збір (5%):</TableCell>
        <TableCell>{total.military_tax.toFixed(2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={13} className="text-right font-bold">Усього до сплати податків:</TableCell>
        <TableCell>{(total.personal_income_tax + total.military_tax).toFixed(2)}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
}
