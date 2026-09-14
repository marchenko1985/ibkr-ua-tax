import { TooltipLines } from "../../tooltip-lines";
import { TableHead, TableHeader, TableRow } from "../../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

export function TradesTableHeader() {
  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center" colSpan={6}>
            Interactive Brokers Statement
          </TableHead>
          <TableHead className="border-l text-center" colSpan={3}>
            USD
          </TableHead>
          <TableHead className="border-l text-center" colSpan={2}>
            Exchange Rates
          </TableHead>
          <TableHead className="border-l text-center" colSpan={3}>
            UAH
          </TableHead>
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
              <TooltipContent>
                <TooltipLines>
                  Кількість
                  <br />
                  Зауважте, що для short позицій значення буде від'ємним
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger>Basis</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  Базова вартість закритої позиції
                  <br />
                  Сумма грошей, що була витрачена на відкриття позиції.
                  <br />
                  Для short позицій значення буде від'ємним
                </TooltipLines>
              </TooltipContent>
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
          <TableHead className="border-l text-center">
            <Tooltip>
              <TooltipTrigger>Open</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Витрати в доларах (скориговане значення)</p>
                  <p className="mt-1 text-muted-foreground text-xs">Long: Basis (вартість придбання)</p>
                  <p className="text-muted-foreground text-xs">Short: |Basis| − Realized (вартість зворотнього викупу)</p>
                  <p className="text-muted-foreground text-xs">Expired short: 0 (нічого не викуповували, опціон згорів)</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger>Close</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Дохід в доларах (скориговане значення)</p>
                  <p className="mt-1 text-muted-foreground text-xs">Long: Basis + Realized (виручка від продажу з урахуванням комісій)</p>
                  <p className="text-muted-foreground text-xs">Short: |Basis| (премія від продажу)</p>
                  <p className="text-muted-foreground text-xs">Expired long: 0 (опціон згорів, нічого не отримано)</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger>Realized</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Реалізований прибуток/збиток в доларах</p>
                  <p className="mt-1 text-muted-foreground text-xs">Close USD − Open USD</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="border-l text-center">
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
                <TooltipLines>
                  <p>Витрати в гривнях</p>
                  <p className="mt-1 text-muted-foreground text-xs">Long: Basis × OpenRate (вартість купівлі)</p>
                  <p className="text-muted-foreground text-xs">Short: (|Basis| − Realized) × CloseRate (вартість зворотнього викупу)</p>
                  <p className="text-muted-foreground text-xs">Expired: 0 (нічого не викуповували)</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger>Close</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Дохід в гривнях</p>
                  <p className="mt-1 text-muted-foreground text-xs">Long: (Basis + Realized) × CloseRate (виручка від продажу)</p>
                  <p className="text-muted-foreground text-xs">Short: |Basis| × OpenRate (премія від продажу)</p>
                  <p className="text-muted-foreground text-xs">Expired: |Basis| × OpenRate (вся премія як дохід)</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger>Realized</TooltipTrigger>
              <TooltipContent>
                <TooltipLines>
                  <p>Реалізований прибуток/збиток в гривнях</p>
                  <p className="mt-1 text-muted-foreground text-xs">Close UAH − Open UAH</p>
                </TooltipLines>
              </TooltipContent>
            </Tooltip>
          </TableHead>
        </TableRow>
      </TableHeader>
    </>
  );
}
