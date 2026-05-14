import type { MatchRecord } from "@/lib/game-state/match-types";

export type PreBattleStepDefinition = {
  description: string;
  id: string;
  isComplete: (match: MatchRecord) => boolean;
  title: string;
};

export const preBattleSteps: PreBattleStepDefinition[] = [
  {
    description: "Record who won the roll-off that starts the Spearhead setup flow.",
    id: "roll-off",
    isComplete: (match) => match.preBattleSetup.rollOffWinner !== "",
    title: "Roll off",
  },
  {
    description: "Assign attacker and defender based on the roll-off decision.",
    id: "roles",
    isComplete: (match) =>
      match.preBattleSetup.attacker !== "" && match.preBattleSetup.defender !== "",
    title: "Assign attacker and defender",
  },
  {
    description: "Record the attacker's regiment ability and enhancement, then the defender's.",
    id: "regiment-choices",
    isComplete: (match) =>
      match.preBattleSetup.attackerRegimentAbility.trim() !== "" &&
      match.preBattleSetup.attackerEnhancement.trim() !== "" &&
      match.preBattleSetup.defenderRegimentAbility.trim() !== "" &&
      match.preBattleSetup.defenderEnhancement.trim() !== "",
    title: "Choose regiment abilities and enhancements",
  },
  {
    description: "The defender chooses Aqshy or Ghyran for the battlefield side.",
    id: "battlefield-side",
    isComplete: (match) => match.preBattleSetup.defenderBattlefieldSide !== "",
    title: "Choose battlefield side",
  },
  {
    description: "The defender chooses the deployment map and which territory is theirs.",
    id: "deployment-map",
    isComplete: (match) =>
      match.preBattleSetup.deploymentMap !== "" &&
      match.preBattleSetup.territoryChoice !== "",
    title: "Choose deployment map and territory",
  },
  {
    description: "Mark when the defender and then the attacker place their large and small terrain pieces.",
    id: "terrain",
    isComplete: (match) =>
      match.preBattleSetup.terrainPlacedByDefender &&
      match.preBattleSetup.terrainPlacedByAttacker,
    title: "Place terrain",
  },
  {
    description: "Confirm attacker deployment, then defender deployment, before entering battle round 1.",
    id: "deployment",
    isComplete: (match) =>
      match.preBattleSetup.attackerDeployed && match.preBattleSetup.defenderDeployed,
    title: "Deploy both armies",
  },
];

export function getPreBattleStepStatus(match: MatchRecord) {
  return preBattleSteps.map((step, index) => ({
    ...step,
    index,
    isCurrent: index === match.preBattleSetup.currentStepIndex,
    isLocked: index > match.preBattleSetup.currentStepIndex,
  }));
}

export function canAdvancePreBattle(match: MatchRecord) {
  const currentStep = preBattleSteps[match.preBattleSetup.currentStepIndex];
  return currentStep ? currentStep.isComplete(match) : false;
}
