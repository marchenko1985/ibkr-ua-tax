// Ported from optionslab app/stats/components/SectionHeader.tsx

export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 flex flex-col gap-1 border-border/60 border-t pt-6">
      <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
      <p className="max-w-3xl text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
