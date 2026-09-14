import { useState, useTransition } from "react";
import { StatementCards } from "./components/cards/statement-cards";
import { ErrorCard } from "./components/error-card";
import { FileInputCard } from "./components/file-input-card";
import { Header } from "./components/header";
import { HowCard } from "./components/how-card";
import { LoadingCard } from "./components/loading-card";
import { WhyCard } from "./components/why-card";
import { loadStatement, parseStatement, type Statement } from "./lib/statement";

export function App() {
  const [statement, setStatement] = useState<Statement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    setStatement(null);
    setError(null);
    startTransition(async () => {
      try {
        const loaded = await loadStatement(parseStatement(await readFile(file)));
        startTransition(() => setStatement(loaded));
      } catch (err) {
        startTransition(() => setError(err instanceof Error ? err : new Error(String(err))));
      }
    });
  }

  const isEmpty = statement === null && error === null && !isPending;

  return (
    <>
      <Header />
      {isEmpty ? <WhyCard /> : null}
      <FileInputCard onFile={onFile} />
      {isEmpty ? <HowCard /> : null}
      {isPending ? <LoadingCard /> : null}
      <ErrorCard error={error} />
      {statement ? <StatementCards statement={statement} /> : null}
    </>
  );
}

async function readFile(file: File | undefined) {
  if (!file) {
    throw new Error("Щось пішло не так при завантаженні файлу, спробуйте ще раз");
  }
  try {
    return await file.text();
  } catch (err) {
    throw new Error(`Не вдалося прочитати файл: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
}
