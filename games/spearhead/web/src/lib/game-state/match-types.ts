export type MatchStatus = "setup" | "in_progress" | "completed";
export type MatchPlayerSlot = "army_a" | "army_b";
export type BattlefieldSide = "aqshy" | "ghyran" | "";
export type DeploymentMap = "horizontal" | "diagonal" | "";
export type TerritoryChoice = "north_west" | "south_east" | "north_east" | "south_west" | "";
export type TurnPhaseKey =
  | "start_of_turn"
  | "hero"
  | "movement"
  | "shooting"
  | "charge"
  | "combat"
  | "end_of_turn";

export type PreBattleSetup = {
  attacker: MatchPlayerSlot | "";
  attackerEnhancement: string;
  attackerRegimentAbility: string;
  currentStepIndex: number;
  defender: MatchPlayerSlot | "";
  defenderBattlefieldSide: BattlefieldSide;
  defenderEnhancement: string;
  defenderRegimentAbility: string;
  deploymentMap: DeploymentMap;
  notes: string;
  rollOffWinner: MatchPlayerSlot | "";
  terrainPlacedByAttacker: boolean;
  terrainPlacedByDefender: boolean;
  territoryChoice: TerritoryChoice;
  attackerDeployed: boolean;
  defenderDeployed: boolean;
};

export type MatchPhase =
  | "setup"
  | "pre_battle"
  | "battle_round_start"
  | TurnPhaseKey
  | "game_over";

export type PlayerTurnState = {
  combatActivationByArmy: Record<MatchPlayerSlot, string[]>;
  combatStepCompletion: {
    normal: boolean;
    strikeFirst: boolean;
    strikeLast: boolean;
  };
  completedPhases: TurnPhaseKey[];
  controlsAtLeastOneObjective: boolean;
  controlsMoreObjectives: boolean;
  controlsTwoOrMoreObjectives: boolean;
  completedBattleTactics: number;
  phaseChecklistCompletion: Partial<Record<"hero" | "movement" | "shooting" | "charge", string[]>>;
  totalVictoryPoints: number;
};

export type RoundState = {
  activePlayer: MatchPlayerSlot | "";
  battleTacticCardStepComplete: Record<MatchPlayerSlot, boolean>;
  battleTacticNotes: Record<MatchPlayerSlot, string>;
  firstPlayer: MatchPlayerSlot | "";
  priorityWinner: MatchPlayerSlot | "";
  roundNotes: string;
  roundNumber: number;
  startOfBattleRoundAbilities: string;
  turnState: Record<MatchPlayerSlot, PlayerTurnState>;
  twistCard: string;
  underdog: MatchPlayerSlot | "";
 };

export type MatchRecord = {
  armyAId: string;
  armyBId: string;
  battleRounds: RoundState[];
  createdAt: string;
  currentPhase: MatchPhase;
  currentRound: number;
  id: string;
  preBattleSetup: PreBattleSetup;
  status: MatchStatus;
  updatedAt: string;
};

export type MatchSummaryRecord = {
  armyALabel: string;
  armyBLabel: string;
  currentRound: number;
  id: string;
  status: MatchStatus;
};
