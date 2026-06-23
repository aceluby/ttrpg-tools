"use client";

import { useEffect, useState } from "react";
import { RulesModal } from "@/components/rules-modal";
import { getArmySummaryById } from "@/lib/spearhead-data/armies";
import type { PhaseRule } from "@/lib/spearhead-data/types";
import type {
  MatchPlayerSlot,
  MatchRecord,
  PlayerTurnState,
  TurnPhaseKey,
} from "@/lib/game-state/match-types";
import {
  calculateMatchVictoryPoints,
  calculateTurnVictoryPoints,
  didPlayerSeizeInitiative,
  getOtherPlayer,
  getRoundState,
  getScoreDifference,
  getTwistOptionsForBattlefieldSide,
  patchCurrentRound,
  phaseGuide,
  turnPhaseOrder,
} from "@/lib/rules/battle-rounds";
import type { RuleContent } from "@/lib/rules/setup-rules";

type BattleRoundRunnerProps = {
  armyALabel: string;
  armyBLabel: string;
  match: MatchRecord;
  onChange: (nextMatch: MatchRecord) => void;
};

const checklistPhases = new Set<TurnPhaseKey>(["hero", "movement", "shooting", "charge"]);

export function BattleRoundRunner({
  armyALabel,
  armyBLabel,
  match,
  onChange,
}: BattleRoundRunnerProps) {
  const round = getRoundState(match);
  const [activeRuleContent, setActiveRuleContent] = useState<RuleContent | null>(null);
  const playerLabel = {
    army_a: armyALabel,
    army_b: armyBLabel,
  } as const;
  const armySummaryBySlot = {
    army_a: getArmySummaryById(match.armyAId),
    army_b: getArmySummaryById(match.armyBId),
  } as const;
  const battlefieldSide = match.preBattleSetup.defenderBattlefieldSide;
  const twistOptions = getTwistOptionsForBattlefieldSide(battlefieldSide);
  const activePlayer = round?.activePlayer || round?.firstPlayer || "";
  const resolvedActivePlayer =
    activePlayer === "army_a" || activePlayer === "army_b" ? activePlayer : null;
  const resolvedFirstPlayer =
    round?.firstPlayer === "army_a" || round?.firstPlayer === "army_b"
      ? round.firstPlayer
      : null;
  const currentPhase =
    match.currentPhase === "battle_round_start" ? null : (match.currentPhase as TurnPhaseKey);
  const attackerChoice =
    match.preBattleSetup.attacker === "army_a" || match.preBattleSetup.attacker === "army_b"
      ? match.preBattleSetup.attacker
      : null;
  const scoreTotals = {
    army_a: calculateMatchVictoryPoints(match, "army_a"),
    army_b: calculateMatchVictoryPoints(match, "army_b"),
  };
  const scoreDifference = getScoreDifference(match);
  const seizedInitiativePlayer = didPlayerSeizeInitiative(match);

  useEffect(() => {
    if (
      round &&
      match.currentPhase === "battle_round_start" &&
      match.currentRound === 1 &&
      attackerChoice &&
      round.firstPlayer === ""
    ) {
      onChange({
        ...patchCurrentRound(match, {
          activePlayer: attackerChoice,
          firstPlayer: attackerChoice,
          underdog: "",
        }),
        status: "in_progress",
      });
    }
  }, [
    attackerChoice,
    match,
    onChange,
    round,
  ]);

  if (!round) {
    return null;
  }

  function updateMatch(nextMatch: MatchRecord) {
    onChange({
      ...nextMatch,
      status: "in_progress",
    });
  }

  function patchRound(patch: Partial<typeof round>) {
    updateMatch(patchCurrentRound(match, patch));
  }

  function setChecklistCompletion(
    phase: "hero" | "movement" | "shooting" | "charge",
    unitName: string,
    player: MatchPlayerSlot = resolvedActivePlayer ?? "army_a",
  ) {
    if (!resolvedActivePlayer && player !== "army_a") {
      return;
    }

    const turnState = round.turnState[player];
    const currentUnits = turnState.phaseChecklistCompletion[phase] ?? [];
    const nextUnits = currentUnits.includes(unitName)
      ? currentUnits.filter((entry) => entry !== unitName)
      : [...currentUnits, unitName];

    patchRound({
      turnState: {
        ...round.turnState,
        [player]: {
          ...turnState,
          phaseChecklistCompletion: {
            ...turnState.phaseChecklistCompletion,
            [phase]: nextUnits,
          },
        },
      },
    });
  }

  function setCombatStepCompletion(step: "strikeFirst" | "normal" | "strikeLast") {
    if (!resolvedActivePlayer) {
      return;
    }

    const turnState = round.turnState[resolvedActivePlayer];

    patchRound({
      turnState: {
        ...round.turnState,
        [resolvedActivePlayer]: {
          ...turnState,
          combatStepCompletion: {
            ...turnState.combatStepCompletion,
            [step]: !turnState.combatStepCompletion[step],
          },
        },
      },
    });
  }

  function toggleCombatActivation(player: MatchPlayerSlot, unitName: string) {
    if (!resolvedActivePlayer) {
      return;
    }

    const turnState = round.turnState[resolvedActivePlayer];
    const currentActivations = turnState.combatActivationByArmy[player];
    const nextActivations = currentActivations.includes(unitName)
      ? currentActivations.filter((entry) => entry !== unitName)
      : [...currentActivations, unitName];

    patchRound({
      turnState: {
        ...round.turnState,
        [resolvedActivePlayer]: {
          ...turnState,
          combatActivationByArmy: {
            ...turnState.combatActivationByArmy,
            [player]: nextActivations,
          },
        },
      },
    });
  }

  function setTurnScoring(patch: Partial<PlayerTurnState>) {
    if (!resolvedActivePlayer) {
      return;
    }

    const currentTurn = {
      ...round.turnState[resolvedActivePlayer],
      ...patch,
    };

    patchRound({
      turnState: {
        ...round.turnState,
        [resolvedActivePlayer]: {
          ...currentTurn,
          totalVictoryPoints: calculateTurnVictoryPoints(currentTurn),
        },
      },
    });
  }

  function startRound() {
    const roundStartReady =
      round.firstPlayer !== "" &&
      round.twistCard.trim() !== "" &&
      (match.currentRound === 1 || round.underdog !== "");

    if (!roundStartReady || !round.firstPlayer) {
      return;
    }

    updateMatch({
      ...patchCurrentRound(match, {
        activePlayer: round.firstPlayer,
      }),
      currentPhase: "start_of_turn",
    });
  }

  function previousPhase() {
    if (!currentPhase) {
      return;
    }

    const index = turnPhaseOrder.indexOf(currentPhase);

    if (index > 0) {
      updateMatch({
        ...match,
        currentPhase: turnPhaseOrder[index - 1],
      });
      return;
    }

    if (!resolvedFirstPlayer || !resolvedActivePlayer) {
      return;
    }

    if (resolvedActivePlayer === resolvedFirstPlayer) {
      updateMatch({
        ...match,
        currentPhase: "battle_round_start",
      });
      return;
    }

    updateMatch({
      ...patchCurrentRound(match, {
        activePlayer: resolvedFirstPlayer,
      }),
      currentPhase: "end_of_turn",
    });
  }

  function previousRoundStart() {
    if (match.currentRound === 1) {
      updateMatch({
        ...patchCurrentRound(match, {
          activePlayer: "",
        }),
        currentPhase: "pre_battle",
      });
      return;
    }

    const previousRoundNumber = match.currentRound - 1;
    const previousRound = match.battleRounds.find(
      (candidate) => candidate.roundNumber === previousRoundNumber,
    );

    if (!previousRound) {
      return;
    }

    const previousFirstPlayer =
      previousRound.firstPlayer === "army_a" || previousRound.firstPlayer === "army_b"
        ? previousRound.firstPlayer
        : null;

    if (!previousFirstPlayer) {
      return;
    }

    updateMatch({
      ...match,
      battleRounds: match.battleRounds.map((candidate) =>
        candidate.roundNumber === previousRoundNumber
          ? {
              ...candidate,
              activePlayer: getOtherPlayer(previousFirstPlayer),
            }
          : candidate,
      ),
      currentPhase: "end_of_turn",
      currentRound: previousRoundNumber,
    });
  }

  function nextPhase() {
    if (!currentPhase || !resolvedActivePlayer || !resolvedFirstPlayer) {
      return;
    }

    const index = turnPhaseOrder.indexOf(currentPhase);
    const currentTurn = round.turnState[resolvedActivePlayer];
    const completedPhases = currentTurn.completedPhases.includes(currentPhase)
      ? currentTurn.completedPhases
      : [...currentTurn.completedPhases, currentPhase];

    const nextMatch = patchCurrentRound(match, {
      turnState: {
        ...round.turnState,
        [resolvedActivePlayer]: {
          ...currentTurn,
          completedPhases,
        },
      },
    });

    if (index < turnPhaseOrder.length - 1) {
      updateMatch({
        ...nextMatch,
        currentPhase: turnPhaseOrder[index + 1],
      });
      return;
    }

    const nextPlayer = getOtherPlayer(resolvedActivePlayer);
    const secondPlayer = getOtherPlayer(resolvedFirstPlayer);

    if (resolvedActivePlayer !== secondPlayer) {
      updateMatch({
        ...nextMatch,
        currentPhase: "start_of_turn",
        battleRounds: nextMatch.battleRounds.map((candidate) =>
          candidate.roundNumber === round.roundNumber
            ? {
                ...candidate,
                activePlayer: nextPlayer,
              }
            : candidate,
        ),
      });
      return;
    }

    if (match.currentRound < 4) {
      updateMatch({
        ...patchCurrentRound(nextMatch, {
          activePlayer: "",
        }),
        currentPhase: "battle_round_start",
        currentRound: match.currentRound + 1,
      });
      return;
    }

    updateMatch({
      ...patchCurrentRound(nextMatch, {
        activePlayer: "",
      }),
      currentPhase: "game_over",
      status: "completed",
    });
  }

  const roundStartReady =
    round.firstPlayer !== "" &&
    round.twistCard.trim() !== "" &&
    (match.currentRound === 1 || round.underdog !== "");

  if (match.currentPhase === "battle_round_start") {
    return (
      <section className="rounded-[32px] border border-line bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Battle Round {match.currentRound}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">Round start</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Lock in who goes first and what twist is in play before the turn phases begin.
        </p>
        <div className="mt-4 rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm leading-6 text-muted">
          {match.currentRound === 1
            ? "Round 1: the attacker takes the first turn and there is no underdog."
            : "Rounds 2-4: record the priority winner, choose first player, then set the underdog."}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {match.currentRound > 1 ? (
              <ChoiceSection
                choices={[
                  { label: armyALabel, value: "army_a" },
                  { label: armyBLabel, value: "army_b" },
                ]}
                label="Priority winner"
                onSelect={(value) => patchRound({ priorityWinner: value })}
                selected={round.priorityWinner}
              />
            ) : null}

            <ChoiceSection
              choices={
                match.currentRound === 1
                  ? attackerChoice
                    ? [{ label: playerLabel[attackerChoice], value: attackerChoice }]
                    : []
                  : [
                      { label: armyALabel, value: "army_a" },
                      { label: armyBLabel, value: "army_b" },
                    ]
              }
              label={match.currentRound === 1 ? "First player" : "First player"}
              onSelect={(value) =>
                patchRound({
                  activePlayer: value,
                  firstPlayer: value,
                })
              }
              selected={round.firstPlayer}
            />

            {match.currentRound > 1 ? (
              <ChoiceSection
                choices={[
                  { label: armyALabel, value: "army_a" },
                  { label: armyBLabel, value: "army_b" },
                ]}
                label="Underdog"
                onSelect={(value) => patchRound({ underdog: value })}
                selected={round.underdog}
              />
            ) : (
              <div className="rounded-2xl border border-line bg-black/10 px-4 py-4 text-sm leading-6 text-muted">
                No underdog is selected in battle round 1.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SelectField
              label={
                battlefieldSide === "aqshy"
                  ? "Twist card (Aqshy deck)"
                  : battlefieldSide === "ghyran"
                    ? "Twist card (Ghyran deck)"
                    : "Twist card"
              }
              onChange={(value) => patchRound({ twistCard: value })}
              options={twistOptions}
              placeholder={
                battlefieldSide === ""
                  ? "Choose battlefield side in pre-battle first"
                  : "Choose twist card"
              }
              value={round.twistCard}
            />
            <div className="rounded-2xl border border-line bg-black/10 px-4 py-4 text-sm leading-6 text-muted">
              {battlefieldSide === ""
                ? "The twist deck comes from the battlefield side chosen in pre-battle."
                : `Using the ${battlefieldSide === "aqshy" ? "Aqshy" : "Ghyran"} twist deck.`}
            </div>
            <BattleTacticCardHelperSection
              match={match}
              onToggleComplete={(player) =>
                patchRound({
                  battleTacticCardStepComplete: {
                    ...round.battleTacticCardStepComplete,
                    [player]: !round.battleTacticCardStepComplete[player],
                  },
                })
              }
              playerLabel={playerLabel}
              scoreDifference={scoreDifference}
              seizedInitiativePlayer={seizedInitiativePlayer}
            />
            <button
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
              onClick={() => setActiveRuleContent(getRoundStartReminderContent(match.currentRound))}
              type="button"
            >
              Open reminders
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
            onClick={previousRoundStart}
            type="button"
          >
            Previous step
          </button>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-[#6e5a3a] disabled:text-[#d7c7aa]"
            disabled={!roundStartReady}
            onClick={startRound}
            type="button"
          >
            Start first turn
          </button>
        </div>
        <RulesModal content={activeRuleContent} onClose={() => setActiveRuleContent(null)} />
      </section>
    );
  }

  if (!currentPhase || !resolvedActivePlayer) {
    return null;
  }

  const guide = phaseGuide[currentPhase];
  const activeArmySummary = armySummaryBySlot[resolvedActivePlayer];
  const activeChargeRules = activeArmySummary?.phaseRules.charge ?? [];
  const activeHeroRules = activeArmySummary?.phaseRules.hero ?? [];
  const activeMovementRules = activeArmySummary?.phaseRules.movement ?? [];
  const activeShootingRules = activeArmySummary?.phaseRules.shooting ?? [];
  const completedChargeRules =
    round.turnState[resolvedActivePlayer].phaseChecklistCompletion.charge ?? [];
  const completedHeroRules =
    round.turnState[resolvedActivePlayer].phaseChecklistCompletion.hero ?? [];
  const completedMovementRules =
    round.turnState[resolvedActivePlayer].phaseChecklistCompletion.movement ?? [];
  const completedShootingRules =
    round.turnState[resolvedActivePlayer].phaseChecklistCompletion.shooting ?? [];
  const combatActivations = round.turnState[resolvedActivePlayer].combatActivationByArmy;
  const combatStepCompletion = round.turnState[resolvedActivePlayer].combatStepCompletion;
  const reminderContent = getReminderContent(currentPhase, match.currentRound);

  return (
    <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[32px] border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Turn timeline
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          {playerLabel[resolvedActivePlayer]} is taking their turn in round {match.currentRound}.
        </p>
        <div className="mt-5 space-y-5">
          <TurnLane
            currentPhase={currentPhase}
            isActive={
              resolvedFirstPlayer === "army_a"
                ? resolvedActivePlayer === "army_a"
                : resolvedActivePlayer === "army_b"
            }
            label={
              resolvedFirstPlayer === "army_a" ? `${armyALabel} turn` : `${armyBLabel} turn`
            }
            turnState={
              resolvedFirstPlayer === "army_a" ? round.turnState.army_a : round.turnState.army_b
            }
          />
          <TurnLane
            currentPhase={currentPhase}
            isActive={
              resolvedFirstPlayer === "army_a"
                ? resolvedActivePlayer === "army_b"
                : resolvedActivePlayer === "army_a"
            }
            label={
              resolvedFirstPlayer === "army_a" ? `${armyBLabel} turn` : `${armyALabel} turn`
            }
            turnState={
              resolvedFirstPlayer === "army_a" ? round.turnState.army_b : round.turnState.army_a
            }
          />
        </div>
      </aside>

      <section className="rounded-[32px] border border-line bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {playerLabel[resolvedActivePlayer]}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <InfoCard label="Round" value={`Battle Round ${match.currentRound}`} />
          <InfoCard label="Active Player" value={playerLabel[resolvedActivePlayer]} />
          <InfoCard
            label="First Player"
            value={resolvedFirstPlayer ? playerLabel[resolvedFirstPlayer] : "Not set"}
          />
          <InfoCard
            label="Underdog"
            value={
              match.currentRound === 1
                ? "None in round 1"
                : round.underdog
                  ? playerLabel[round.underdog]
                  : "Not set"
            }
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <InfoCard label={`${armyALabel} Total VP`} value={String(scoreTotals.army_a)} />
          <InfoCard label={`${armyBLabel} Total VP`} value={String(scoreTotals.army_b)} />
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">{guide.title}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{guide.whatHappens}</p>
        <div className="mt-4">
          <button
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
            onClick={() => setActiveRuleContent(reminderContent)}
            type="button"
          >
            Open reminders
          </button>
        </div>

        {checklistPhases.has(currentPhase) ? (
          <PhaseChecklistSection
            completedRules={
              currentPhase === "hero"
                ? completedHeroRules
                : currentPhase === "movement"
                  ? completedMovementRules
                : currentPhase === "shooting"
                  ? completedShootingRules
                  : completedChargeRules
            }
            emptyMessage={
              currentPhase === "hero"
                ? "No dedicated hero-phase unit checklist is defined for this army yet."
                : currentPhase === "movement"
                  ? "This army does not have any army-specific movement rules to track."
                : currentPhase === "shooting"
                  ? "This army does not have any default shooting units to track."
                  : "This army does not have any charge-phase specific rules to track."
            }
            label={
              currentPhase === "hero"
                ? "Hero Phase Checklist"
                : currentPhase === "movement"
                  ? "Movement Phase Checklist"
                : currentPhase === "shooting"
                  ? "Shooting Checklist"
                  : "Charge Phase Checklist"
            }
            onOpenRule={(rule) =>
              setActiveRuleContent({
                bullets: rule.details,
                sourceLabel: rule.sourceLabel ?? "Local Spearhead army data",
                sourceUrl: rule.sourceUrl,
                title: rule.unitName ? `${rule.unitName}: ${rule.title}` : rule.title,
              })
            }
            onToggle={(ruleId) =>
              setChecklistCompletion(
                currentPhase === "hero"
                  ? "hero"
                  : currentPhase === "movement"
                    ? "movement"
                  : currentPhase === "shooting"
                    ? "shooting"
                    : "charge",
                ruleId,
              )
            }
            rules={
              currentPhase === "hero"
                ? activeHeroRules
                : currentPhase === "movement"
                  ? activeMovementRules
                : currentPhase === "shooting"
                  ? activeShootingRules
                  : activeChargeRules
            }
          />
        ) : null}

        {currentPhase === "combat" ? (
          <>
            <CombatStepSection
              completion={combatStepCompletion}
              onToggle={setCombatStepCompletion}
            />
            <CombatActivationSection
              armyALabel={armyALabel}
              armyAUnits={armySummaryBySlot.army_a?.combatUnits ?? []}
              armyBLabel={armyBLabel}
              armyBUnits={armySummaryBySlot.army_b?.combatUnits ?? []}
              completions={combatActivations}
              onToggle={toggleCombatActivation}
            />
          </>
        ) : null}

        {currentPhase === "end_of_turn" ? (
          <section className="mt-6 rounded-2xl border border-line bg-black/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                End of turn scoring
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ToggleCard
                  checked={round.turnState[resolvedActivePlayer].controlsAtLeastOneObjective}
                  label="Controls at least 1 objective"
                  onClick={() =>
                    setTurnScoring({
                      controlsAtLeastOneObjective:
                        !round.turnState[resolvedActivePlayer].controlsAtLeastOneObjective,
                    })
                  }
                />
                <ToggleCard
                  checked={round.turnState[resolvedActivePlayer].controlsTwoOrMoreObjectives}
                  label="Controls 2 or more objectives"
                  onClick={() =>
                    setTurnScoring({
                      controlsTwoOrMoreObjectives:
                        !round.turnState[resolvedActivePlayer].controlsTwoOrMoreObjectives,
                    })
                  }
                />
                <ToggleCard
                  checked={round.turnState[resolvedActivePlayer].controlsMoreObjectives}
                  label="Controls more objectives than opponent"
                  onClick={() =>
                    setTurnScoring({
                      controlsMoreObjectives:
                        !round.turnState[resolvedActivePlayer].controlsMoreObjectives,
                    })
                  }
                />
                <NumberField
                  label="Completed battle tactics this turn"
                  onChange={(value) =>
                    setTurnScoring({
                      completedBattleTactics: value,
                    })
                  }
                  value={round.turnState[resolvedActivePlayer].completedBattleTactics}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Total VP this turn</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {round.turnState[resolvedActivePlayer].totalVictoryPoints}
                </p>
              </div>
            </section>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
            onClick={previousPhase}
            type="button"
          >
            Previous step
          </button>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong"
            onClick={nextPhase}
            type="button"
          >
            {currentPhase === "end_of_turn"
              ? resolvedFirstPlayer && resolvedActivePlayer === getOtherPlayer(resolvedFirstPlayer)
                ? match.currentRound === 4
                  ? "Finish game"
                  : "Start next round"
                : "Pass to other player"
              : "Next phase"}
          </button>
        </div>
        <RulesModal content={activeRuleContent} onClose={() => setActiveRuleContent(null)} />
      </section>
    </section>
  );
}

type TurnLaneProps = {
  currentPhase: TurnPhaseKey;
  isActive: boolean;
  label: string;
  turnState: MatchRecord["battleRounds"][number]["turnState"][MatchPlayerSlot];
};

function TurnLane({ currentPhase, isActive, label, turnState }: TurnLaneProps) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</p>
      <ol className="mt-3 space-y-3">
        {turnPhaseOrder.map((phase) => {
          const phaseMeta = phaseGuide[phase];
          const isCurrent = isActive && phase === currentPhase;
          const isCompleted = turnState.completedPhases.includes(phase);

          return (
            <li
              className={`rounded-2xl border px-4 py-3 ${
                isCurrent
                  ? "border-accent bg-accent/10"
                  : isCompleted
                    ? "border-line bg-black/10"
                    : "border-line/60 bg-black/5"
              }`}
              key={`${label}-${phase}`}
            >
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{phaseMeta.title}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-accent">
                {isCurrent ? "Current" : isCompleted ? "Done" : "Upcoming"}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type ChoiceSectionProps = {
  choices: { label: string; value: MatchPlayerSlot }[];
  label: string;
  onSelect: (value: MatchPlayerSlot) => void;
  selected: MatchPlayerSlot | "";
};

function ChoiceSection({ choices, label, onSelect, selected }: ChoiceSectionProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</p>
      <div className="mt-3 grid gap-3">
        {choices.map((choice) => (
          <button
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              selected === choice.value
                ? "border-accent bg-accent/10 text-foreground"
                : "border-line bg-black/10 text-muted hover:border-accent"
            }`}
            key={choice.value}
            onClick={() => onSelect(choice.value)}
            type="button"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  value: string;
};

function SelectField({ label, onChange, options, placeholder, value }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <select
        className="rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type PhaseChecklistSectionProps = {
  completedRules: string[];
  emptyMessage: string;
  label: string;
  onOpenRule: (rule: PhaseRule) => void;
  onToggle: (ruleId: string) => void;
  rules: PhaseRule[];
};

function PhaseChecklistSection({
  completedRules,
  emptyMessage,
  label,
  onOpenRule,
  onToggle,
  rules,
}: PhaseChecklistSectionProps) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-black/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</p>
      {rules.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {rules.map((rule) => {
            const isComplete = completedRules.includes(rule.id);

            return (
              <div
                className="rounded-2xl border border-line bg-black/10 px-4 py-4"
                key={rule.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {rule.unitName ? `${rule.unitName}: ${rule.title}` : rule.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {rule.details[0]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
                      onClick={() => onOpenRule(rule)}
                      type="button"
                    >
                      Rules
                    </button>
                    <button
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                        isComplete
                          ? "bg-accent text-[#20160d]"
                          : "border border-line text-muted hover:border-accent hover:text-accent-strong"
                      }`}
                      onClick={() => onToggle(rule.id)}
                      type="button"
                    >
                      {isComplete ? "Complete" : "Mark complete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type CombatStepSectionProps = {
  completion: PlayerTurnState["combatStepCompletion"];
  onToggle: (step: "strikeFirst" | "normal" | "strikeLast") => void;
};

function CombatStepSection({ completion, onToggle }: CombatStepSectionProps) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-black/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        Combat activation order
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ToggleCard
          checked={completion.strikeFirst}
          label="Strike-first units resolved"
          onClick={() => onToggle("strikeFirst")}
        />
        <ToggleCard
          checked={completion.normal}
          label="Normal activations resolved"
          onClick={() => onToggle("normal")}
        />
        <ToggleCard
          checked={completion.strikeLast}
          label="Strike-last units resolved"
          onClick={() => onToggle("strikeLast")}
        />
      </div>
    </section>
  );
}

type CombatActivationSectionProps = {
  armyALabel: string;
  armyAUnits: string[];
  armyBLabel: string;
  armyBUnits: string[];
  completions: Record<MatchPlayerSlot, string[]>;
  onToggle: (player: MatchPlayerSlot, unitName: string) => void;
};

function CombatActivationSection({
  armyALabel,
  armyAUnits,
  armyBLabel,
  armyBUnits,
  completions,
  onToggle,
}: CombatActivationSectionProps) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-black/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        Unit fight tracker
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <UnitTrackerColumn
          checkedUnits={completions.army_a}
          label={armyALabel}
          onToggle={(unitName) => onToggle("army_a", unitName)}
          units={armyAUnits}
        />
        <UnitTrackerColumn
          checkedUnits={completions.army_b}
          label={armyBLabel}
          onToggle={(unitName) => onToggle("army_b", unitName)}
          units={armyBUnits}
        />
      </div>
    </section>
  );
}

type UnitTrackerColumnProps = {
  checkedUnits: string[];
  label: string;
  onToggle: (unitName: string) => void;
  units: string[];
};

function UnitTrackerColumn({
  checkedUnits,
  label,
  onToggle,
  units,
}: UnitTrackerColumnProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{label}</p>
      {units.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted">No combat units listed yet.</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {units.map((unitName) => (
            <ToggleCard
              checked={checkedUnits.includes(unitName)}
              key={unitName}
              label={unitName}
              onClick={() => onToggle(unitName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ToggleCardProps = {
  checked: boolean;
  label: string;
  onClick: () => void;
};

function ToggleCard({ checked, label, onClick }: ToggleCardProps) {
  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        checked
          ? "border-accent bg-accent/10 text-foreground"
          : "border-line bg-panel text-muted hover:border-accent"
      }`}
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em]">
        {checked ? "Complete" : "Pending"}
      </p>
    </button>
  );
}

type NumberFieldProps = {
  label: string;
  onChange: (value: number) => void;
  value: number;
};

function NumberField({ label, onChange, value }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <input
        className="rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
        min={0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        type="number"
        value={value}
      />
    </label>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-black/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

type BattleTacticCardHelperSectionProps = {
  match: MatchRecord;
  onToggleComplete: (player: MatchPlayerSlot) => void;
  playerLabel: Record<MatchPlayerSlot, string>;
  scoreDifference: number;
  seizedInitiativePlayer: MatchPlayerSlot | null;
};

function BattleTacticCardHelperSection({
  match,
  onToggleComplete,
  playerLabel,
  scoreDifference,
  seizedInitiativePlayer,
}: BattleTacticCardHelperSectionProps) {
  const round = getRoundState(match);

  if (!round) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-line bg-black/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        Battle Tactic Card Helpers
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        Use two identical battle tactic decks of 12 cards, one deck per player.
      </p>
      <div className="mt-4 grid gap-3">
        {(["army_a", "army_b"] as MatchPlayerSlot[]).map((player) => {
          const isUnderdog = round.underdog === player;
          const cannotDrawBecauseOfSeize =
            match.currentRound > 1 &&
            seizedInitiativePlayer === player &&
            !(isUnderdog && scoreDifference >= 5);

          const instruction =
            match.currentRound === 1
              ? "Draw 3 battle tactic cards."
              : cannotDrawBecauseOfSeize
                ? "Seized the initiative: do not draw battle tactic cards this round."
                : "You may discard any number of cards, then draw until you have 3 in hand.";

          return (
            <div className="rounded-2xl border border-line bg-panel px-4 py-4" key={player}>
              <p className="text-sm font-semibold text-foreground">{playerLabel[player]}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{instruction}</p>
              {cannotDrawBecauseOfSeize ? (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-accent">
                  No draw unless underdog and behind by 5 or more VP.
                </p>
              ) : null}
              <button
                className={`mt-3 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  round.battleTacticCardStepComplete[player]
                    ? "bg-accent text-[#20160d]"
                    : "border border-line text-muted hover:border-accent hover:text-accent-strong"
                }`}
                onClick={() => onToggleComplete(player)}
                type="button"
              >
                {round.battleTacticCardStepComplete[player] ? "Cards ready" : "Mark cards ready"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getRoundStartReminderContent(roundNumber: number): RuleContent {
  return {
    bullets:
      roundNumber === 1
        ? [
            "Round 1 uses the attacker as first player.",
            "There is no underdog in battle round 1.",
            "Draw or choose the twist card from the deck tied to the battlefield side chosen in pre-battle.",
            "Each player should have their own identical battle tactic deck of 12 cards.",
            "At the start of the first battle round, each player draws 3 battle tactic cards."
          ]
        : [
            "For rounds 2 to 4, record the priority winner first.",
            "Then choose the first player for the round.",
            "Set the underdog before starting the first turn.",
            "Draw or choose the twist card from the matching battlefield-side deck.",
            "Each player should have their own identical battle tactic deck of 12 cards.",
            "Players may discard any number of battle tactic cards, then draw until they have 3 in hand.",
            "If the player who went second last round wins priority and chooses to go first, they seized the initiative and do not draw battle tactic cards this round unless they are the underdog and behind by 5 or more VP."
          ],
    sourceLabel: "Local Spearhead round runner guidance",
    title: `Battle Round ${roundNumber} Start Reminders`,
  };
}

function getReminderContent(phase: TurnPhaseKey, roundNumber: number): RuleContent {
  switch (phase) {
    case "start_of_turn":
      return {
        bullets: [
          `Confirm battle round ${roundNumber}, active player, twist card, and any round-wide effects.`,
          "Make sure both players agree what was chosen during the round-start step before proceeding.",
          "Carry forward any phase-specific army abilities that must be remembered this turn."
        ],
        sourceLabel: "Local Spearhead turn runner guidance",
        title: "Start of Turn Reminders",
      };
    case "hero":
      return {
        bullets: [
          "Resolve the active army's hero-phase abilities before moving on.",
          "If a rule was updated by a current rules update PDF, use the updated timing rather than older print timing.",
          "Mark each ability complete as you resolve it so you do not lose track mid-turn."
        ],
        sourceLabel: "Local Spearhead turn runner guidance",
        title: "Hero Phase Reminders",
      };
    case "movement":
      return {
        bullets: [
          "`Run` and `Retreat` are still movement. Measure the whole path, not just where the model starts and ends.",
          "When a model makes a normal move, run, or retreat, no part of its base can travel within `3\"` of an enemy model unless a rule specifically allows it.",
          "A unit that ran this turn cannot use `Shoot` or `Charge` later in the same turn.",
          "A unit that retreated this turn cannot use `Shoot` or `Charge` later in the same turn unless a rule specifically allows it.",
          "Retreating units start in combat, but the retreat move still needs to carry them out so they are no longer within enemy combat ranges when the move ends.",
          "Pivots count as movement. A model can turn as often as you like, but no part of its base can move farther than the maximum distance allowed by the ability being used."
        ],
        sourceLabel: "Current AoS core rules summary",
        sourceUrl: "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_therules_eng_24.09-tbf4egjql3.pdf",
        title: "Movement Reminders",
      };
    case "shooting":
      return {
        bullets: [
          "Only units with relevant ranged attacks need to appear in the shooting checklist.",
          "A unit cannot use `Shoot` if it used `Run` or `Retreat` earlier this turn.",
          "Units in combat cannot normally shoot unless a weapon or warscroll rule specifically allows it, such as `Shoot in Combat`.",
          "Declare all target units before resolving any of that unit's shooting attacks, and remember that attacks can be split between eligible targets.",
          "A unit can only use one Core ability per phase, so if it is using `Shoot`, that is its Core action for the shooting phase."
        ],
        sourceLabel: "Current AoS core rules summary",
        sourceUrl: "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_therules_eng_24.09-tbf4egjql3.pdf",
        title: "Shooting Reminders",
      };
    case "charge":
      return {
        bullets: [
          "Only units that did not use `Run` or `Retreat` earlier in the turn can use the `Charge` ability.",
          "Roll the charge and move the unit up to that result, measuring the whole path just like any other move.",
          "The charge move must end within `1/2\"` of at least one visible enemy unit when the move finishes.",
          "You do not have to end within `1/2\"` of an enemy that was visible when the charge started; it only matters what is visible when the charge move ends.",
          "Pivots still count as movement during a charge, and no part of the base can move farther than the charge distance rolled."
        ],
        sourceLabel: "Current AoS core rules summary",
        sourceUrl: "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_therules_eng_24.09-tbf4egjql3.pdf",
        title: "Charge Reminders",
      };
    case "combat":
      return {
        bullets: [
          "Resolve any non-`Fight` combat-phase abilities first, then start combat activations.",
          "A unit can use `Fight` if it is in combat or if it charged this turn. When it uses `Fight`, it can make a pile-in move first.",
          "So pile-in moves are not limited only to units that charged; units already in combat can also pile in when they use `Fight`.",
          "If any units in combat had `Strike-first` at the start of the phase, only those units can be picked to fight until all of them have fought.",
          "After all `Strike-first` units have fought, the active player picks the next unit to fight, then players continue choosing eligible units one at a time.",
          "Units with `Strike-last` cannot be picked while there are any units in combat without `Strike-last` that have not yet fought.",
          "Abilities that let a unit fight immediately after another unit do not override `Strike-first` or `Strike-last` restrictions.",
          "The combat phase ends once every eligible unit in combat that can fight has been activated or there are no more legal fight picks remaining.",
          "Attack sequence reminder: attacks -> hit rolls -> wound or defence rolls -> ward rolls -> apply damage."
        ],
        sourceLabel: "Current AoS core rules summary",
        sourceUrl: "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_therules_eng_24.09-tbf4egjql3.pdf",
        title: "Combat Reminders",
      };
    case "end_of_turn":
      return {
        bullets: [
          "Resolve any end-of-turn abilities and effects before locking in scoring.",
          "Check objective control after all combat and movement effects for the turn are finished.",
          "Record battle tactic completion now, along with any rules that change control scores or objective state.",
          "Make sure both players agree on the VP total before passing to the next player or starting the next round."
        ],
        sourceLabel: "Local Spearhead scoring guidance",
        title: "End of Turn Reminders",
      };
  }
}
