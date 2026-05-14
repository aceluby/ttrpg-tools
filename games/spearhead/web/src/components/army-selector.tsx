"use client";

import type { ArmySummary } from "@/lib/spearhead-data/types";

type ArmySelectorProps = {
  armies: ArmySummary[];
  label: string;
  onChange: (armyId: string) => void;
  selectedArmyId: string;
};

export function ArmySelector({
  armies,
  label,
  onChange,
  selectedArmyId,
}: ArmySelectorProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
        {label}
      </span>
      <select
        className="rounded-2xl border border-line bg-panel px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
        onChange={(event) => onChange(event.target.value)}
        value={selectedArmyId}
      >
        <option value="">Choose a Spearhead</option>
        {armies.map((army) => (
          <option key={army.id} value={army.id}>
            {army.name}
          </option>
        ))}
      </select>
    </label>
  );
}
