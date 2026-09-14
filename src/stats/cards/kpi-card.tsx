import { cn } from "cn";
import type { ReactNode } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Ported from optionslab app/stats/components/KpiCard.tsx

interface KpiCardProps {
  /** small label above the value */
  description: string;
  value: ReactNode;
  valueClass?: string;
  footerPrimary?: string;
  footerSecondary?: string;
}

export function KpiCard({ description, value, valueClass, footerPrimary, footerSecondary }: KpiCardProps) {
  const hasFooter = footerPrimary !== undefined || footerSecondary !== undefined;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className={cn("font-semibold text-2xl tabular-nums", valueClass)}>{value}</CardTitle>
      </CardHeader>
      {hasFooter ? (
        <CardFooter className="flex-col items-start gap-1 text-xs">
          {footerPrimary === undefined ? null : <div className="font-medium">{footerPrimary}</div>}
          {footerSecondary === undefined ? null : <div className="text-muted-foreground">{footerSecondary}</div>}
        </CardFooter>
      ) : null}
    </Card>
  );
}

/** two values side by side, the second one smaller */
export function PairedValue({ first, second, firstClass, secondClass }: { first: ReactNode; second: ReactNode; firstClass?: string; secondClass?: string }) {
  return (
    <span className="flex items-baseline gap-3">
      <span className={firstClass}>{first}</span>
      <span className={cn("font-normal text-base text-muted-foreground", secondClass)}>{second}</span>
    </span>
  );
}
