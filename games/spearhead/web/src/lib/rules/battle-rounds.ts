import type {
  MatchPlayerSlot,
  MatchRecord,
  PlayerTurnState,
  RoundState,
  TurnPhaseKey,
} from "@/lib/game-state/match-types";

export const turnPhaseOrder: TurnPhaseKey[] = [
  "start_of_turn",
  "hero",
  "movement",
  "shooting",
  "charge",
  "combat",
  "end_of_turn",
];

export const phaseGuide: Record<
  TurnPhaseKey,
  { actions: string[]; title: string; whatHappens: string }
> = {
  charge: {
    actions: [
      "Choose eligible units to charge and resolve the charge rolls.",
      "Check any charge-triggered rules or reactions.",
      "Mark which units successfully made it into combat.",
    ],
    title: "Charge Phase",
    whatHappens: "The active player pushes engagement and sets up the coming combat order.",
  },
  combat: {
    actions: [
      "Identify units in combat and any units that charged.",
      "Resolve fights in the correct order.",
      "Track pile-ins, slain models, and combat-result effects.",
    ],
    title: "Combat Phase",
    whatHappens: "Units fight, damage is applied, and melee outcomes reshape the battlefield.",
  },
  end_of_turn: {
    actions: [
      "Score objectives and completed battle tactics.",
      "Resolve end-of-turn abilities and cleanup notes.",
      "Confirm whether play passes to the other player or the next round.",
    ],
    title: "End of Turn",
    whatHappens: "This is the bookkeeping checkpoint where scoring and lingering effects are resolved.",
  },
  hero: {
    actions: [
      "Use hero abilities, spells, prayers, or army-specific command pieces that happen now.",
      "Review any phase-tagged rules from the selected army.",
      "Record important outcomes before moving on.",
    ],
    title: "Hero Phase",
    whatHappens: "Leadership, magic, and signature abilities come online before movement begins.",
  },
  movement: {
    actions: [
      "Move eligible units using normal move, run, or retreat as appropriate.",
      "Check movement-phase army rules and reinforcements timing.",
      "Lock in board position before shooting and charge declarations.",
    ],
    title: "Movement Phase",
    whatHappens: "The active player repositions, sets angles, and prepares pressure for the rest of the turn.",
  },
  shooting: {
    actions: [
      "Resolve eligible ranged attacks.",
      "Check target restrictions, terrain, and weapon abilities.",
      "Record casualties and any follow-on triggers.",
    ],
    title: "Shooting Phase",
    whatHappens: "Ranged pressure lands before melee commitments are made.",
  },
  start_of_turn: {
    actions: [
      "Confirm the active player, current round, and round-level effects.",
      "Review twist card, battle tactics in hand, and any start-of-turn triggers.",
      "Make sure all players agree what carries over from the round start step.",
    ],
    title: "Start of Turn",
    whatHappens: "This is the reminder checkpoint before the active player begins taking phase actions.",
  },
};

export function getRoundState(match: MatchRecord) {
  return match.battleRounds[match.currentRound - 1] ?? null;
}

export function getOtherPlayer(player: MatchPlayerSlot): MatchPlayerSlot {
  return player === "army_a" ? "army_b" : "army_a";
}

export function patchCurrentRound(
  match: MatchRecord,
  patch: Partial<RoundState>,
): MatchRecord {
  return {
    ...match,
    battleRounds: match.battleRounds.map((round) =>
      round.roundNumber === match.currentRound
        ? {
            ...round,
            ...patch,
          }
        : round,
    ),
  };
}

export function calculateTurnVictoryPoints(turn: PlayerTurnState) {
  return (
    (turn.controlsAtLeastOneObjective ? 1 : 0) +
    (turn.controlsTwoOrMoreObjectives ? 1 : 0) +
    (turn.controlsMoreObjectives ? 1 : 0) +
    turn.completedBattleTactics
  );
}

export function calculateMatchVictoryPoints(
  match: MatchRecord,
  player: MatchPlayerSlot,
) {
  return match.battleRounds.reduce(
    (total, round) => total + round.turnState[player].totalVictoryPoints,
    0,
  );
}
