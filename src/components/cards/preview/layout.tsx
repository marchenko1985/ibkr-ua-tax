import { cn } from "cn";
import type { ReactNode } from "react";

export function Cell({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={cn("break-words border-l px-0.5 py-0 align-top text-xs first:border-l-0", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded border bg-secondary px-2 py-1 text-lg text-secondary-foreground", className)}>{children}</div>;
}
