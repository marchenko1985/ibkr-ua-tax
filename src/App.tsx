import { useState, useTransition } from "react";
import { StatementCards } from "./components/cards/statement-cards";
import { ErrorCard } from "./components/error-card";
import { FileInputCard } from "./components/file-input-card";
import { Header } from "./components/header";
import { HowCard } from "./components/how-card";
import { InvalidStatementCard } from "./components/invalid-statement-card";
import { LoadingCard } from "./components/loading-card";
import { WhyCard } from "./components/why-card";
import { loadStatement, parseStatement, type Statement } from "./lib/statement";
import { type Problem, validateStatement } from "./lib/validate";

export function App() {
  const [statement, setStatement] = useState<Statement | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    setStatement(null);
    setProblems([]);
    setError(null);
    startTransition(async () => {
      try {
        const document = parseStatement(await readFile(file));
        const found = validateStatement(document);
        if (found.length > 0) {
          startTransition(() => setProblems(found));
          return;
        }
        const loaded = await loadStatement(document);
        startTransition(() => setStatement(loaded));
      } catch (err) {
        startTransition(() => setError(err instanceof Error ? err : new Error(String(err))));
      }
    });
  }

  const isEmpty = statement === null && problems.length === 0 && error === null && !isPending;

  return (
    <>
      <Header />
      {isEmpty ? <WhyCard /> : null}
      <FileInputCard onFile={onFile} />
      {problems.length > 0 ? <InvalidStatementCard problems={problems} /> : null}
      {isEmpty || problems.length > 0 ? <HowCard /> : null}
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
