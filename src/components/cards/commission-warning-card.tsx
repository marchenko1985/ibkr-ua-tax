import type { Statement } from "@/lib/statement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

/** Commission is never that high; when it is, columns are most likely shifted by statement settings */
const SUSPICIOUS_COMMISSION = 10;

// TODO: replace with statement settings validation (see README TODO)
export function CommissionWarningCard({ statement }: { statement: Statement }) {
  if (!statement.trades.some((trade) => trade.close_commfee > SUSPICIOUS_COMMISSION)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Увага</CardTitle>
        <CardDescription>Схоже, що деякі угоди мають незвично високі комісії.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Перевірте що в налаштуваннях звіту <b>Profit and Loss</b> виставлено в <b>Realized P/L Only</b>.
        </p>
        <p>Це налаштування міняє порядок стовпчиків. Із-за чого, замість комісії може враховуватися прибуток.</p>
        <p>Додаток вичитує комісію з сьомого стовпчика оригінального html - відкрийте його в браузері та перевірте щоб там був стовпчик commfee а не proceeds.</p>
      </CardContent>
    </Card>
  );
}
