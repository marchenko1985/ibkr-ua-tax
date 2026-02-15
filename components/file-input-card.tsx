import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function FileInputCard({ setDoc, setError }: { setDoc: React.Dispatch<React.SetStateAction<Document | null>>, setError: React.Dispatch<React.SetStateAction<Error | null>> }) {
  return <Card className="print:hidden">
    <CardHeader>
      <CardTitle>Файл звіту з Interactive Brokers</CardTitle>
      <CardDescription>Завантажте HTML-файл звіту про закриті позиції з Interactive Brokers</CardDescription>
    </CardHeader>
    <CardContent>
      <Input type="file" accept=".html,.htm" multiple={false} onChange={onFileChange(setDoc, setError)} />
    </CardContent>
  </Card>
}


function onFileChange(setDoc: React.Dispatch<React.SetStateAction<Document | null>>, setError: React.Dispatch<React.SetStateAction<Error | null>>) {
  return async function (e: React.ChangeEvent<HTMLInputElement>) {
    setDoc(null)
    setError(null)

    const file = e.target.files?.item(0);
    if (!file) {
      setError(new Error("Щось пішло не так при завантаженні файлу, спробуйте ще раз"));
      return;
    }

    let html = "";
    try {
      html = await file.text()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(new Error("Не вдалося прочитати файл: " + msg));
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    // note: parseFromString won't throw, we need to perform some manual check here
    const hasTradesTable = doc.querySelectorAll('div[id^="tblTransactions_"] table tbody tr')?.length > 0;
    const hasDividendsTable = doc.querySelectorAll('div[id^="tblCombDiv_"] table tbody tr')?.length > 0;
    if (!hasTradesTable && !hasDividendsTable) {
      setError(new Error("Завантажений файл не містить необхідної інформації про угоди чи дивіденди. Будь ласка, переконайтеся, що ви завантажуєте правильний HTML-файл звіту з Interactive Brokers."));
      return;
    }

    setDoc(doc);
  }
}
