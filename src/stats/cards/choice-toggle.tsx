import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Choice<K extends string> {
  key: K;
  label: string;
}

/** Single choice from a few options, e.g. chart range or window size */
export function ChoiceToggle<K extends string>({ choices, value, onChange }: { choices: readonly Choice<K>[]; value: K; onChange: (next: K) => void }) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const picked = choices.find((choice) => choice.key === next[0]);
        if (picked) {
          onChange(picked.key);
        }
      }}
      variant="outline"
      size="sm"
    >
      {choices.map((choice) => (
        <ToggleGroupItem key={choice.key} value={choice.key}>
          {choice.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
