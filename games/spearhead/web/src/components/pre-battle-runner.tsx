"use client";

import { useState } from "react";
import { RulesModal } from "@/components/rules-modal";
import type { MatchRecord, MatchPlayerSlot } from "@/lib/game-state/match-types";
import { getArmySummaryById } from "@/lib/spearhead-data/armies";
import { canAdvancePreBattle, getPreBattleStepStatus, preBattleSteps } from "@/lib/rules/pre-battle";
import type { RuleContent } from "@/lib/rules/setup-rules";
import {
  armyDeploymentRule,
  regimentChoiceRule,
  terrainPlacementRule,
} from "@/lib/rules/setup-rules";

type PreBattleRunnerProps = {
  armyALabel: string;
  armyBLabel: string;
  match: MatchRecord;
  onChange: (nextMatch: MatchRecord) => void;
};

type SlotOption = {
  label: string;
  value: MatchPlayerSlot;
};

export function PreBattleRunner({
  armyALabel,
  armyBLabel,
  match,
  onChange,
}: PreBattleRunnerProps) {
  const stepStatus = getPreBattleStepStatus(match);
  const currentStep = preBattleSteps[match.preBattleSetup.currentStepIndex];
  const armyA = getArmySummaryById(match.armyAId);
  const armyB = getArmySummaryById(match.armyBId);
  const [activeRuleContent, setActiveRuleContent] = useState<RuleContent | null>(null);
  const slotOptions: SlotOption[] = [
    { label: armyALabel, value: "army_a" },
    { label: armyBLabel, value: "army_b" },
  ];

  function patchSetup(patch: Partial<MatchRecord["preBattleSetup"]>) {
    onChange({
      ...match,
      currentPhase: "pre_battle",
      preBattleSetup: {
        ...match.preBattleSetup,
        ...patch,
      },
      status: "in_progress",
    });
  }

  function handleRoleChange(nextAttacker: MatchPlayerSlot) {
    const nextDefender = nextAttacker === "army_a" ? "army_b" : "army_a";

    patchSetup({
      attacker: nextAttacker,
      defender: nextDefender,
      rollOffWinner: nextAttacker,
    });
  }

  function advanceStep() {
    if (!canAdvancePreBattle(match)) {
      return;
    }

    const nextIndex = Math.min(
      match.preBattleSetup.currentStepIndex + 1,
      preBattleSteps.length - 1,
    );

    const nextMatch: MatchRecord = {
      ...match,
      currentPhase: nextIndex === preBattleSteps.length - 1 && canAdvancePreBattle(match)
        ? "pre_battle"
        : "pre_battle",
      currentRound:
        match.preBattleSetup.currentStepIndex === preBattleSteps.length - 1 &&
        canAdvancePreBattle(match)
          ? 1
          : match.currentRound,
      preBattleSetup: {
        ...match.preBattleSetup,
        currentStepIndex: nextIndex,
      },
      status: "in_progress",
    };

    onChange(nextMatch);
  }

  function completePreBattle() {
    onChange({
      ...match,
      currentPhase: "battle_round_start",
      currentRound: 1,
      preBattleSetup: {
        ...match.preBattleSetup,
        currentStepIndex: preBattleSteps.length - 1,
      },
      status: "in_progress",
    });
  }

  function goToStep(index: number) {
    if (index > match.preBattleSetup.currentStepIndex) {
      return;
    }

    patchSetup({
      currentStepIndex: index,
    });
  }

  function openRegimentRule(optionName: string, kind: "enhancement" | "regiment", armyLabel: string) {
    const sourceOptions = kind === "regiment"
      ? armyLabel === armyALabel
        ? armyA?.regimentAbilities ?? []
        : armyB?.regimentAbilities ?? []
      : armyLabel === armyALabel
        ? armyA?.enhancements ?? []
        : armyB?.enhancements ?? [];

    const option = sourceOptions.find((entry) => entry.name === optionName);

    setActiveRuleContent({
      bullets: option?.details ?? [
        "No local rules summary is available yet for this choice.",
      ],
      sourceLabel: option?.sourceLabel ?? "Local Spearhead army data",
      sourceUrl: option?.sourceUrl,
      title: `${armyLabel} ${kind === "regiment" ? "Regiment Ability" : "Enhancement"}: ${optionName}`,
    });
  }

  const activeSetupRule =
    currentStep.id === "regiment-choices"
      ? regimentChoiceRule
      : currentStep.id === "terrain"
        ? terrainPlacementRule
        : currentStep.id === "deployment"
          ? armyDeploymentRule
          : null;

  const allStepsComplete = preBattleSteps.every((step) => step.isComplete(match));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[32px] border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Pre-battle timeline
        </p>
        <ol className="mt-5 space-y-3">
          {stepStatus.map((step) => (
            <li
              className={`rounded-2xl border px-4 py-4 transition ${
                step.isCurrent
                  ? "border-accent bg-accent/10"
                  : step.isComplete(match)
                    ? "border-line bg-black/10"
                    : "border-line/60 bg-black/5"
              }`}
              key={step.id}
            >
              <button
                className="w-full text-left"
                disabled={step.isLocked}
                onClick={() => goToStep(step.index)}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Step {step.index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {step.description}
                </p>
                {!step.isLocked ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-accent">
                    {step.isCurrent ? "Current step" : "Jump back to this step"}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        </section>

        <section className="rounded-[32px] border border-line bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Current setup step
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          {currentStep.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          {currentStep.description}
        </p>
        {activeSetupRule ? (
          <button
            className="mt-4 rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
            onClick={() => setActiveRuleContent(activeSetupRule)}
            type="button"
          >
            View Rules
          </button>
        ) : null}

        <div className="mt-6 space-y-5">
          {match.preBattleSetup.currentStepIndex === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {slotOptions.map((option) => (
                <button
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    match.preBattleSetup.rollOffWinner === option.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-line bg-black/10 text-muted hover:border-accent"
                  }`}
                  key={option.value}
                  onClick={() => patchSetup({ rollOffWinner: option.value })}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Roll-off winner
                  </p>
                  <p className="mt-2 text-base font-semibold">{option.label}</p>
                </button>
              ))}
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {slotOptions.map((option) => (
                <button
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    match.preBattleSetup.attacker === option.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-line bg-black/10 text-muted hover:border-accent"
                  }`}
                  key={option.value}
                  onClick={() => handleRoleChange(option.value)}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Attacker
                  </p>
                  <p className="mt-2 text-base font-semibold">{option.label}</p>
                </button>
              ))}
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label={`${armyALabel} regiment ability`}
                onChange={(value) => patchSetup({ attackerRegimentAbility: value })}
                onViewRule={(value) => openRegimentRule(value, "regiment", armyALabel)}
                options={armyA?.regimentAbilities ?? []}
                placeholder="Choose regiment ability"
                value={match.preBattleSetup.attackerRegimentAbility}
              />
              <SelectField
                label={`${armyALabel} enhancement`}
                onChange={(value) => patchSetup({ attackerEnhancement: value })}
                onViewRule={(value) => openRegimentRule(value, "enhancement", armyALabel)}
                options={armyA?.enhancements ?? []}
                placeholder="Choose enhancement"
                value={match.preBattleSetup.attackerEnhancement}
              />
              <SelectField
                label={`${armyBLabel} regiment ability`}
                onChange={(value) => patchSetup({ defenderRegimentAbility: value })}
                onViewRule={(value) => openRegimentRule(value, "regiment", armyBLabel)}
                options={armyB?.regimentAbilities ?? []}
                placeholder="Choose regiment ability"
                value={match.preBattleSetup.defenderRegimentAbility}
              />
              <SelectField
                label={`${armyBLabel} enhancement`}
                onChange={(value) => patchSetup({ defenderEnhancement: value })}
                onViewRule={(value) => openRegimentRule(value, "enhancement", armyBLabel)}
                options={armyB?.enhancements ?? []}
                placeholder="Choose enhancement"
                value={match.preBattleSetup.defenderEnhancement}
              />
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                isSelected={match.preBattleSetup.defenderBattlefieldSide === "aqshy"}
                label="Aqshy"
                onClick={() => patchSetup({ defenderBattlefieldSide: "aqshy" })}
              />
              <ChoiceCard
                isSelected={match.preBattleSetup.defenderBattlefieldSide === "ghyran"}
                label="Ghyran"
                onClick={() => patchSetup({ defenderBattlefieldSide: "ghyran" })}
              />
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 4 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Deployment map
                </p>
                <div className="mt-3 grid gap-3">
                  <ChoiceCard
                    isSelected={match.preBattleSetup.deploymentMap === "horizontal"}
                    label="Horizontal"
                    onClick={() => patchSetup({ deploymentMap: "horizontal" })}
                  />
                  <ChoiceCard
                    isSelected={match.preBattleSetup.deploymentMap === "diagonal"}
                    label="Diagonal"
                    onClick={() => patchSetup({ deploymentMap: "diagonal" })}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Defender territory
                </p>
                <div className="mt-3 grid gap-3">
                  <ChoiceCard
                    isSelected={match.preBattleSetup.territoryChoice === "north_west"}
                    label="North-west"
                    onClick={() => patchSetup({ territoryChoice: "north_west" })}
                  />
                  <ChoiceCard
                    isSelected={match.preBattleSetup.territoryChoice === "south_east"}
                    label="South-east"
                    onClick={() => patchSetup({ territoryChoice: "south_east" })}
                  />
                  <ChoiceCard
                    isSelected={match.preBattleSetup.territoryChoice === "north_east"}
                    label="North-east"
                    onClick={() => patchSetup({ territoryChoice: "north_east" })}
                  />
                  <ChoiceCard
                    isSelected={match.preBattleSetup.territoryChoice === "south_west"}
                    label="South-west"
                    onClick={() => patchSetup({ territoryChoice: "south_west" })}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 5 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleCard
                isChecked={match.preBattleSetup.terrainPlacedByDefender}
                label="Defender placed large and small terrain"
                onClick={() =>
                  patchSetup({
                    terrainPlacedByDefender: !match.preBattleSetup.terrainPlacedByDefender,
                  })
                }
              />
              <ToggleCard
                isChecked={match.preBattleSetup.terrainPlacedByAttacker}
                label="Attacker placed large and small terrain"
                onClick={() =>
                  patchSetup({
                    terrainPlacedByAttacker: !match.preBattleSetup.terrainPlacedByAttacker,
                  })
                }
              />
            </div>
          ) : null}

          {match.preBattleSetup.currentStepIndex === 6 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleCard
                isChecked={match.preBattleSetup.attackerDeployed}
                label="Attacker army deployed"
                onClick={() =>
                  patchSetup({
                    attackerDeployed: !match.preBattleSetup.attackerDeployed,
                  })
                }
              />
              <ToggleCard
                isChecked={match.preBattleSetup.defenderDeployed}
                label="Defender army deployed"
                onClick={() =>
                  patchSetup({
                    defenderDeployed: !match.preBattleSetup.defenderDeployed,
                  })
                }
              />
            </div>
          ) : null}

          <TextArea
            label="Setup notes"
            onChange={(value) => patchSetup({ notes: value })}
            value={match.preBattleSetup.notes}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {match.preBattleSetup.currentStepIndex < preBattleSteps.length - 1 ? (
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-[#6e5a3a] disabled:text-[#d7c7aa]"
              disabled={!canAdvancePreBattle(match)}
              onClick={advanceStep}
              type="button"
            >
              Complete step
            </button>
          ) : (
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-[#6e5a3a] disabled:text-[#d7c7aa]"
              disabled={!allStepsComplete}
              onClick={completePreBattle}
              type="button"
            >
              Start battle round 1
            </button>
          )}
        </div>
        </section>
      </div>

      <RulesModal content={activeRuleContent} onClose={() => setActiveRuleContent(null)} />
    </>
  );
}

type ChoiceCardProps = {
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

function ChoiceCard({ isSelected, label, onClick }: ChoiceCardProps) {
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        isSelected
          ? "border-accent bg-accent/10 text-foreground"
          : "border-line bg-black/10 text-muted hover:border-accent"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type ToggleCardProps = {
  isChecked: boolean;
  label: string;
  onClick: () => void;
};

function ToggleCard({ isChecked, label, onClick }: ToggleCardProps) {
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        isChecked
          ? "border-accent bg-accent/10 text-foreground"
          : "border-line bg-black/10 text-muted hover:border-accent"
      }`}
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em]">
        {isChecked ? "Recorded" : "Pending"}
      </p>
    </button>
  );
}

type SelectFieldProps = {
  label: string;
  onChange: (value: string) => void;
  onViewRule: (value: string) => void;
  options: { details: string[]; name: string }[];
  placeholder: string;
  value: string;
};

function SelectField({
  label,
  onChange,
  onViewRule,
  options,
  placeholder,
  value,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <div className="flex gap-2">
        <select
          className="min-w-0 flex-1 rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-2xl border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!value}
          onClick={() => onViewRule(value)}
          type="button"
        >
          Rules
        </button>
      </div>
    </div>
  );
}

type TextAreaProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function TextArea({ label, onChange, value }: TextAreaProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <textarea
        className="min-h-28 rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
