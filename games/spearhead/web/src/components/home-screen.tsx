"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArmySelector } from "@/components/army-selector";
import { MatchSummaryCard } from "@/components/match-summary-card";
import { createMatchId } from "@/lib/game-state/match-id";
import { useRecentMatchesStore } from "@/lib/game-state/match-store";
import { createMatch } from "@/lib/game-state/match-storage";
import { listArmies } from "@/lib/spearhead-data/armies";

export function HomeScreen() {
  const armies = listArmies();
  const router = useRouter();
  const [armyAId, setArmyAId] = useState("");
  const [armyBId, setArmyBId] = useState("");
  const recentMatches = useRecentMatchesStore();
  const [isPending, startTransition] = useTransition();

  const selectedArmyA = armies.find((army) => army.id === armyAId) ?? null;
  const selectedArmyB = armies.find((army) => army.id === armyBId) ?? null;
  const canRunGame = Boolean(armyAId && armyBId && armyAId !== armyBId);

  function handleRunGame() {
    if (!canRunGame) {
      return;
    }

    const matchId = createMatchId();
    createMatch({
      armyAId,
      armyBId,
      id: matchId,
    });

    startTransition(() => {
      router.push(`/game/${matchId}`);
    });
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-line bg-panel shadow-2xl shadow-black/35">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
                Age of Sigmar
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
                Spearhead Command Table
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                Build a match, pick two Spearheads, and run setup through round
                four with a rules-aware command console built for table-side
                play.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-black/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Supported armies
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    5
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Battle rounds
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    4
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-black/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Deck handling
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Manual
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-line bg-panel-strong p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Start a match
              </p>
              <div className="mt-5 grid gap-4">
                <ArmySelector
                  armies={armies}
                  label="Army A"
                  onChange={setArmyAId}
                  selectedArmyId={armyAId}
                />
                <ArmySelector
                  armies={armies}
                  label="Army B"
                  onChange={setArmyBId}
                  selectedArmyId={armyBId}
                />
              </div>

              <button
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#20160d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-[#6e5a3a] disabled:text-[#d7c7aa]"
                disabled={!canRunGame || isPending}
                onClick={handleRunGame}
                type="button"
              >
                {isPending ? "Launching..." : "Run Game"}
              </button>

              {!canRunGame ? (
                <p className="mt-3 text-sm leading-6 text-muted">
                  Choose two different supported Spearheads to initialize a new
                  command table.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="grid gap-6 md:grid-cols-2">
            <MatchSummaryCard
              army={selectedArmyA}
              emptyLabel="Choose Army A to preview its faction, game plan, and current data coverage."
              title="Army A Preview"
            />
            <MatchSummaryCard
              army={selectedArmyB}
              emptyLabel="Choose Army B to preview its faction, game plan, and current data coverage."
              title="Army B Preview"
            />
          </div>

          <aside className="rounded-[32px] border border-line bg-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Recent matches
            </p>
            {recentMatches.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                No saved local matches yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentMatches.map((match) => (
                  <li key={match.id}>
                    <button
                      className="w-full rounded-2xl border border-line bg-black/10 px-4 py-3 text-left transition hover:border-accent"
                      onClick={() => router.push(`/game/${match.id}`)}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {match.armyALabel} vs {match.armyBLabel}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                        {match.status} • Round {match.currentRound}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
