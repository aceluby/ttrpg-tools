export type SourceReference = {
  page?: number;
  title: string;
  url: string;
  versionLabel: string;
};

export type RuleOption = {
  details: string[];
  name: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type UnitDefinition = {
  id: string;
  keywords: string[];
  name: string;
  role: string;
  warscrollText: string[];
};

export type ArmyDefinition = {
  enhancements: RuleOption[];
  faction: string;
  id: string;
  name: string;
  notes: string[];
  regimentAbilities: RuleOption[];
  source: SourceReference;
  summary: string;
  tags: string[];
  units: UnitDefinition[];
};

export type PhaseRule = {
  details: string[];
  id: string;
  sourceLabel?: string;
  sourceUrl?: string;
  title: string;
  unitName?: string;
};

export type ArmySummary = {
  combatUnits: string[];
  dataStatus: string;
  enhancements: RuleOption[];
  faction: string;
  id: string;
  localPdfPath: string;
  name: string;
  phaseRules: {
    charge: PhaseRule[];
    hero: PhaseRule[];
    movement: PhaseRule[];
    shooting: PhaseRule[];
  };
  regimentAbilities: RuleOption[];
  rulesPdfUrl: string;
  summary: string;
  tags: string[];
};
