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

export type ArmySummary = {
  dataStatus: string;
  enhancements: RuleOption[];
  faction: string;
  id: string;
  name: string;
  regimentAbilities: RuleOption[];
  summary: string;
  tags: string[];
};
