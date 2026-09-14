import { Badge } from "@/components/ui/badge";
import { classifySampleSize, type SampleSize } from "../lib/metrics/sample-size";

// Ported from optionslab app/stats/components/SampleSizeBadge.tsx

const META: Record<SampleSize, { label: string; className: string; title: string }> = {
  solid: { label: "достатньо", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", title: "Достатньо позицій, щоб довіряти результату." },
  small: { label: "мало", className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400", title: "Мало позицій — висновки обережно." },
  noisy: { label: "шум", className: "border-muted-foreground/30 bg-muted/40 text-muted-foreground", title: "Замало позицій, результат — шум." },
};

/** Is a bucket big enough to read anything into it */
export function SampleSizeBadge({ bucketCount, totalCount }: { bucketCount: number; totalCount: number }) {
  const meta = META[classifySampleSize(bucketCount, totalCount)];
  return (
    <Badge variant="outline" className={`${meta.className} h-4 px-1.5 font-medium text-[10px] uppercase leading-none tracking-wide`} title={meta.title}>
      {meta.label}
    </Badge>
  );
}

/** the three badges in a row, for card descriptions */
export function SampleSizeLegend() {
  return (
    <span className="inline-flex items-center gap-1">
      <SampleSizeBadge bucketCount={100} totalCount={100} />
      <SampleSizeBadge bucketCount={5} totalCount={100} />
      <SampleSizeBadge bucketCount={2} totalCount={100} />
    </span>
  );
}
