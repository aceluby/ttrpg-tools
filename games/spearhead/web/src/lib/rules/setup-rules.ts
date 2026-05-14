export type RuleContent = {
  bullets: string[];
  sourceLabel: string;
  sourceUrl?: string;
  title: string;
};

export const terrainPlacementRule: RuleContent = {
  bullets: [
    "The defender sets up 1 large terrain feature and 1 small terrain feature, then the attacker does the same.",
    "Each terrain feature must be wholly within friendly territory.",
    "Each terrain feature must be more than 6 inches from all other terrain features.",
    "Each terrain feature must be more than 3 inches from both long battlefield edges and enemy territory.",
    "Terrain features cannot be set up on objectives.",
    "Large terrain has Cover, Obscuring, and Unstable. Small terrain has Cover and Unstable.",
  ],
  sourceLabel: "Spearhead Reference PDF",
  sourceUrl:
    "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_spearheadreferece_eng_24.09-jrpbcnzwuu.pdf",
  title: "Terrain Placement Rules",
};

export const armyDeploymentRule: RuleContent = {
  bullets: [
    "The attacker sets up their army first, followed by the defender.",
    "Each unit must be set up wholly within friendly territory.",
    "Each unit must be set up more than 6 inches from enemy territory.",
  ],
  sourceLabel: "Spearhead Reference PDF",
  sourceUrl:
    "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_spearheadreferece_eng_24.09-jrpbcnzwuu.pdf",
  title: "Army Deployment Rules",
};

export const regimentChoiceRule: RuleContent = {
  bullets: [
    "During the pre-battle sequence, the attacker picks a regiment ability and enhancement first.",
    "After that, the defender picks a regiment ability and enhancement.",
    "Exact army-specific rule text for each choice still needs to be imported from the official Spearhead packs.",
  ],
  sourceLabel: "Spearhead Reference PDF plus local army data",
  sourceUrl:
    "https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_spearheadreferece_eng_24.09-jrpbcnzwuu.pdf",
  title: "Regiment Ability And Enhancement Rules",
};
