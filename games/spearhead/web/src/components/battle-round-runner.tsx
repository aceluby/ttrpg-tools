"use client";

import type { MatchPlayerSlot, MatchRecord, TurnPhaseKey } from "@/lib/game-state/match-types";
import {
  calculateMatchVictoryPoints,
  calculateTurnVictoryPoints,
  getOtherPlayer,
  getRoundState,
  patchCurrentRound,
  phaseGuide,
  turnPhaseOrder,
} from "@/lib/rules/battle-rounds";

type BattleRoundRunnerProps = {
  armyALabel: string;
  armyBLabel: string;
  match: MatchRecord;
  onChange: (nextMatch: MatchRecord) => void;
};

export function BattleRoundRunner({
  armyALabel,
  armyBLabel,
  match,
  onChange,
}: BattleRoundRunnerProps) {
  const round = getRoundState(match);

  if (!round) {
    return null;
  }

  const playerLabel = {
    army_a: armyALabel,
    army_b: armyBLabel,
  } as const;
  const activePlayer = round.activePlayer || round.firstPlayer;
  const resolvedActivePlayer =
    activePlayer === "army_a" || activePlayer === "army_b" ? activePlayer : null;
  const resolvedFirstPlayer =
    round.firstPlayer === "army_a" || round.firstPlayer === "army_b"
      ? round.firstPlayer
      : null;
  const currentPhase = match.currentPhase === "battle_round_start"
    ? null
    : (match.currentPhase as TurnPhaseKey);
  const attackerChoice =
    match.preBattleSetup.attacker === "army_a" || match.preBattleSetup.attacker === "army_b"
      ? match.preBattleSetup.attacker
      : null;
  const scoreTotals = {
    army_a: calculateMatchVictoryPoints(match, "army_a"),
    army_b: calculateMatchVictoryPoints(match, "army_b"),
  };

  function updateMatch(nextMatch: MatchRecord) {
    onChange({
      ...nextMatch,
      status: "in_progress",
    });
  }

  function patchRound(patch: Partial<typeof round>) {
    updateMatch(patchCurrentRound(match, patch));
  }

  function startRound() {
    if (!round.firstPlayer || !round.underdog) {
      return;
    }

    updateMatch({
      ...patchCurrentRound(match, {
        activePlayer: round.firstPlayer,
      }),
      currentPhase: "start_of_turn",
    });
  }

  function setPhaseNote(phase: TurnPhaseKey, value: string) {
    if (!resolvedActivePlayer) {
      return;
    }

    patchRound({
      turnState: {
        ...round.turnState,
        [resolvedActivePlayer]: {
          ...round.turnState[resolvedActivePlayer],
          phaseNotes: {
            ...round.turnState[resolvedActivePlayer].phaseNotes,
            [phase]: value,
          },
        },
      },
    });
  }

  function setTurnScoring(
    patch: Partial<MatchRecord["battleRounds"][number]["turnState"][MatchPlayerSlot]>,
  ) {
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

  function previousPhase() {
    if (!currentPhase) {
      return;
    }

    const index = turnPhaseOrder.indexOf(currentPhase);

    if (index <= 0) {
      updateMatch({
        ...match,
        currentPhase: "battle_round_start",
      });
      return;
    }

    updateMatch({
      ...match,
      currentPhase: turnPhaseOrder[index - 1],
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

  const roundStartReady = round.firstPlayer !== "" && round.underdog !== "";

  if (match.currentPhase === "battle_round_start") {
    return (
      <section className="rounded-[32px] border border-line bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Battle Round {match.currentRound}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          Round start
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Lock in who goes first, who the underdog is, what twist is in play,
          and what each player is trying to achieve before the turn phases begin.
        </p>
        <div className="mt-4 rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm leading-6 text-muted">
          {match.currentRound === 1
            ? "Round 1: the attacker chooses who takes the first turn."
            : "Rounds 2-4: record the priority winner first, then choose which player takes the first turn."}
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
              label={match.currentRound === 1 ? "First player (attacker chooses)" : "First player"}
              onSelect={(value) =>
                patchRound({
                  activePlayer: value,
                  firstPlayer: value,
                })
              }
              selected={round.firstPlayer}
            />
            {match.currentRound === 1 ? (
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Attacker: {attackerChoice ? playerLabel[attackerChoice] : "Finish pre-battle first"}
              </p>
            ) : null}

            <ChoiceSection
              choices={[
                { label: armyALabel, value: "army_a" },
                { label: armyBLabel, value: "army_b" },
              ]}
              label="Underdog"
              onSelect={(value) => patchRound({ underdog: value })}
              selected={round.underdog}
            />
          </div>

          <div className="space-y-4">
            <TextField
              label="Twist card"
              onChange={(value) => patchRound({ twistCard: value })}
              value={round.twistCard}
            />
            <TextArea
              label={`${armyALabel} battle tactics notes`}
              onChange={(value) =>
                patchRound({
                  battleTacticNotes: {
                    ...round.battleTacticNotes,
                    army_a: value,
                  },
                })
              }
              value={round.battleTacticNotes.army_a}
            />
            <TextArea
              label={`${armyBLabel} battle tactics notes`}
              onChange={(value) =>
                patchRound({
                  battleTacticNotes: {
                    ...round.battleTacticNotes,
                    army_b: value,
                  },
                })
              }
              value={round.battleTacticNotes.army_b}
            />
            <TextArea
              label="Start of battle round abilities"
              onChange={(value) => patchRound({ startOfBattleRoundAbilities: value })}
              value={round.startOfBattleRoundAbilities}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-[#6e5a3a] disabled:text-[#d7c7aa]"
            disabled={!roundStartReady}
            onClick={startRound}
            type="button"
          >
            Start first turn
          </button>
        </div>
      </section>
    );
  }

  if (!currentPhase) {
    return null;
  }

  if (!resolvedActivePlayer) {
    return null;
  }

  const guide = phaseGuide[currentPhase];

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
            isActive={resolvedFirstPlayer === "army_a" ? resolvedActivePlayer === "army_a" : resolvedActivePlayer === "army_b"}
            label={
              resolvedFirstPlayer === "army_a"
                ? `${armyALabel} turn`
                : `${armyBLabel} turn`
            }
            turnState={
              resolvedFirstPlayer === "army_a"
                ? round.turnState.army_a
                : round.turnState.army_b
            }
          />
          <TurnLane
            currentPhase={currentPhase}
            isActive={resolvedFirstPlayer === "army_a" ? resolvedActivePlayer === "army_b" : resolvedActivePlayer === "army_a"}
            label={
              resolvedFirstPlayer === "army_a"
                ? `${armyBLabel} turn`
                : `${armyALabel} turn`
            }
            turnState={
              resolvedFirstPlayer === "army_a"
                ? round.turnState.army_b
                : round.turnState.army_a
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
          <InfoCard label="Underdog" value={round.underdog ? playerLabel[round.underdog] : "Not set"} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <InfoCard label={`${armyALabel} Total VP`} value={String(scoreTotals.army_a)} />
          <InfoCard label={`${armyBLabel} Total VP`} value={String(scoreTotals.army_b)} />
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          {guide.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          {guide.whatHappens}
        </p>

        <ul className="mt-6 grid gap-3 text-sm leading-6 text-muted md:grid-cols-2">
          {guide.actions.map((action) => (
            <li
              className="rounded-2xl border border-line bg-black/10 px-4 py-3"
              key={action}
            >
              {action}
            </li>
          ))}
        </ul>

        <TextArea
          label={`${guide.title} notes`}
          onChange={(value) => setPhaseNote(currentPhase, value)}
          value={round.turnState[resolvedActivePlayer].phaseNotes[currentPhase] ?? ""}
        />

        {currentPhase === "end_of_turn" ? (
          <>
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
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Total VP this turn
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {round.turnState[resolvedActivePlayer].totalVictoryPoints}
                </p>
              </div>
            </section>

            <TextArea
              label="Scoring and turn-end notes"
              onChange={(value) => setTurnScoring({ scoringNotes: value })}
              value={round.turnState[resolvedActivePlayer].scoringNotes}
            />
          </>
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
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
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
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                {phaseMeta.title}
              </p>
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
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
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

type TextFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function TextField({ label, onChange, value }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <input
        className="rounded-2xl border border-line bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

type TextAreaProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function TextArea({ label, onChange, value }: TextAreaProps) {
  return (
    <label className="mt-6 flex flex-col gap-2">
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
        {checked ? "Scored" : "Not scored"}
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
        className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
        min={0}
        onChange={(event) => onChange(Number(event.target.value || "0"))}
        step={1}
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
