import { useId } from "react";
import { Checkbox } from "../../ui/checkbox";
import { Field, FieldGroup } from "../../ui/field";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { TradesFilter } from "./filter-trades";

export function TradesFilters({ filter, onChange }: { filter: TradesFilter; onChange: (filter: TradesFilter) => void }) {
  const id = useId();

  return (
    <FieldGroup className="mb-4 flex-row">
      <Field orientation="horizontal" className="w-auto">
        <Input id={`${id}-search`} name="search" type="text" placeholder="symbol, e.g. AAPL" value={filter.search} onChange={(e) => onChange({ ...filter, search: e.target.value })} />
      </Field>
      <Field orientation="horizontal" className="w-auto">
        <Checkbox id={`${id}-stocks`} checked={filter.showStocks} onCheckedChange={(showStocks) => onChange({ ...filter, showStocks })} />
        <Label htmlFor={`${id}-stocks`}>акції</Label>
      </Field>
      <Field orientation="horizontal" className="w-auto">
        <Checkbox id={`${id}-options`} checked={filter.showOptions} onCheckedChange={(showOptions) => onChange({ ...filter, showOptions })} />
        <Label htmlFor={`${id}-options`}>опціони</Label>
      </Field>
    </FieldGroup>
  );
}
