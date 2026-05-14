"use client";

import Link from "next/link";
import { BattleRoundRunner } from "@/components/battle-round-runner";
import { PreBattleRunner } from "@/components/pre-battle-runner";
import { getArmyById, getArmySummaryById, listArmies } from "@/lib/spearhead-data/armies";
import { useMatchStore } from "@/lib/game-state/match-store";
import { saveMatch } from "@/lib/game-state/match-storage";
import type { MatchRecord } from "@/lib/game-state/match-types";

type GameRunnerShellProps = {
  matchId: string;
};

export function GameRunnerShell({ matchId }: GameRunnerShellProps) {
  const match = useMatchStore(matchId);

  if (!match) {
    return (
      <main className="flex h-full items-center justify-center px-6">
        <div className="max-w-xl rounded-[28px] border border-danger/40 bg-panel p-8 text-center shadow-2xl shadow-black/30">
          <p className="text-lg font-semibold text-foreground">
            This match could not be found in local storage.
          </p>
          <Link
            className="mt-5 inline-flex rounded-full border border-line px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
            href="/"
          >
            Return to setup
          </Link>
        </div>
      </main>
    );
  }

  const armies = listArmies();
  const armyA = getArmyById(match.armyAId) ?? getArmySummaryById(match.armyAId);
  const armyB = getArmyById(match.armyBId) ?? getArmySummaryById(match.armyBId);

  function handleMatchChange(nextMatch: MatchRecord) {
    saveMatch(nextMatch);
  }

  return (
    <main className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)] overflow-hidden">
      <aside className="border-r border-line bg-panel px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Match
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-none text-foreground">
          Command Table
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The command table now handles pre-battle setup, battle round start,
          and turn-by-turn phase flow.
        </p>

        <div className="mt-8 space-y-4">
          <section className="rounded-3xl border border-line bg-panel-strong p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Army A
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {armyA?.name ?? match.armyAId}
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-panel-strong p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Army B
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {armyB?.name ?? match.armyBId}
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-panel-strong p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Current mode
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {match.currentPhase === "battle_round_start"
                ? `Battle round ${match.currentRound} start`
                : match.currentPhase === "game_over"
                  ? "Game over"
                  : match.currentPhase === "pre_battle" || match.currentPhase === "setup"
                    ? "Pre-battle setup"
                    : "Active turn"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Track who acts, when each phase happens, and what needs to be resolved before moving forward.
            </p>
          </section>
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {match.currentPhase === "pre_battle" || match.currentPhase === "setup" ? (
            <PreBattleRunner
              armyALabel={armyA?.name ?? match.armyAId}
              armyBLabel={armyB?.name ?? match.armyBId}
              match={match}
              onChange={handleMatchChange}
            />
          ) : match.currentPhase === "game_over" ? (
            <section className="rounded-[32px] border border-line bg-panel p-6 shadow-2xl shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Final state
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                Four battle rounds complete
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                The game flow scaffold now runs from setup through all four rounds. Next we can deepen scoring, tactics, and round history.
              </p>
            </section>
          ) : (
            <BattleRoundRunner
              armyALabel={armyA?.name ?? match.armyAId}
              armyBLabel={armyB?.name ?? match.armyBId}
              match={match}
              onChange={handleMatchChange}
            />
          )}

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[32px] border border-line bg-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Match State
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <dt className="text-xs uppercase tracking-[0.24em] text-muted">
                    Match ID
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-foreground">
                    {match.id}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <dt className="text-xs uppercase tracking-[0.24em] text-muted">
                    Status
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-foreground">
                    {match.status}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <dt className="text-xs uppercase tracking-[0.24em] text-muted">
                    Round
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-foreground">
                    {match.currentRound}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <dt className="text-xs uppercase tracking-[0.24em] text-muted">
                    Phase
                  </dt>
                  <dd className="mt-2 text-sm font-semibold capitalize text-foreground">
                    {match.currentPhase}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[32px] border border-line bg-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Rules Data
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                Supported armies
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                {armies.map((army) => (
                  <li key={army.id}>{army.name}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
