"use client";

import { useSyncExternalStore } from "react";
import type { MatchRecord, MatchSummaryRecord } from "@/lib/game-state/match-types";
import { getArmySummaryById } from "@/lib/spearhead-data/armies";

const MATCH_STORAGE_EVENT = "spearhead-match-storage-change";
const MATCHES_STORAGE_KEY = "spearhead.matches.v1";
const EMPTY_RECENT_MATCHES: MatchSummaryRecord[] = [];
const EMPTY_PARSED_MATCHES: MatchRecord[] = [];
const EMPTY_MATCH: MatchRecord | null = null;
let cachedRawMatches = "";
let cachedParsedMatches: MatchRecord[] = EMPTY_PARSED_MATCHES;
let cachedRecentMatches: MatchSummaryRecord[] = EMPTY_RECENT_MATCHES;
const cachedMatchById = new Map<string, MatchRecord | null>();

function subscribe(callback: () => void) {
  function handleChange() {
    callback();
  }

  window.addEventListener("storage", handleChange);
  window.addEventListener(MATCH_STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(MATCH_STORAGE_EVENT, handleChange);
  };
}

function readMatchesSnapshot() {
  const rawValue = window.localStorage.getItem(MATCHES_STORAGE_KEY) ?? "";

  if (rawValue === cachedRawMatches) {
    return cachedParsedMatches;
  }

  cachedRawMatches = rawValue;
  cachedMatchById.clear();

  if (!rawValue) {
    cachedParsedMatches = EMPTY_PARSED_MATCHES;
    cachedRecentMatches = EMPTY_RECENT_MATCHES;
    return cachedParsedMatches;
  }

  try {
    const parsed = JSON.parse(rawValue) as MatchRecord[];
    cachedParsedMatches = Array.isArray(parsed) ? parsed : [];
  } catch {
    cachedParsedMatches = [];
  }

  cachedRecentMatches =
    cachedParsedMatches.length === 0
      ? EMPTY_RECENT_MATCHES
      : cachedParsedMatches.map((match) => {
          const armyA = getArmySummaryById(match.armyAId);
          const armyB = getArmySummaryById(match.armyBId);

          return {
            armyALabel: armyA?.name ?? match.armyAId,
            armyBLabel: armyB?.name ?? match.armyBId,
            currentRound: match.currentRound,
            id: match.id,
            status: match.status,
          };
        });

  return cachedParsedMatches;
}

function getRecentMatchesSnapshot() {
  readMatchesSnapshot();
  return cachedRecentMatches;
}

function getMatchSnapshot(matchId: string) {
  const matches = readMatchesSnapshot();

  if (cachedMatchById.has(matchId)) {
    return cachedMatchById.get(matchId) ?? null;
  }

  const match = matches.find((candidate) => candidate.id === matchId) ?? null;
  cachedMatchById.set(matchId, match);
  return match;
}

export function useRecentMatchesStore() {
  return useSyncExternalStore(
    subscribe,
    getRecentMatchesSnapshot,
    () => EMPTY_RECENT_MATCHES,
  );
}

export function useMatchStore(matchId: string) {
  return useSyncExternalStore<MatchRecord | null>(
    subscribe,
    () => getMatchSnapshot(matchId),
    () => EMPTY_MATCH,
  );
}
