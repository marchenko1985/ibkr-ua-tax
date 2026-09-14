import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUsd, toneClass } from "../lib/format";
import { drawdownEpisodes } from "../lib/metrics/timeseries";
import type { Setup } from "../lib/setups";

// Ported from optionslab app/stats/components/DrawdownEpisodes.tsx

const LIMIT = 8;

/** Shape of drawdowns: one big blowup or many small quickly recovered dips */
export function DrawdownEpisodes({ setups }: { setups: readonly Setup[] }) {
  const episodes = drawdownEpisodes(setups);
  const visible = episodes.slice(0, LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Епізоди просідання</CardTitle>
        <CardDescription>{episodes.length === 0 ? "Просідань не було" : `Найглибші епізоди (${visible.length} з ${episodes.length}): кожен рядок — цикл пік → дно → відновлення кривої капіталу.`}</CardDescription>
      </CardHeader>
      {visible.length === 0 ? null : (
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Пік → дно</TableHead>
                <TableHead className="text-right">Тривалість</TableHead>
                <TableHead className="text-right">Глибина</TableHead>
                <TableHead className="text-right">Відновлення</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((episode) => (
                <TableRow key={episode.index}>
                  <TableCell className="text-muted-foreground tabular-nums">{episode.index}</TableCell>
                  <TableCell className="tabular-nums">
                    {episode.peakDate}
                    <span className="text-muted-foreground"> → {episode.troughDate}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{episode.durationDays} дн.</TableCell>
                  <TableCell className={`text-right tabular-nums ${toneClass("bad")}`}>{formatUsd(-episode.depth)}</TableCell>
                  <TableCell className="text-right tabular-nums">{episode.open ? <span className={`font-medium text-xs ${toneClass("warn")}`}>триває</span> : <span className="text-muted-foreground text-xs">{`${episode.recoveryDays} дн. · ${episode.recoveryDate}`}</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
