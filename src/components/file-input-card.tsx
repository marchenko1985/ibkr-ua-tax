import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function FileInputCard({ onFile }: { onFile: (file: File | undefined) => void }) {
  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Файл звіту з Interactive Brokers</CardTitle>
        <CardDescription>Завантажте HTML-файл звіту про закриті позиції з Interactive Brokers</CardDescription>
      </CardHeader>
      <CardContent>
        <Input type="file" accept=".html,.htm" multiple={false} onChange={(e) => onFile(e.target.files?.item(0) ?? undefined)} />
      </CardContent>
    </Card>
  );
}
