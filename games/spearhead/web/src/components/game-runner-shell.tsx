"use client";

import { useState } from "react";
import Link from "next/link";
import { BattleRoundRunner } from "@/components/battle-round-runner";
import { PdfModal } from "@/components/pdf-modal";
import { PreBattleRunner } from "@/components/pre-battle-runner";
import { getArmyById, getArmySummaryById, listArmies } from "@/lib/spearhead-data/armies";
import { useMatchStore } from "@/lib/game-state/match-store";
import { saveMatch } from "@/lib/game-state/match-storage";
import type { MatchRecord } from "@/lib/game-state/match-types";
import { calculateMatchVictoryPoints } from "@/lib/rules/battle-rounds";

type GameRunnerShellProps = {
  matchId: string;
};

export function GameRunnerShell({ matchId }: GameRunnerShellProps) {
  const match = useMatchStore(matchId);
  const [selectedArmyPdf, setSelectedArmyPdf] = useState<{
    pdfPath: string;
    pdfUrl?: string;
    title: string;
  } | null>(null);

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

  const armyA = getArmyById(match.armyAId) ?? getArmySummaryById(match.armyAId);
  const armyB = getArmyById(match.armyBId) ?? getArmySummaryById(match.armyBId);
  const armies = listArmies();
  const armyAScore = calculateMatchVictoryPoints(match, "army_a");
  const armyBScore = calculateMatchVictoryPoints(match, "army_b");
  const winnerLabel =
    armyAScore === armyBScore
      ? "Draw"
      : armyAScore > armyBScore
        ? (armyA?.name ?? match.armyAId)
        : (armyB?.name ?? match.armyBId);

  function handleMatchChange(nextMatch: MatchRecord) {
    saveMatch(nextMatch);
  }

  function stepBackFromGameOver() {
    if (!match) {
      return;
    }

    const finalRound = match.battleRounds.find((round) => round.roundNumber === 4);
    const finalFirstPlayer =
      finalRound?.firstPlayer === "army_a" || finalRound?.firstPlayer === "army_b"
        ? finalRound.firstPlayer
        : null;

    if (!finalRound || !finalFirstPlayer) {
      return;
    }

    handleMatchChange({
      ...match,
      battleRounds: match.battleRounds.map((round) =>
        round.roundNumber === 4
          ? {
              ...round,
              activePlayer:
                finalFirstPlayer === "army_a"
                  ? "army_b"
                  : "army_a",
            }
          : round,
      ),
      currentPhase: "end_of_turn",
      currentRound: 4,
      status: "in_progress",
    });
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
            {armyA ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
                  onClick={() =>
                    setSelectedArmyPdf({
                      pdfPath: armyA.localPdfPath,
                      pdfUrl: armyA.rulesPdfUrl,
                      title: armyA.name,
                    })
                  }
                  type="button"
                >
                  Quick view
                </button>
                <a
                  className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
                  href={armyA.localPdfPath}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open PDF
                </a>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-line bg-panel-strong p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Army B
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {armyB?.name ?? match.armyBId}
            </p>
            {armyB ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
                  onClick={() =>
                    setSelectedArmyPdf({
                      pdfPath: armyB.localPdfPath,
                      pdfUrl: armyB.rulesPdfUrl,
                      title: armyB.name,
                    })
                  }
                  type="button"
                >
                  Quick view
                </button>
                <a
                  className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-accent hover:text-accent-strong"
                  href={armyB.localPdfPath}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open PDF
                </a>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-line bg-panel-strong p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Running Score
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-line bg-black/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  {armyA?.name ?? match.armyAId}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {armyAScore} VP
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-black/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  {armyB?.name ?? match.armyBId}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {armyBScore} VP
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {armyAScore === armyBScore
                ? "The score is currently tied."
                : `${winnerLabel} is currently ahead.`}
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
                Final Summary
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">
                {winnerLabel === "Draw" ? "The battle ends in a draw" : `${winnerLabel} wins`}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                All four battle rounds are complete. Final scores and round-by-round results are below.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    {armyA?.name ?? match.armyAId}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {armyAScore} VP
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    {armyB?.name ?? match.armyBId}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {armyBScore} VP
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {match.battleRounds.map((round) => (
                  <section
                    className="rounded-2xl border border-line bg-black/10 p-4"
                    key={round.roundNumber}
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-accent">
                      Battle Round {round.roundNumber}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted">
                          {armyA?.name ?? match.armyAId}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {round.turnState.army_a.totalVictoryPoints} VP
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted">
                          {armyB?.name ?? match.armyBId}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {round.turnState.army_b.totalVictoryPoints} VP
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
                      <p>
                        First player:{" "}
                        {round.firstPlayer === "army_a"
                          ? (armyA?.name ?? match.armyAId)
                          : round.firstPlayer === "army_b"
                            ? (armyB?.name ?? match.armyBId)
                            : "Not recorded"}
                      </p>
                      <p>
                        Underdog:{" "}
                        {round.underdog === "army_a"
                          ? (armyA?.name ?? match.armyAId)
                          : round.underdog === "army_b"
                            ? (armyB?.name ?? match.armyBId)
                            : "Not recorded"}
                      </p>
                      <p>Twist: {round.twistCard || "Not recorded"}</p>
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
                  onClick={stepBackFromGameOver}
                  type="button"
                >
                  Back one step
                </button>
                <Link
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#20160d] transition hover:bg-accent-strong"
                  href="/"
                >
                  Start new game
                </Link>
                <Link
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
                  href="/"
                >
                  Back to home
                </Link>
              </div>
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
      {selectedArmyPdf ? (
        <PdfModal
          onClose={() => setSelectedArmyPdf(null)}
          pdfPath={selectedArmyPdf.pdfPath}
          pdfUrl={selectedArmyPdf.pdfUrl}
          title={selectedArmyPdf.title}
        />
      ) : null}
    </main>
  );
}
