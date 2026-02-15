import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ErrorCard({ error }: { error: Error | null | undefined }) {
  if (!error) return null;

  const message = error instanceof Error ? error.message : String(error);
  if (!message) return null;

  return <Card className="print:hidden">
    <CardHeader>
      <CardTitle>Сталася помилка</CardTitle>
    </CardHeader>
    <CardContent>{message}</CardContent>
  </Card>
}
