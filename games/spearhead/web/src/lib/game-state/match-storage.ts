import { getArmySummaryById } from "@/lib/spearhead-data/armies";
import type {
  MatchRecord,
  MatchPlayerSlot,
  MatchSummaryRecord,
  PreBattleSetup,
  RoundState,
  TurnPhaseKey,
} from "@/lib/game-state/match-types";

const MATCHES_STORAGE_KEY = "spearhead.matches.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readMatches(): MatchRecord[] {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(MATCHES_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as MatchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMatches(matches: MatchRecord[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  window.dispatchEvent(new Event("spearhead-match-storage-change"));
}

function createDefaultPreBattleSetup(): PreBattleSetup {
  return {
    attacker: "",
    attackerDeployed: false,
    attackerEnhancement: "",
    attackerRegimentAbility: "",
    currentStepIndex: 0,
    defender: "",
    defenderBattlefieldSide: "",
    defenderDeployed: false,
    defenderEnhancement: "",
    defenderRegimentAbility: "",
    deploymentMap: "",
    notes: "",
    rollOffWinner: "",
    terrainPlacedByAttacker: false,
    terrainPlacedByDefender: false,
    territoryChoice: "",
  };
}

function createDefaultTurnState() {
  return {
    completedPhases: [] as TurnPhaseKey[],
    completedBattleTactics: 0,
    controlsAtLeastOneObjective: false,
    controlsMoreObjectives: false,
    controlsTwoOrMoreObjectives: false,
    phaseNotes: {},
    scoringNotes: "",
    totalVictoryPoints: 0,
  };
}

function createDefaultRoundState(roundNumber: number): RoundState {
  return {
    activePlayer: "",
    battleTacticNotes: {
      army_a: "",
      army_b: "",
    } as Record<MatchPlayerSlot, string>,
    firstPlayer: "",
    priorityWinner: "",
    roundNotes: "",
    roundNumber,
    startOfBattleRoundAbilities: "",
    turnState: {
      army_a: createDefaultTurnState(),
      army_b: createDefaultTurnState(),
    } as Record<MatchPlayerSlot, ReturnType<typeof createDefaultTurnState>>,
    twistCard: "",
    underdog: "",
  };
}

export function createMatch(match: Pick<MatchRecord, "armyAId" | "armyBId" | "id">) {
  const record: MatchRecord = {
    armyAId: match.armyAId,
    armyBId: match.armyBId,
    battleRounds: [
      createDefaultRoundState(1),
      createDefaultRoundState(2),
      createDefaultRoundState(3),
      createDefaultRoundState(4),
    ],
    createdAt: new Date().toISOString(),
    currentPhase: "setup",
    currentRound: 0,
    id: match.id,
    preBattleSetup: createDefaultPreBattleSetup(),
    status: "setup",
    updatedAt: new Date().toISOString(),
  };

  const matches = readMatches();
  writeMatches([record, ...matches]);
  return record;
}

export function loadMatch(matchId: string) {
  const matches = readMatches();
  return matches.find((match) => match.id === matchId) ?? null;
}

export function saveMatch(nextMatch: MatchRecord) {
  const matches = readMatches();
  const updatedMatches = matches.map((match) =>
    match.id === nextMatch.id
      ? {
          ...nextMatch,
          updatedAt: new Date().toISOString(),
        }
      : match,
  );
  writeMatches(updatedMatches);
  return updatedMatches.find((match) => match.id === nextMatch.id) ?? null;
}

export function loadRecentMatches(): MatchSummaryRecord[] {
  return readMatches().map((match) => {
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
}
