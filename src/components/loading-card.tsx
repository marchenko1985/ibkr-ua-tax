import { Card, CardContent } from "./ui/card";

export function LoadingCard() {
  return (
    <Card className="print:hidden">
      <CardContent className="text-center">Завантаження...</CardContent>
    </Card>
  );
}
