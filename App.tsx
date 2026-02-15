import { useState } from "react";
import { ErrorCard } from "./components/error-card";
import { Header } from "./components/header";
import { FileInputCard } from "./components/file-input-card";
import { PreviewCard } from "./components/preview-card";
import { TradesCard } from "./components/trades-card";
import { DividendsCard } from "./components/dividends-card";
import { WhyCard } from "./components/why-card";
import { HowCard } from "./components/how-card";

export function App() {
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<Error | null>(null);

  return <>
    <Header />
    {!doc && !error && <WhyCard />}
    <FileInputCard setDoc={setDoc} setError={setError} />
    {!doc && !error && <HowCard />}
    <ErrorCard error={error} />
    <TradesCard document={doc} />
    <DividendsCard document={doc} />
    <PreviewCard document={doc} />
  </>
}

