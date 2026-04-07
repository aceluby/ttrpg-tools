"use client";

import { startTransition, useEffect, useState } from "react";
import { AppPanelHeader } from "@/components/app-panel-header";

type EncounterStage = "setup" | "running";
type ParticipantRole = "character" | "npc" | "enemy" | "hazard";
type QuickAddOption = {
  value: string;
  label: string;
};
type EncounterProfileEntry = {
  label: string;
  detail: string;
};
type EncounterCombatProfile = {
  summary: string[];
  saves: string[];
  attacks: EncounterProfileEntry[];
  skills: EncounterProfileEntry[];
  spells: EncounterProfileEntry[];
  specials: EncounterProfileEntry[];
  resistances: string[];
  sourcePath: string;
};
type EncounterPreset = {
  id: string;
  name: string;
  role: ParticipantRole;
  sourcePath: string;
  sourceTitle: string;
  sourceBody: string | null;
  level: number | null;
  maxHp: number | null;
  ac: number | null;
  initiativeMod: number | null;
  effects: TrackedEffect[];
  notes: string;
  combatProfile: EncounterCombatProfile | null;
};
type EncounterPresetGroup = {
  id: string;
  name: string;
  memberIds: string[];
};

type TrackedEffect = {
  id: string;
  name: string;
  value: string;
};

type Participant = {
  id: string;
  name: string;
  role: ParticipantRole;
  sourcePath: string | null;
  sourceTitle: string | null;
  sourceBody: string | null;
  level: number | null;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number | null;
  initiativeMod: number;
  effects: TrackedEffect[];
  notes: string;
  combatProfile: EncounterCombatProfile | null;
};

type EncounterState = {
  name: string;
  stage: EncounterStage;
  round: number;
  activeParticipantId: string | null;
  participants: Participant[];
};

type ParticipantDraft = {
  name: string;
  role: ParticipantRole;
  level: string;
  maxHp: string;
  ac: string;
  notes: string;
};

type InitiativeDraft = Record<string, string>;
type HpAdjustmentDraft = Record<string, string>;
type SavedEncounterFile = {
  file: string;
  name: string;
  updatedAt: string;
};
type ToastMessage = {
  id: string;
  text: string;
};
type PendingAction = "roll-initiative";
type EncounterDifficulty = {
  partyLevel: number | null;
  partySize: number;
  enemyCount: number;
  xp: number;
  budgets: {
    trivial: number;
    low: number;
    moderate: number;
    severe: number;
    extreme: number;
  };
  label: "Trivial" | "Low" | "Moderate" | "Severe" | "Extreme" | "Over Extreme";
  tone: string;
};

const STORAGE_KEY = "corona-eclipsa-encounter-runner";
const PARTY_GROUP_VALUE = "group:group-corona-eclipsa";

const emptyDraft: ParticipantDraft = {
  name: "",
  role: "enemy",
  level: "7",
  maxHp: "20",
  ac: "18",
  notes: "",
};

const defaultState: EncounterState = {
  name: "New Encounter",
  stage: "setup",
  round: 1,
  activeParticipantId: null,
  participants: [],
};

const roleLabels: Record<ParticipantRole, string> = {
  character: "Character",
  npc: "NPC",
  enemy: "Enemy",
  hazard: "Hazard",
};

const XP_BUDGETS = {
  trivial: 40,
  low: 60,
  moderate: 80,
  severe: 120,
  extreme: 160,
} as const;

const XP_ADJUSTMENTS = {
  trivial: 10,
  low: 20,
  moderate: 20,
  severe: 30,
  extreme: 40,
} as const;

const PF2E_EFFECTS = [
  { name: "Blinded", summary: "You can't see. You take a -4 status penalty to Perception checks based on vision and are off-guard.", hasValue: false },
  { name: "Broken", summary: "An item can't be used for its normal function until repaired.", hasValue: false },
  { name: "Charmed", summary: "Useful custom reminder for charm-like magic or social influence at the table.", hasValue: false },
  { name: "Clumsy", summary: "You take a status penalty equal to the value to Dexterity-based checks and DCs, including AC, Reflex saves, ranged attacks, and skills.", hasValue: true },
  { name: "Concealed", summary: "You are harder to target. Attackers must succeed at a DC 5 flat check to target you.", hasValue: false },
  { name: "Confused", summary: "You attack indiscriminately and can't Delay, Ready, or use reactions.", hasValue: false },
  { name: "Controlled", summary: "Another creature decides your actions.", hasValue: false },
  { name: "Courageous Anthem", summary: "+1 status bonus to attack rolls, damage rolls, and saves against fear.", hasValue: false },
  { name: "Dazzled", summary: "Everything is concealed from you.", hasValue: false },
  { name: "Deafened", summary: "You can't hear. You automatically critically fail checks that require hearing.", hasValue: false },
  { name: "Doomed", summary: "Your maximum dying value is reduced by the condition value.", hasValue: true },
  { name: "Drained", summary: "You take a penalty equal to the value on Constitution-based checks and lose HP based on your level.", hasValue: true },
  { name: "Dying", summary: "You are near death. At dying 4, you die.", hasValue: true },
  { name: "Encumbered", summary: "You are burdened by weight and take a -10-foot penalty to all Speeds plus clumsy 1.", hasValue: false },
  { name: "Enfeebled", summary: "You take a status penalty equal to the value to Strength-based checks and DCs.", hasValue: true },
  { name: "Fascinated", summary: "You are compelled to focus on one thing, taking a -2 status penalty to Perception and skill checks and unable to use concentrate actions except on the focus.", hasValue: false },
  { name: "Fatigued", summary: "You take a -1 status penalty to AC and saving throws and can't use exploration activities while traveling.", hasValue: false },
  { name: "Friendly", summary: "A creature likes the target and tends to cooperate on simple or safe requests.", hasValue: false },
  { name: "Frightened", summary: "You take a status penalty equal to the value to all checks and DCs. It usually decreases by 1 at the end of each of your turns.", hasValue: true },
  { name: "Grabbed", summary: "You are immobilized and off-guard unless the effect says otherwise.", hasValue: false },
  { name: "Helpful", summary: "A creature wishes to actively aid the target.", hasValue: false },
  { name: "Hidden", summary: "A creature knows your space but can't see you clearly; they must succeed at a DC 11 flat check to target you.", hasValue: false },
  { name: "Hostile", summary: "A creature actively opposes or seeks to harm the target.", hasValue: false },
  { name: "Immobilized", summary: "You can't use actions with the move trait.", hasValue: false },
  { name: "Indifferent", summary: "A creature has no strong opinion toward the target.", hasValue: false },
  { name: "Invisible", summary: "You can't be seen, making you undetected to creatures that can't otherwise perceive you.", hasValue: false },
  { name: "Off-Guard", summary: "You take a -2 circumstance penalty to AC.", hasValue: false },
  { name: "Observed", summary: "Your location is known and you are plainly perceived.", hasValue: false },
  { name: "Paralyzed", summary: "You are frozen in place, off-guard, and usually unable to act except mentally.", hasValue: false },
  { name: "Petrified", summary: "You are turned to stone and can't act.", hasValue: false },
  { name: "Prone", summary: "You are lying on the ground and off-guard, with limits on movement and attacks.", hasValue: false },
  { name: "Quickened", summary: "You gain 1 extra action each turn that can be used only for the specified actions.", hasValue: false },
  { name: "Restrained", summary: "You are tied up or otherwise held fast. You are off-guard and immobilized, and usually can't act except to Escape.", hasValue: false },
  { name: "Sickened", summary: "You take a status penalty equal to the value on all checks and DCs and usually can't willingly ingest anything.", hasValue: true },
  { name: "Slowed", summary: "When you regain actions at the start of your turn, reduce that number by the condition value.", hasValue: true },
  { name: "Stunned", summary: "You lose actions equal to the value. Each point removes 1 action at the start of your turn.", hasValue: true },
  { name: "Stupefied", summary: "You take a status penalty equal to the value on Intelligence-, Wisdom-, and Charisma-based checks, DCs, and spell rolls.", hasValue: true },
  { name: "Temporary HP", summary: "Absorbs incoming damage before current HP and disappears when reduced to 0.", hasValue: true },
  { name: "Unconscious", summary: "You can't act, are off-guard, and usually drop prone and what you're holding.", hasValue: false },
  { name: "Undetected", summary: "A creature doesn't know what space you're in and must guess to target you.", hasValue: false },
  { name: "Unfriendly", summary: "A creature dislikes the target and is unlikely to accept requests.", hasValue: false },
  { name: "Unnoticed", summary: "A creature is completely unaware of your presence.", hasValue: false },
  { name: "Wounded", summary: "If you gain dying again, increase it by your wounded value.", hasValue: true },
] as const;

const EFFECT_LOOKUP = new Map<string, (typeof PF2E_EFFECTS)[number]>(
  PF2E_EFFECTS.map((effect) => [effect.name, effect]),
);

const SKILL_LOOKUP: Record<string, string> = {
  Acrobatics: "Used for Balance, Tumble Through, Maneuver in Flight, and escaping bonds with agility.",
  Arcana: "Recall Knowledge about arcane magic, magical traditions, constructs, and arcane creatures.",
  Athletics: "Climb, Force Open, Grapple, High Jump, Long Jump, Reposition, Shove, Swim, and Trip.",
  Crafting: "Repair gear, identify alchemy or crafted items, and perform hands-on technical work.",
  Deception: "Create a Diversion, Feint, Impersonate, Lie, or Conceal true intentions.",
  Diplomacy: "Make an Impression, Gather Information, or Request cooperation.",
  Intimidation: "Demoralize foes, Coerce, and pressure NPCs through threat or force of presence.",
  Medicine: "Battle Medicine, Treat Wounds, Administer First Aid, and stabilize others.",
  Nature: "Recall Knowledge about animals, plants, natural hazards, weather, and primal magic.",
  Occultism: "Recall Knowledge about occult magic, spirits, haunts, and esoteric phenomena.",
  Performance: "Perform for attention or use performance-based class features and distractions.",
  Religion: "Recall Knowledge about deities, undead, divine magic, and sacred traditions.",
  Society: "Recall Knowledge about settlements, nobility, laws, politics, and cultures.",
  Stealth: "Avoid Notice, Hide, Sneak, and keep yourself unseen or unheard.",
  Survival: "Track, Sense Direction, Subsist, navigate wilderness, and read signs of passage.",
  Thievery: "Disable a Device, Pick a Lock, Palm an Object, or Steal.",
};

const SPELL_LOOKUP: Record<string, string> = {
  "Bless": "1 action; 15-foot emanation. Allies in the area gain +1 status bonus to attack rolls. Sustain to expand by 10 feet.",
  "Calm": "2 actions; burst; Will save. On a failure, target can't use hostile actions unless attacked or threatened.",
  "Counter Performance": "Reaction/focus defense. Roll Performance and allies use that result vs triggering auditory or visual effect.",
  "Courageous Anthem": "1 action composition cantrip; 60 feet. Allies gain +1 status bonus to attack rolls, damage rolls, and saves vs fear.",
  "Darkness": "2 actions; creates magical darkness in an area. Normal vision usually can't see through it.",
  "Detect Magic": "2 actions by default; reveals whether magic is present nearby, with more detail at higher action cost.",
  "Electric Arc": "2 actions; targets 1 or 2 creatures. Reflex save; deals 4d4 electricity damage at this level, full to both targets.",
  "Fireball": "2 actions; 20-foot burst at long range. Reflex save; deals 8d6 fire damage at rank 4.",
  "Haste": "2 actions; 1 minute. Target gains 1 extra action each turn for Stride or Strike-style basics.",
  "Heal": "1-3 actions. At rank 1 heals 1d8, 1d8+8, or 1d8 to all in the emanation depending on actions spent; heightens by +1d8 or +8.",
  "Hymn of Healing": "1 action focus composition; 2 rounds. Grants fast healing to one ally for the duration.",
  "Infectious Enthusiasm": "2 actions; support buff that can jump between allies when they succeed at relevant actions.",
  "Phantasmal Minion": "2 actions; summons a minion-style illusion/servitor to perform simple manipulate actions.",
  "Protection": "2 actions; 1 minute. Defensive ward giving bonuses against attacks or hostile creatures depending on target.",
  "Shared Invisibility": "2 actions; invisibility effect shared between caster and one ally.",
  "Shield": "1 action cantrip. Raise a magical shield for +1 AC; can use Shield Block and then the spell is unavailable briefly.",
  "Sudden Bolt": "2 actions; electricity blast. Reflex save; deals 4d12 electricity damage at rank 2.",
  "Sure Strike": "1 action. Roll twice on your next attack roll this turn and use the better result.",
  "Telekinetic Hand": "2 actions; manipulate an unattended object at range with a light-Bulk limit.",
  "Telekinetic Projectile": "2 actions; ranged spell attack. Throw a loose object to deal 4d6 bludgeoning, piercing, or slashing damage at this level.",
  "Translocate": "2 actions; short teleport/reposition effect to move yourself without walking the path.",
  "Ventriloquism": "2 actions; project your voice elsewhere to misdirect creatures.",
  "Void Warp": "2 actions; basic Fortitude save; deals 4d4 void damage at this level to a living target.",
  "Wall of Wind": "2 actions; creates a wind barrier that blocks arrows, disperses gases, and interferes with movement/flying.",
};

const ATTACK_LOOKUP: Record<string, string> = {
  Fist: "Simple unarmed Strike. Good for hands-free attacks or when disarmed.",
  Sling: "Ranged weapon with reload considerations and modest damage.",
  Bola: "Thrown weapon often used for control or setup rather than raw damage.",
  Kris: "Light melee weapon suited to agile or finesse-style fighting.",
  "Bo Staff": "Two-handed reach-style monk weapon with solid control and defense potential.",
  "Hand Crossbow": "One-handed ranged option with reload pressure.",
  Dart: "Thrown weapon that can be used at range with a quick hand.",
  "War Razor": "Light melee weapon suited to rogue-style close attacks.",
  Flyssa: "Curved martial blade often used for mobile dual-weapon fighting.",
  "Composite Longbow": "Strong ranged weapon with propulsive support from Strength.",
  Greataxe: "Heavy two-handed weapon built for strong single-hit damage.",
  "Retribution Axe": "A hard-hitting signature axe with striking damage progression.",
  Blowgun: "Low-damage ranged weapon often more useful for delivery than direct damage.",
};

const TRAIT_LOOKUP: Record<string, string> = {
  "Reactive Strike": "Reaction attack triggered by enemy openings such as manipulate or move actions.",
  Mirage: "Dragonblood-linked magical thread tied to illusion, hidden truth, or arcane destiny.",
  Bravery: "Improved resistance against fear and better results on fear saves.",
  "Battlefield Surveyor": "Keeps initiative and battlefield awareness sharp.",
  "Weapon Specialization": "Adds extra damage with weapons you are trained deeply enough to use.",
  Dragonblood: "Innate draconic heritage with thematic powers and bloodline implications.",
  "Thief Racket": "Rogue style emphasizing Dexterity-driven precision and finesse.",
  "Sneak Attack": "Extra precision damage when a foe is off-guard or otherwise exposed.",
  "Surprise Attack": "Makes enemies easier to catch off-guard at the start of combat.",
  "Hunt Prey": "Marks a target for ranger-style focus and support actions.",
  "Deny Advantage": "Harder to catch off-guard through flanking or deception.",
  "Low-Light Vision": "Sees better than humans in dim light.",
  "Evasive Reflexes": "Reflex defenses are particularly sharp.",
  "Perception Mastery": "Exceptional battlefield awareness and notice checks.",
  "Flurry of Blows": "Two quick monk Strikes compressed into one action.",
  "Powerful Fist": "Improves unarmed fist attacks significantly.",
  Shield: "Usually indicates magical or tactical access to shield-based defense.",
  "Incredible Movement": "Faster movement than most characters of the same level.",
  "Mystic Strikes": "Unarmed attacks count as magical for bypassing resistances.",
  "Expert Strikes": "Improved weapon or unarmed accuracy and damage scaling.",
  "Perception Expertise": "Very strong perception proficiency for notice and initiative.",
  Reflex: "Enhanced reflexive defense or class progression on Reflex saves.",
  Polymath: "Bardic versatility across performance, knowledge, and spell support.",
  "Composition Spells": "Can use bard composition focus magic and support effects.",
  "Composition Cantrips": "At-will bard support cantrips such as anthem-style effects.",
  Enigma: "Knowledge-leaning bard muse with strong recall and support identity.",
  "Reflex Expertise": "Higher reflex proficiency than baseline.",
  "Signature Spells": "Can heighten selected spontaneous spells more flexibly.",
  Darkvision: "Can see in darkness without needing light.",
  "Expert Spellcaster": "Higher spellcasting proficiency and better spell accuracy.",
  Changeling: "Fey or witch-linked heritage with identity and magical implications.",
};

const ACTION_REFERENCE = [
  { name: "Delay", cost: "Free", detail: "Choose to wait and take your turn later in the initiative order. When you jump back in, your initiative moves to that new spot." },
  { name: "Stride", cost: "1 action", detail: "Move up to your Speed." },
  { name: "Step", cost: "1 action", detail: "Move 5 feet without triggering reactions based on movement." },
  { name: "Strike", cost: "1 action", detail: "Make a melee or ranged attack. Additional attacks the same turn usually take multiple attack penalty." },
  { name: "Raise a Shield", cost: "1 action", detail: "Gain your shield's circumstance bonus to AC until the start of your next turn." },
  { name: "Hide", cost: "1 action", detail: "If you have cover, concealment, or are otherwise obscured, try to become hidden." },
  { name: "Sneak", cost: "1 action", detail: "Move while trying to stay unnoticed. Requires you to already be hidden or undetected." },
  { name: "Seek", cost: "1 action", detail: "Use Perception to look for hidden creatures, hazards, or objects." },
  { name: "Recall Knowledge", cost: "1 action", detail: "Use a relevant skill to learn something useful about a creature, hazard, magic, or situation." },
  { name: "Demoralize", cost: "1 action", detail: "Use Intimidation to frighten a foe that can see or hear you." },
  { name: "Feint", cost: "1 action", detail: "Use Deception against Perception DC to make a target off-guard against your next melee attack." },
  { name: "Trip", cost: "1 action", detail: "Use Athletics to knock a creature prone." },
  { name: "Grapple", cost: "1 action", detail: "Use Athletics to grab and impede a target." },
  { name: "Shove", cost: "1 action", detail: "Use Athletics to push a creature away from you." },
  { name: "Aid", cost: "Reaction", detail: "Prepare to help an ally's action or defense, then roll when the trigger happens." },
  { name: "Ready", cost: "2 actions", detail: "Prepare one action with a trigger and use your reaction to perform it later." },
] as const;

export function EncounterPanel() {
  const [encounter, setEncounter] = useState<EncounterState>(() => loadStoredEncounterState() ?? defaultState);
  const [draft, setDraft] = useState<ParticipantDraft>(emptyDraft);
  const [presets, setPresets] = useState<EncounterPreset[]>([]);
  const [presetGroups, setPresetGroups] = useState<EncounterPresetGroup[]>([]);
  const [selectedQuickAdd, setSelectedQuickAdd] = useState<string>(PARTY_GROUP_VALUE);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [initiativeDraft, setInitiativeDraft] = useState<InitiativeDraft>({});
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(() => new Set());
  const [hpAdjustments, setHpAdjustments] = useState<HpAdjustmentDraft>({});
  const [savedEncounters, setSavedEncounters] = useState<SavedEncounterFile[]>([]);
  const [selectedEncounterFile, setSelectedEncounterFile] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetParticipantId, setSheetParticipantId] = useState<string | null>(null);
  const [actionReferenceOpen, setActionReferenceOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(encounter));
  }, [encounter]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [toasts]);

  useEffect(() => {
    let isActive = true;

    async function loadPresets() {
      const response = await fetch("/api/encounter-presets");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        presets: Array<Omit<EncounterPreset, "effects"> & { effects: string[] }>;
        groups: EncounterPresetGroup[];
      };

      if (!isActive) {
        return;
      }

      setPresets(data.presets.map((preset) => ({
        ...preset,
        effects: normalizeEffects(preset.effects),
      })));
      setPresetGroups(data.groups);
      if (data.groups.length === 0 && data.presets[0]) {
        setSelectedQuickAdd(`preset:${data.presets[0].id}`);
      }
    }

    void loadPresets();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSavedEncounters() {
      const response = await fetch("/api/encounters");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        encounters: SavedEncounterFile[];
      };

      if (!isActive) {
        return;
      }

      setSavedEncounters(data.encounters);
      if (!selectedEncounterFile && data.encounters[0]) {
        setSelectedEncounterFile(data.encounters[0].file);
      }
    }

    void loadSavedEncounters();

    return () => {
      isActive = false;
    };
  }, [selectedEncounterFile]);

  const activeIndex = encounter.participants.findIndex(
    (participant) => participant.id === encounter.activeParticipantId,
  );
  const activeParticipant = activeIndex >= 0 ? encounter.participants[activeIndex] : null;
  const sheetParticipant = sheetParticipantId
    ? encounter.participants.find((participant) => participant.id === sheetParticipantId) ?? null
    : null;
  const nextParticipant = encounter.stage === "running" && encounter.participants.length > 1
    ? encounter.participants[(activeIndex + 1) % encounter.participants.length] ?? null
    : null;
  const quickAddOptions = buildQuickAddOptions(presets, presetGroups);
  const encounterDifficulty = buildEncounterDifficulty(encounter.participants);
  const activeIsMarcel = activeParticipant ? isMarcel(activeParticipant.name) : false;
  const courageousAnthemActive = encounter.participants.some((participant) =>
    participant.role === "character"
    && participant.effects.some((effect) => effect.name === "Courageous Anthem"));
  const hasRunnableEncounter = encounter.participants.some((participant) => participant.initiative !== null)
    || encounter.activeParticipantId !== null
    || encounter.round > 1;

  function updateEncounter(updater: (current: EncounterState) => EncounterState) {
    setEncounter((current) => {
      const next = updater(current);

      if (!next.participants.some((participant) => participant.id === next.activeParticipantId)) {
        return {
          ...next,
          activeParticipantId: next.participants[0]?.id ?? null,
        };
      }

      return next;
    });
  }

  function pushToast(text: string) {
    setToasts((current) => [...current, {
      id: createId(),
      text,
    }]);
  }

  function updateParticipant(
    participantId: string,
    updater: (participant: Participant) => Participant,
  ) {
    updateEncounter((current) => ({
      ...current,
      participants: current.participants.map((participant) => {
        if (participant.id !== participantId) {
          return participant;
        }

        const nextParticipant = updater(participant);
        return {
          ...nextParticipant,
          currentHp: clamp(nextParticipant.currentHp, 0, nextParticipant.maxHp),
          effects: nextParticipant.effects.filter((effect) => effect.name.trim().length > 0),
        };
      }),
    }));
  }

  function addParticipant() {
    if (!draft.name.trim()) {
      return;
    }

    const maxHp = positiveInteger(draft.maxHp, 1);
    const participant: Participant = {
      id: createId(),
      name: draft.name.trim(),
      role: draft.role,
      sourcePath: null,
      sourceTitle: null,
      sourceBody: null,
      level: safeNullableInteger(draft.level),
      maxHp,
      currentHp: maxHp,
      ac: positiveInteger(draft.ac, 10),
      initiative: null,
      initiativeMod: 0,
      effects: [],
      notes: draft.notes.trim(),
      combatProfile: null,
    };

    updateEncounter((current) => ({
      ...current,
      participants: [...current.participants, participant],
    }));
    setDraft(emptyDraft);
    pushToast(`Added ${participant.name}`);
  }

  function addPresetSelection() {
    if (selectedQuickAdd.startsWith("group:")) {
      const groupId = selectedQuickAdd.replace("group:", "");
      const group = presetGroups.find((candidate) => candidate.id === groupId);
      if (!group) {
        return;
      }

      const members = group.memberIds
        .map((id) => presets.find((preset) => preset.id === id))
        .filter((preset): preset is EncounterPreset => Boolean(preset));

      addPresetParticipants(members);
      return;
    }

    if (selectedQuickAdd.startsWith("preset:")) {
      const presetId = selectedQuickAdd.replace("preset:", "");
      const preset = presets.find((candidate) => candidate.id === presetId);
      if (!preset) {
        return;
      }

      addPresetParticipants([preset]);
    }
  }

  function addPresetParticipants(selectedPresets: EncounterPreset[]) {
    if (selectedPresets.length === 0) {
      return;
    }

    updateEncounter((current) => {
      const participants = [...current.participants];

      for (const preset of selectedPresets) {
        const nextName = createUniqueName(
          preset.name,
          participants.map((participant) => participant.name),
        );
        const maxHp = preset.maxHp ?? positiveInteger(draft.maxHp, 1);

        participants.push({
          id: createId(),
          name: nextName,
          role: preset.role,
          sourcePath: preset.sourcePath,
          sourceTitle: preset.sourceTitle,
          sourceBody: preset.sourceBody,
          level: preset.level,
          maxHp,
          currentHp: maxHp,
          ac: preset.ac ?? positiveInteger(draft.ac, 10),
          initiative: null,
          initiativeMod: preset.initiativeMod ?? 0,
          effects: preset.effects.map((effect) => ({ ...effect })),
          notes: preset.notes,
          combatProfile: preset.combatProfile
            ? cloneCombatProfile(preset.combatProfile)
            : null,
        });
      }

      return {
        ...current,
        participants,
      };
    });
    pushToast(selectedPresets.length === 1
      ? `Added ${selectedPresets[0].name}`
      : `Added ${selectedPresets.length} presets`);
  }

  function removeParticipant(participantId: string) {
    updateEncounter((current) => ({
      ...current,
      participants: current.participants.filter((participant) => participant.id !== participantId),
    }));
  }

  function sortForInitiative(participants: Participant[]) {
    return [...participants].sort((left, right) => {
      const rightInit = right.initiative ?? Number.NEGATIVE_INFINITY;
      const leftInit = left.initiative ?? Number.NEGATIVE_INFINITY;

      return rightInit - leftInit
        || right.initiativeMod - left.initiativeMod
        || left.name.localeCompare(right.name);
    });
  }

  function openInitiativeModal() {
    if (encounter.participants.length === 0) {
      return;
    }

    if (hasRunnableEncounter) {
      setPendingAction("roll-initiative");
      setWarningModalOpen(true);
      return;
    }

    openInitiativeEntry();
  }

  function openInitiativeEntry() {
    updateEncounter((current) => ({
      ...current,
      round: 1,
      activeParticipantId: null,
      participants: current.participants.map((participant) => ({
        ...participant,
        initiative: null,
      })),
    }));

    setInitiativeDraft(
      Object.fromEntries(
        encounter.participants.map((participant) => [
          participant.id,
          "",
        ]),
      ),
    );
    setInitiativeModalOpen(true);
  }

  function startEncounterFromInitiative() {
    updateEncounter((current) => {
      const participants = sortForInitiative(
        current.participants.map((participant) => ({
          ...participant,
          initiative: initiativeDraft[participant.id] === ""
            ? null
            : safeInteger(initiativeDraft[participant.id] ?? ""),
        })),
      );

      return {
        ...current,
        stage: "running",
        round: 1,
        participants,
        activeParticipantId: participants[0]?.id ?? null,
      };
    });
    setInitiativeModalOpen(false);
  }

  function returnToSetup() {
    updateEncounter((current) => ({
      ...current,
      stage: "setup",
    }));
  }

  function returnToRun() {
    updateEncounter((current) => ({
      ...current,
      stage: "running",
    }));
  }

  function confirmPendingAction() {
    if (pendingAction === "roll-initiative") {
      setWarningModalOpen(false);
      setPendingAction(null);
      openInitiativeEntry();
      return;
    }

    setWarningModalOpen(false);
    setPendingAction(null);
  }

  function advanceTurn(step: 1 | -1) {
    updateEncounter((current) => {
      if (current.participants.length === 0) {
        return current;
      }

      const participants = current.participants;

      const currentIndex = participants.findIndex(
        (participant) => participant.id === current.activeParticipantId,
      );
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + step + participants.length) % participants.length;
      const wrapsForward = step === 1 && nextIndex === 0;
      const wrapsBackward = step === -1 && safeIndex === 0;

      return {
        ...current,
        round: Math.max(1, current.round + (wrapsForward ? 1 : wrapsBackward ? -1 : 0)),
        participants,
        activeParticipantId: participants[nextIndex]?.id ?? null,
      };
    });
  }

  function delayTurn() {
    updateEncounter((current) => {
      if (current.participants.length < 2 || !current.activeParticipantId) {
        return current;
      }

      const currentIndex = current.participants.findIndex(
        (participant) => participant.id === current.activeParticipantId,
      );

      if (currentIndex === -1) {
        return current;
      }

      const nextIndex = (currentIndex + 1) % current.participants.length;
      const participants = [...current.participants];
      const [activeParticipant] = participants.splice(currentIndex, 1);
      participants.splice(nextIndex, 0, activeParticipant);

      const nextActiveParticipant = participants[currentIndex] ?? participants[0] ?? null;

      return {
        ...current,
        participants,
        activeParticipantId: nextActiveParticipant?.id ?? null,
      };
    });
  }

  function resetEncounter() {
    setEncounter(defaultState);
    setDraft(emptyDraft);
    setInitiativeModalOpen(false);
    setInitiativeDraft({});
    setExpandedParticipants(new Set());
    setHpAdjustments({});
    setMenuOpen(false);
    setSheetParticipantId(null);
    setActionReferenceOpen(false);
    window.localStorage.removeItem(STORAGE_KEY);
    pushToast("Encounter cleared");
  }

  function toggleParticipantExpanded(participantId: string) {
    setExpandedParticipants((current) => {
      const next = new Set(current);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  }

  function addEffect(participantId: string) {
    updateParticipant(participantId, (current) => ({
      ...current,
      effects: [
        ...current.effects,
        {
          id: createId(),
          name: PF2E_EFFECTS[0].name,
          value: "",
        },
      ],
    }));
  }

  function updateEffect(
    participantId: string,
    effectId: string,
    updater: (effect: TrackedEffect) => TrackedEffect,
  ) {
    updateParticipant(participantId, (current) => ({
      ...current,
      effects: current.effects.map((effect) => {
        if (effect.id !== effectId) {
          return effect;
        }

        return updater(effect);
      }),
    }));
  }

  function removeEffect(participantId: string, effectId: string) {
    updateParticipant(participantId, (current) => ({
      ...current,
      effects: current.effects.filter((effect) => effect.id !== effectId),
    }));
  }

  function applyHpAdjustment(participantId: string, mode: "damage" | "heal") {
    const amount = Math.max(1, safeInteger(hpAdjustments[participantId] ?? "1"));
    const participantName = encounter.participants.find((participant) => participant.id === participantId)?.name ?? "Combatant";

    updateParticipant(participantId, (current) => {
      if (mode === "heal") {
        return {
          ...current,
          currentHp: current.currentHp + amount,
        };
      }

      const { effects, remainingDamage } = applyDamageToTemporaryHp(current.effects, amount);

      return {
        ...current,
        currentHp: current.currentHp - remainingDamage,
        effects,
      };
    });

    setHpAdjustments((current) => ({
      ...current,
      [participantId]: String(amount),
    }));
    pushToast(mode === "heal"
      ? `${participantName} healed ${amount}`
      : `${participantName} took ${amount} damage`);
  }

  function applyCourageousAnthem() {
    updateEncounter((current) => ({
      ...current,
      participants: current.participants.map((participant) => {
        if (participant.role !== "character") {
          return participant;
        }

        const existingEffect = participant.effects.find((effect) => effect.name === "Courageous Anthem");
        if (existingEffect) {
          return {
            ...participant,
            effects: participant.effects.map((effect) => effect.name === "Courageous Anthem"
              ? {
                ...effect,
                value: "",
              }
              : effect),
          };
        }

        return {
          ...participant,
          effects: [
            ...participant.effects,
            {
              id: createId(),
              name: "Courageous Anthem",
              value: "",
            },
          ],
        };
      }),
    }));
    pushToast("Courageous Anthem applied to the party");
  }

  function clearCourageousAnthem() {
    updateEncounter((current) => ({
      ...current,
      participants: current.participants.map((participant) => ({
        ...participant,
        effects: participant.effects.filter((effect) => effect.name !== "Courageous Anthem"),
      })),
    }));
    pushToast("Courageous Anthem removed");
  }

  async function saveEncounterToFile() {
    setSaveStatus("Saving...");

    const response = await fetch("/api/encounters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: encounter.name,
        encounter,
      }),
    });

    if (!response.ok) {
      setSaveStatus("Save failed");
      return;
    }

    const data = (await response.json()) as { file: string };
    setSelectedEncounterFile(data.file);
    setSaveStatus("Saved");
    setMenuOpen(false);
    pushToast("Encounter saved");

    const listResponse = await fetch("/api/encounters");
    if (listResponse.ok) {
      const listData = (await listResponse.json()) as { encounters: SavedEncounterFile[] };
      setSavedEncounters(listData.encounters);
    }
  }

  async function loadEncounterFromFile() {
    if (!selectedEncounterFile) {
      return;
    }

    const response = await fetch(`/api/encounters?file=${encodeURIComponent(selectedEncounterFile)}`);
    if (!response.ok) {
      setSaveStatus("Load failed");
      return;
    }

    const data = (await response.json()) as { encounter: EncounterState };
    startTransition(() => {
      setEncounter({
        ...data.encounter,
        participants: normalizeParticipants(data.encounter.participants),
      });
    });
    setSaveStatus("Loaded");
    setMenuOpen(false);
    pushToast("Encounter loaded");
  }

  async function deleteEncounterFromFile() {
    if (!selectedEncounterFile) {
      return;
    }

    setSaveStatus("Deleting...");

    const response = await fetch(`/api/encounters?file=${encodeURIComponent(selectedEncounterFile)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setSaveStatus("Delete failed");
      return;
    }

    const nextSelected = savedEncounters.find((encounterFile) => encounterFile.file !== selectedEncounterFile)?.file ?? "";
    setSelectedEncounterFile(nextSelected);
    setSaveStatus("Deleted");
    setMenuOpen(false);
    pushToast("Encounter deleted");

    const listResponse = await fetch("/api/encounters");
    if (listResponse.ok) {
      const listData = (await listResponse.json()) as { encounters: SavedEncounterFile[] };
      setSavedEncounters(listData.encounters);
      if (!nextSelected && listData.encounters[0]) {
        setSelectedEncounterFile(listData.encounters[0].file);
      }
    }
  }

  const canOpenInitiative = encounter.participants.length > 0;
  const initiativeReady = encounter.participants.every((participant) => {
    const value = initiativeDraft[participant.id];
    return typeof value === "string" && value.trim() !== "";
  });

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              PF2e Encounter Runner
            </p>
            <input
              className="mt-1 w-full max-w-2xl border-none bg-transparent p-0 text-3xl font-semibold text-stone-900 outline-none"
              onChange={(event) => updateEncounter((current) => ({
                ...current,
                name: event.target.value,
              }))}
              type="text"
              value={encounter.name}
            />
            <p className="mt-2 text-sm text-stone-600">
              Setup the roster, roll initiative in one popup, then run the fight from a focused combat screen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-stone-300 bg-white p-1 shadow-sm">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              encounter.stage === "setup"
                ? "bg-stone-900 text-stone-50"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            onClick={returnToSetup}
            type="button"
          >
            Setup
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              encounter.stage === "running"
                ? "bg-stone-900 text-stone-50"
                : "text-stone-600 hover:bg-stone-100"
            } ${!hasRunnableEncounter ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={!hasRunnableEncounter}
            onClick={returnToRun}
            type="button"
          >
            Run
          </button>
        </div>
        <div className="relative">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-sm transition hover:bg-stone-100"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span className="sr-only">Encounter menu</span>
            <span className="text-xl leading-none">≡</span>
          </button>

          {menuOpen ? (
            <>
              <button
                aria-label="Close encounter menu"
                className="fixed inset-0 z-10 cursor-default bg-transparent"
                onClick={() => setMenuOpen(false)}
                type="button"
              />
              <div className="absolute right-0 top-14 z-20 w-72 rounded-3xl border border-stone-300 bg-white p-4 shadow-[0_20px_60px_rgba(35,25,12,0.2)]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Saved Encounters
                  </p>
                  <select
                    className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-600"
                    onChange={(event) => setSelectedEncounterFile(event.target.value)}
                    value={selectedEncounterFile}
                  >
                    <option value="">Select saved encounter</option>
                    {savedEncounters.map((savedEncounter) => (
                      <option key={savedEncounter.file} value={savedEncounter.file}>
                        {savedEncounter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-stone-700"
                    onClick={saveEncounterToFile}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    onClick={loadEncounterFromFile}
                    type="button"
                  >
                    Load
                  </button>
                  <button
                    className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    onClick={deleteEncounterFromFile}
                    type="button"
                  >
                    Delete
                  </button>
                  <button
                    className="rounded-2xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    onClick={resetEncounter}
                    type="button"
                  >
                    Clear Encounter
                  </button>
                </div>

                {saveStatus ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                    {saveStatus}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(52,38,18,0.1)]">
            <div className="grid gap-3 md:grid-cols-5">
              <QuickSummary label="Participants" value={encounter.participants.length} />
              <QuickSummary label="Stage" value={capitalize(encounter.stage)} />
              <QuickSummary label="Round" value={encounter.round} />
              <QuickSummary
                label="Defeated"
                value={encounter.participants.filter((participant) => participant.currentHp === 0).length}
              />
              <ThreatSummary difficulty={encounterDifficulty} />
            </div>
          </section>

          {encounter.stage === "setup" ? (
            <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-900">Encounter Setup</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Add everyone to the encounter first. When you are ready, use one initiative popup to enter all rolls.
                  </p>
                </div>

                <button
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    canOpenInitiative
                      ? "bg-stone-900 text-stone-50 hover:bg-stone-700"
                      : "cursor-not-allowed bg-stone-200 text-stone-500"
                  }`}
                  disabled={!canOpenInitiative}
                  onClick={openInitiativeModal}
                  type="button"
                >
                  Roll Initiative
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="space-y-2 md:col-span-2 xl:col-span-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Quick Add From Notes
                  </span>
                  <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                    <select
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white md:flex-[1.8]"
                      onChange={(event) => setSelectedQuickAdd(event.target.value)}
                      value={selectedQuickAdd}
                    >
                      {quickAddOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 md:min-w-40"
                      onClick={addPresetSelection}
                      type="button"
                    >
                      Add Preset
                    </button>
                  </div>
                </label>

                <div className="grid gap-4 xl:grid-cols-[minmax(320px,3.2fr)_minmax(130px,0.9fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(100px,0.6fr)] xl:items-end">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Name
                    </span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))}
                      placeholder="Saskia, Ghoul Stalker..."
                      type="text"
                      value={draft.name}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Role
                    </span>
                    <select
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        role: event.target.value as ParticipantRole,
                      }))}
                      value={draft.role}
                    >
                      <option value="character">Character</option>
                      <option value="npc">NPC</option>
                      <option value="enemy">Enemy</option>
                      <option value="hazard">Hazard</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Level
                    </span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                      inputMode="numeric"
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        level: event.target.value,
                      }))}
                      type="number"
                      value={draft.level}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Max HP
                    </span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                      inputMode="numeric"
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        maxHp: event.target.value,
                      }))}
                      type="number"
                      value={draft.maxHp}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      AC
                    </span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                      inputMode="numeric"
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        ac: event.target.value,
                      }))}
                      type="number"
                      value={draft.ac}
                    />
                  </label>

                </div>

                <label className="space-y-2 md:col-span-2 xl:col-span-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Notes
                  </span>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))}
                    placeholder="Reactive Strike, resistance, weakness, special routine, or anything useful to remember in combat..."
                    value={draft.notes}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  onClick={addParticipant}
                  type="button"
                >
                  Add to Encounter
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {encounter.participants.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">
                    No one is in the encounter yet. Add at least one combatant to begin.
                  </div>
                ) : (
                  encounter.participants.map((participant) => (
                    <article
                      key={participant.id}
                      className="rounded-3xl border border-stone-200 bg-stone-50/80 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold text-stone-900">
                              {participant.name}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(participant.role)}`}>
                              {roleLabels[participant.role]}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-stone-600">
                            Prep combatants here before initiative is entered.
                          </p>
                        </div>

                        <button
                          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-red-300 hover:text-red-700"
                          onClick={() => removeParticipant(participant.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 xl:grid-cols-[minmax(320px,3.2fr)_minmax(130px,0.9fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(100px,0.6fr)] xl:items-end">
                          <InlineField
                            label="Name"
                            onChange={(value) => updateParticipant(participant.id, (current) => ({
                              ...current,
                              name: value,
                            }))}
                            value={participant.name}
                          />
                          <InlineSelect
                            label="Role"
                            onChange={(value) => updateParticipant(participant.id, (current) => ({
                              ...current,
                              role: value as ParticipantRole,
                            }))}
                            options={[
                              { label: "Character", value: "character" },
                              { label: "NPC", value: "npc" },
                              { label: "Enemy", value: "enemy" },
                              { label: "Hazard", value: "hazard" },
                            ]}
                            value={participant.role}
                          />
                          <InlineNumberField
                            label="Level"
                            onChange={(value) => updateParticipant(participant.id, (current) => ({
                              ...current,
                              level: value === "" ? null : safeInteger(value),
                            }))}
                            value={participant.level ?? ""}
                          />
                          <InlineNumberField
                            label="Max HP"
                            onChange={(value) => updateParticipant(participant.id, (current) => ({
                              ...current,
                              maxHp: Math.max(1, safeInteger(value)),
                            }))}
                            value={participant.maxHp}
                          />
                          <InlineNumberField
                            label="AC"
                            onChange={(value) => updateParticipant(participant.id, (current) => ({
                              ...current,
                              ac: Math.max(1, safeInteger(value)),
                            }))}
                            value={participant.ac}
                          />
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Effects
                            </span>
                            <EffectEditor
                              effects={participant.effects}
                              onAdd={() => addEffect(participant.id)}
                              onChange={(effectId, updater) => updateEffect(participant.id, effectId, updater)}
                              onRemove={(effectId) => removeEffect(participant.id, effectId)}
                              tone="light"
                            />
                          </div>
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Notes
                            </span>
                            <textarea
                              className="min-h-28 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600"
                              onChange={(event) => updateParticipant(participant.id, (current) => ({
                                ...current,
                                notes: event.target.value,
                              }))}
                              value={participant.notes}
                            />
                          </label>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-2xl font-semibold text-stone-900">Run Encounter</h2>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5 lg:flex-1 lg:justify-end">
                    {activeIsMarcel ? (
                      <button
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          courageousAnthemActive
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                        }`}
                        onClick={courageousAnthemActive ? clearCourageousAnthem : applyCourageousAnthem}
                        type="button"
                      >
                        Courageous Anthem
                      </button>
                    ) : null}
                    <button
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      onClick={() => advanceTurn(-1)}
                      type="button"
                    >
                      Previous Turn
                    </button>
                    <button
                      className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-stone-700"
                      onClick={() => advanceTurn(1)}
                      type="button"
                    >
                      Next Turn
                    </button>
                    <button
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      onClick={delayTurn}
                      type="button"
                    >
                      Delay Turn
                    </button>
                    <button
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      onClick={() => setActionReferenceOpen(true)}
                      type="button"
                    >
                      Combat Actions
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-amber-300/70 bg-[linear-gradient(135deg,#fff5d9_0%,#f0dcc1_100%)] p-6 shadow-[0_20px_70px_rgba(87,56,14,0.15)]">
                <div className="space-y-4">
                  <div className="rounded-[30px] bg-stone-950 px-6 py-6 text-stone-100">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">Now Acting</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <h2 className="text-4xl font-semibold">
                            {activeParticipant?.name ?? "No active combatant"}
                          </h2>
                          {activeParticipant ? (
                            (activeParticipant.combatProfile || activeParticipant.sourceBody) ? (
                              <button
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-95 ${roleTone(activeParticipant.role)}`}
                                onClick={() => setSheetParticipantId(activeParticipant.id)}
                                type="button"
                              >
                                {roleLabels[activeParticipant.role]}
                              </button>
                            ) : (
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(activeParticipant.role)}`}>
                                {roleLabels[activeParticipant.role]}
                              </span>
                            )
                          ) : null}
                        </div>
                        {!activeParticipant ? (
                          <p className="mt-3 text-sm text-stone-300">
                            Start the encounter to track turn order here.
                          </p>
                        ) : null}
                      </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <RunStatCard label="Round" value={encounter.round} />
                      <RunStatCard
                        label="Initiative"
                          value={activeParticipant?.initiative ?? "—"}
                        />
                        <RunStatCard
                          label="HP"
                          value={activeParticipant ? `${activeParticipant.currentHp}/${activeParticipant.maxHp}` : "—"}
                        />
                        <RunStatCard
                          label="AC"
                          value={activeParticipant?.ac ?? "—"}
                        />
                      </div>
                    </div>

                    {activeParticipant ? (
                      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <HpAdjuster
                            amount={hpAdjustments[activeParticipant.id] ?? "1"}
                            onAmountChange={(value) => setHpAdjustments((current) => ({
                              ...current,
                              [activeParticipant.id]: value,
                            }))}
                            onDamage={() => applyHpAdjustment(activeParticipant.id, "damage")}
                            onHeal={() => applyHpAdjustment(activeParticipant.id, "heal")}
                            tone="dark"
                          />
                          <InlineNumberFieldDark
                            label="AC"
                            onChange={(value) => updateParticipant(activeParticipant.id, (current) => ({
                              ...current,
                              ac: Math.max(1, safeInteger(value)),
                            }))}
                            value={activeParticipant.ac}
                          />
                          <InlineNumberFieldDark
                            label="Initiative"
                            onChange={(value) => updateParticipant(activeParticipant.id, (current) => ({
                              ...current,
                              initiative: value === "" ? null : safeInteger(value),
                            }))}
                            value={activeParticipant.initiative ?? ""}
                          />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                              Effects
                            </span>
                            <EffectEditor
                              effects={activeParticipant.effects}
                              onAdd={() => addEffect(activeParticipant.id)}
                              onChange={(effectId, updater) => updateEffect(activeParticipant.id, effectId, updater)}
                              onRemove={(effectId) => removeEffect(activeParticipant.id, effectId)}
                              tone="dark"
                            />
                          </div>
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                              Notes
                            </span>
                            <textarea
                              className="min-h-32 w-full rounded-2xl border border-stone-700 bg-stone-900/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-500"
                              onChange={(event) => updateParticipant(activeParticipant.id, (current) => ({
                                ...current,
                                notes: event.target.value,
                              }))}
                              value={activeParticipant.notes}
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full rounded-3xl bg-white/80 px-5 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">On Deck</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold text-stone-900">
                        {nextParticipant?.name ?? "Waiting on turn order"}
                      </h3>
                      {nextParticipant ? (
                        (nextParticipant.combatProfile || nextParticipant.sourceBody) ? (
                          <button
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-95 ${roleTone(nextParticipant.role)}`}
                            onClick={() => setSheetParticipantId(nextParticipant.id)}
                            type="button"
                          >
                            {roleLabels[nextParticipant.role]}
                          </button>
                        ) : (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(nextParticipant.role)}`}>
                            {roleLabels[nextParticipant.role]}
                          </span>
                        )
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {nextParticipant
                        ? `Initiative ${nextParticipant.initiative ?? "—"} • HP ${nextParticipant.currentHp}/${nextParticipant.maxHp} • AC ${nextParticipant.ac}`
                        : "The next actor will appear here once turn order is established."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <div className="space-y-3">
                  {encounter.participants.map((participant, index) => {
                    const isActive = participant.id === encounter.activeParticipantId;
                    const isNext = nextParticipant?.id === participant.id;
                    const isExpanded = expandedParticipants.has(participant.id);
                    const rowTone = isActive
                      ? "border-amber-400 bg-amber-50"
                      : isNext
                        ? "border-sky-300 bg-sky-50"
                        : "border-stone-200 bg-stone-50/80";

                    return (
                      <div
                        key={participant.id}
                        className={`rounded-3xl border p-4 transition ${rowTone}`}
                      >
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_120px_120px_110px]">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
                                {index + 1}
                              </span>
                              <p className="truncate text-lg font-semibold text-stone-900">
                                {participant.name}
                              </p>
                              {(participant.combatProfile || participant.sourceBody) ? (
                                <button
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-95 ${roleTone(participant.role)}`}
                                  onClick={() => setSheetParticipantId(participant.id)}
                                  type="button"
                                >
                                  {roleLabels[participant.role]}
                                </button>
                              ) : (
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(participant.role)}`}>
                                  {roleLabels[participant.role]}
                                </span>
                              )}
                              {isActive ? (
                                <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                                  Up
                                </span>
                              ) : null}
                              {!isActive && isNext ? (
                                <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
                                  Next
                                </span>
                              ) : null}
                              {participant.currentHp === 0 ? (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  Defeated
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-stone-600">
                              {participant.effects.length > 0 ? formatEffectsSummary(participant.effects) : "No active effects"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Initiative
                            </span>
                            <p className="text-sm font-semibold text-stone-900">
                              {participant.initiative ?? "—"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              HP / AC
                            </span>
                            <p className="text-sm font-semibold text-stone-900">
                              {participant.currentHp}/{participant.maxHp} • AC {participant.ac}
                            </p>
                          </div>

                          <div className="flex items-start justify-end md:justify-center">
                            <button
                              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                              onClick={() => toggleParticipantExpanded(participant.id)}
                              title={isExpanded ? "Collapse details" : "Expand details"}
                              type="button"
                            >
                              {isExpanded ? "-" : "+"}
                            </button>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="mt-4 grid gap-4 border-t border-stone-200/80 pt-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                            <div className="space-y-4">
                              <HpAdjuster
                                amount={hpAdjustments[participant.id] ?? "1"}
                                onAmountChange={(value) => setHpAdjustments((current) => ({
                                  ...current,
                                  [participant.id]: value,
                                }))}
                                onDamage={() => applyHpAdjustment(participant.id, "damage")}
                                onHeal={() => applyHpAdjustment(participant.id, "heal")}
                                tone="light"
                              />
                              <InlineNumberField
                                label="AC"
                                onChange={(value) => updateParticipant(participant.id, (current) => ({
                                  ...current,
                                  ac: Math.max(1, safeInteger(value)),
                                }))}
                                value={participant.ac}
                              />
                              <InlineNumberField
                                label="Initiative"
                                onChange={(value) => updateParticipant(participant.id, (current) => ({
                                  ...current,
                                  initiative: value === "" ? null : safeInteger(value),
                                }))}
                                value={participant.initiative ?? ""}
                              />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                  Effects
                                </span>
                                <EffectEditor
                                  effects={participant.effects}
                                  onAdd={() => addEffect(participant.id)}
                                  onChange={(effectId, updater) => updateEffect(participant.id, effectId, updater)}
                                  onRemove={(effectId) => removeEffect(participant.id, effectId)}
                                  tone="light"
                                />
                              </div>
                              <label className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                  Notes
                                </span>
                                <textarea
                                  className="min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600"
                                  onChange={(event) => updateParticipant(participant.id, (current) => ({
                                    ...current,
                                    notes: event.target.value,
                                  }))}
                                  value={participant.notes}
                                />
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {sheetParticipant?.role === "character" && sheetParticipant.combatProfile ? (
        <SheetDetailsModal
          onClose={() => setSheetParticipantId(null)}
          participant={sheetParticipant}
        />
      ) : sheetParticipant?.sourceBody ? (
        <StatBlockModal
          onClose={() => setSheetParticipantId(null)}
          participant={sheetParticipant}
        />
      ) : null}

      {actionReferenceOpen ? (
        <ActionReferenceModal onClose={() => setActionReferenceOpen(false)} />
      ) : null}

      {warningModalOpen ? (
        <ConfirmModal
          confirmLabel="Proceed"
          message="Rolling initiative now will erase the current running encounter state and start a new turn order."
          onClose={() => {
            setWarningModalOpen(false);
            setPendingAction(null);
          }}
          onConfirm={confirmPendingAction}
          title="Replace Current Encounter?"
        />
      ) : null}

      {initiativeModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => setInitiativeModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Initiative
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-stone-900">Enter Everyone&apos;s Initiative</h2>
                <p className="mt-2 text-sm text-stone-600">
                  Drop in the rolled numbers here, then jump straight into the run view.
                </p>
              </div>

              <button
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => setInitiativeModalOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {encounter.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 md:grid-cols-[minmax(0,1.4fr)_180px_180px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-stone-900">
                        {participant.name}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(participant.role)}`}>
                        {roleLabels[participant.role]}
                      </span>
                    </div>
                  </div>

                  <InlineNumberField
                    label="Initiative"
                    onChange={(value) => setInitiativeDraft((current) => ({
                      ...current,
                      [participant.id]: value,
                    }))}
                    value={initiativeDraft[participant.id] ?? ""}
                  />

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Initiative Bonus
                    </span>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                      {formatSignedNumber(participant.initiativeMod)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => setInitiativeModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  initiativeReady
                    ? "bg-stone-900 text-stone-50 hover:bg-stone-700"
                    : "cursor-not-allowed bg-stone-200 text-stone-500"
                }`}
                disabled={!initiativeReady}
                onClick={startEncounterFromInitiative}
                type="button"
              >
                Start Encounter
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-full max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 text-sm font-semibold text-stone-800 shadow-[0_16px_40px_rgba(35,25,12,0.18)] backdrop-blur"
            >
              {toast.text}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function InlineField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
    </label>
  );
}

function InlineNumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: number | string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </label>
  );
}

function InlineNumberFieldDark({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: number | string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
        {label}
      </span>
      <input
        className="w-full rounded-2xl border border-stone-700 bg-stone-900/70 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-500"
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </label>
  );
}

function InlineSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <select
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EffectEditor({
  effects,
  onAdd,
  onChange,
  onRemove,
  tone,
}: {
  effects: TrackedEffect[];
  onAdd: () => void;
  onChange: (effectId: string, updater: (effect: TrackedEffect) => TrackedEffect) => void;
  onRemove: (effectId: string) => void;
  tone: "light" | "dark";
}) {
  const selectClass = tone === "dark"
    ? "border-stone-700 bg-stone-900/70 text-stone-100 focus:border-amber-500"
    : "border-stone-300 bg-white text-stone-900 focus:border-amber-600";
  const fieldClass = tone === "dark"
    ? "border-stone-700 bg-stone-900/70 text-stone-100 focus:border-amber-500"
    : "border-stone-300 bg-white text-stone-900 focus:border-amber-600";
  const buttonClass = tone === "dark"
    ? "border-stone-700 bg-stone-900/70 text-stone-100 hover:bg-stone-800"
    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";

  return (
    <div className="space-y-3">
      {effects.length > 0 ? (
        effects.map((effect) => {
          const metadata = EFFECT_LOOKUP.get(effect.name);
          const needsValue = metadata?.hasValue ?? effect.value.trim().length > 0;
          const options = metadata || effect.name === ""
            ? PF2E_EFFECTS
            : [...PF2E_EFFECTS, {
              name: effect.name,
              summary: "Custom effect.",
              hasValue: effect.value.trim().length > 0,
            }];

          return (
            <div key={effect.id} className="rounded-2xl border border-stone-200/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={`min-w-0 flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none transition ${selectClass}`}
                  onChange={(event) => onChange(effect.id, (current) => ({
                    ...current,
                    name: event.target.value,
                    value: EFFECT_LOOKUP.get(event.target.value)?.hasValue ? current.value : "",
                  }))}
                  title={metadata?.summary ?? "Choose a Pathfinder 2e condition or tracked effect."}
                  value={effect.name}
                >
                  {options.map((option) => (
                    <option key={option.name} title={option.summary} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>

                {needsValue ? (
                  <input
                    className={`w-20 rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${fieldClass}`}
                    onChange={(event) => onChange(effect.id, (current) => ({
                      ...current,
                      value: event.target.value,
                    }))}
                    placeholder="Val"
                    title={metadata?.summary ?? "Condition value"}
                    type="text"
                    value={effect.value}
                  />
                ) : null}

                <button
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${buttonClass}`}
                  onClick={() => onRemove(effect.id)}
                  title="Remove effect"
                  type="button"
                >
                  -
                </button>
              </div>
            </div>
          );
        })
      ) : null}

      <button
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${buttonClass}`}
        onClick={onAdd}
        type="button"
      >
        Add Effect
      </button>
    </div>
  );
}

function HpAdjuster({
  amount,
  onAmountChange,
  onDamage,
  onHeal,
  tone,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  onDamage: () => void;
  onHeal: () => void;
  tone: "light" | "dark";
}) {
  const fieldClass = tone === "dark"
    ? "border-stone-700 bg-stone-900/70 text-stone-100 focus:border-amber-500"
    : "border-stone-300 bg-white text-stone-900 focus:border-amber-600";
  const buttonClass = tone === "dark"
    ? "border-stone-700 bg-stone-900/70 text-stone-100 hover:bg-stone-800"
    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
  const labelClass = tone === "dark" ? "text-stone-400" : "text-stone-500";

  return (
    <div className="space-y-2">
      <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>
        HP Adjust
      </span>
      <div className="flex items-center gap-2">
        <input
          className={`w-20 rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${fieldClass}`}
          inputMode="numeric"
          onChange={(event) => onAmountChange(event.target.value)}
          type="number"
          value={amount}
        />
        <button
          className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${buttonClass}`}
          onClick={onDamage}
          type="button"
        >
          -
        </button>
        <button
          className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${buttonClass}`}
          onClick={onHeal}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ProfileLine({
  label,
  tone,
  values,
}: {
  label: string;
  tone: "light" | "dark";
  values: string[];
}) {
  const labelClass = tone === "dark" ? "text-stone-400" : "text-stone-500";
  const textClass = tone === "dark" ? "text-stone-100" : "text-stone-800";

  if (values.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>{label}</p>
      <p className={`text-sm leading-6 ${textClass}`}>{values.join(" • ")}</p>
    </div>
  );
}

function SheetDetailsModal({
  onClose,
  participant,
}: {
  onClose: () => void;
  participant: Participant;
}) {
  const profile = participant.combatProfile;
  if (!profile) {
    return null;
  }

  const sourceLabel = profile.sourcePath.replace(/^.*?games\/corona-eclipsa\//, "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Sheet Details</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold text-stone-900">{participant.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(participant.role)}`}>
                {roleLabels[participant.role]}
              </span>
            </div>
          </div>

          <button
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {profile.summary.map((item) => (
            <span
              key={item}
              className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-800"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <ProfileLine label="Saves" tone="light" values={profile.saves} />
            <ProfileEntrySection
              entries={profile.attacks}
              label="Attacks"
              lookup={ATTACK_LOOKUP}
            />
            <ProfileEntrySection
              entries={profile.skills}
              label="Skills"
              lookup={SKILL_LOOKUP}
            />
            <ProfileEntrySection
              entries={profile.specials}
              label="Traits"
              lookup={TRAIT_LOOKUP}
            />
            <ProfileLine label="Resistances" tone="light" values={profile.resistances} />
          </div>
          <div className="space-y-5">
            <SpellEntrySection
              entries={profile.spells}
              label="Spells"
              lookup={SPELL_LOOKUP}
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Sheet Source</p>
            <p className="text-sm text-stone-700">{sourceLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlockModal({
  onClose,
  participant,
}: {
  onClose: () => void;
  participant: Participant;
}) {
  const sourceLabel = participant.sourcePath
    ? participant.sourcePath.replace(/^.*?games\/corona-eclipsa\//, "")
    : "Unknown source";
  const lines = (participant.sourceBody ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Encounter Notes</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold text-stone-900">{participant.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(participant.role)}`}>
                {roleLabels[participant.role]}
              </span>
            </div>
            {participant.sourceTitle ? (
              <p className="mt-2 text-sm text-stone-600">{participant.sourceTitle}</p>
            ) : null}
          </div>

          <button
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {lines.map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Source</p>
          <p className="mt-1 text-sm text-stone-700">{sourceLabel}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileEntrySection({
  entries,
  label,
  lookup,
}: {
  entries: EncounterProfileEntry[];
  label: string;
  lookup: Record<string, string>;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const tooltip = lookup[getLookupKey(entry.label)] ?? entry.detail;

          return (
            <button
              key={`${label}-${entry.label}`}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm transition hover:bg-stone-100"
              title={tooltip}
              type="button"
            >
              {entry.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpellEntrySection({
  entries,
  label,
  lookup,
}: {
  entries: EncounterProfileEntry[];
  label: string;
  lookup: Record<string, string>;
}) {
  if (entries.length === 0) {
    return null;
  }

  const groups = entries.reduce<Record<string, EncounterProfileEntry[]>>((output, entry) => {
    output[entry.detail] ??= [];
    output[entry.detail].push(entry);
    return output;
  }, {});

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      {Object.entries(groups).map(([group, groupEntries]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{group}</p>
          <div className="flex flex-wrap gap-2">
            {groupEntries.map((entry) => (
              <button
                key={`${group}-${entry.label}`}
                className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm transition hover:bg-stone-100"
                title={lookup[getLookupKey(entry.label)] ?? entry.detail}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getLookupKey(label: string) {
  return label.replace(/\s+[+-]\d+$/, "").trim();
}

function ActionReferenceModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Combat Actions</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-900">PF2e Combat Reference</h2>
            <p className="mt-2 text-sm text-stone-600">
              Quick reminders for common turn options at the table.
            </p>
          </div>

          <button
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {ACTION_REFERENCE.map((action) => (
            <div
              key={action.name}
              className="rounded-3xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-900">{action.name}</h3>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                  {action.cost}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">{action.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  confirmLabel,
  message,
  onClose,
  onConfirm,
  title,
}: {
  confirmLabel: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Warning</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">{message}</p>
          </div>

          <button
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickSummary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <span className="text-sm text-stone-600">{label}</span>
      <span className="text-lg font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function ThreatSummary({ difficulty }: { difficulty: EncounterDifficulty }) {
  const hasPartyLevel = difficulty.partyLevel !== null;
  const summary = hasPartyLevel
    ? `${difficulty.label} • ${difficulty.xp} XP`
    : "Add PC levels";

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-stone-600">Threat</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficulty.tone}`}>
          {summary}
        </span>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {hasPartyLevel
          ? `Party L${difficulty.partyLevel} • ${difficulty.partySize} allies • ${difficulty.enemyCount} opposition`
          : "Encounter XP appears once at least one character has a level."}
      </p>
    </div>
  );
}

function RunStatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="text-sm font-semibold text-stone-50">{value}</p>
    </div>
  );
}

function safeInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeNullableInteger(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInteger(value: string, fallback: number) {
  const parsed = safeInteger(value);
  return parsed > 0 ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSignedNumber(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function isMarcel(name: string) {
  return name.trim().toLowerCase().startsWith("marcel");
}

function roleTone(role: ParticipantRole) {
  if (role === "character") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (role === "npc") {
    return "bg-sky-100 text-sky-800";
  }

  if (role === "hazard") {
    return "bg-violet-100 text-violet-800";
  }

  return "bg-rose-100 text-rose-800";
}

function buildEncounterDifficulty(participants: Participant[]): EncounterDifficulty {
  const alliedParticipants = participants.filter((participant) =>
    participant.role === "character" || participant.role === "npc");
  const playerCharacters = participants.filter((participant) => participant.role === "character");
  const opposition = participants.filter((participant) =>
    participant.role === "enemy" || participant.role === "hazard");
  const partyLevels = playerCharacters
    .map((participant) => participant.level)
    .filter((level): level is number => typeof level === "number");
  const partyLevel = partyLevels.length > 0
    ? Math.round(partyLevels.reduce((sum, level) => sum + level, 0) / partyLevels.length)
    : null;
  const partySize = alliedParticipants.length;
  const budgets = adjustEncounterBudgets(partySize);
  const xp = partyLevel === null
    ? 0
    : opposition.reduce((sum, participant) => sum + calculateOpponentXp(partyLevel, participant.level), 0);

  return {
    partyLevel,
    partySize,
    enemyCount: opposition.length,
    xp,
    budgets,
    label: determineThreatLabel(xp, budgets),
    tone: determineThreatTone(xp, budgets, partyLevel !== null),
  };
}

function adjustEncounterBudgets(partySize: number) {
  const adjustmentSteps = partySize - 4;

  return {
    trivial: Math.max(0, XP_BUDGETS.trivial + adjustmentSteps * XP_ADJUSTMENTS.trivial),
    low: Math.max(0, XP_BUDGETS.low + adjustmentSteps * XP_ADJUSTMENTS.low),
    moderate: Math.max(0, XP_BUDGETS.moderate + adjustmentSteps * XP_ADJUSTMENTS.moderate),
    severe: Math.max(0, XP_BUDGETS.severe + adjustmentSteps * XP_ADJUSTMENTS.severe),
    extreme: Math.max(0, XP_BUDGETS.extreme + adjustmentSteps * XP_ADJUSTMENTS.extreme),
  };
}

function calculateOpponentXp(partyLevel: number, opponentLevel: number | null) {
  if (opponentLevel === null) {
    return 0;
  }

  const levelDelta = opponentLevel - partyLevel;
  if (levelDelta <= -4) {
    return 10;
  }

  if (levelDelta === -3) {
    return 15;
  }

  if (levelDelta === -2) {
    return 20;
  }

  if (levelDelta === -1) {
    return 30;
  }

  if (levelDelta === 0) {
    return 40;
  }

  if (levelDelta === 1) {
    return 60;
  }

  if (levelDelta === 2) {
    return 80;
  }

  if (levelDelta === 3) {
    return 120;
  }

  return 160;
}

function determineThreatLabel(
  xp: number,
  budgets: EncounterDifficulty["budgets"],
): EncounterDifficulty["label"] {
  if (xp <= budgets.trivial) {
    return "Trivial";
  }

  if (xp <= budgets.low) {
    return "Low";
  }

  if (xp <= budgets.moderate) {
    return "Moderate";
  }

  if (xp <= budgets.severe) {
    return "Severe";
  }

  if (xp <= budgets.extreme) {
    return "Extreme";
  }

  return "Over Extreme";
}

function determineThreatTone(
  xp: number,
  budgets: EncounterDifficulty["budgets"],
  hasPartyLevel: boolean,
) {
  if (!hasPartyLevel) {
    return "bg-stone-200 text-stone-700";
  }

  if (xp <= budgets.low) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (xp <= budgets.moderate) {
    return "bg-yellow-100 text-yellow-800";
  }

  if (xp <= budgets.severe) {
    return "bg-orange-100 text-orange-800";
  }

  return "bg-rose-100 text-rose-800";
}

function loadStoredEncounterState(): EncounterState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedState = window.localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedState) as EncounterState;
    return {
      ...parsed,
      stage: parsed.stage ?? "setup",
      participants: normalizeParticipants(parsed.participants),
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function normalizeParticipants(participants: unknown): Participant[] {
  if (!Array.isArray(participants)) {
    return [];
  }

  return participants.flatMap((participant) => {
    if (!participant || typeof participant !== "object") {
      return [];
    }

    const current = participant as Partial<Participant>;

    return [{
      id: typeof current.id === "string" ? current.id : createId(),
      name: typeof current.name === "string" ? current.name : "Unknown",
      role: current.role === "character" || current.role === "npc" || current.role === "enemy"
        || current.role === "hazard"
        ? current.role
        : "enemy",
      sourcePath: typeof current.sourcePath === "string" ? current.sourcePath : null,
      sourceTitle: typeof current.sourceTitle === "string" ? current.sourceTitle : null,
      sourceBody: typeof current.sourceBody === "string" ? current.sourceBody : null,
      level: typeof current.level === "number" ? current.level : null,
      maxHp: typeof current.maxHp === "number" ? current.maxHp : 1,
      currentHp: typeof current.currentHp === "number" ? current.currentHp : 1,
      ac: typeof current.ac === "number" ? current.ac : 10,
      initiative: typeof current.initiative === "number" ? current.initiative : null,
      initiativeMod: typeof current.initiativeMod === "number" ? current.initiativeMod : 0,
      effects: normalizeEffects(current.effects),
      notes: typeof current.notes === "string" ? current.notes : "",
      combatProfile: normalizeCombatProfile(current.combatProfile),
    }];
  });
}

function normalizeCombatProfile(value: unknown): EncounterCombatProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const profile = value as Partial<EncounterCombatProfile>;
  if (typeof profile.sourcePath !== "string") {
    return null;
  }

  return {
    sourcePath: profile.sourcePath,
    summary: normalizeStringList(profile.summary),
    saves: normalizeStringList(profile.saves),
    attacks: normalizeProfileEntries(profile.attacks),
    skills: normalizeProfileEntries(profile.skills),
    spells: normalizeProfileEntries(profile.spells),
    specials: normalizeProfileEntries(profile.specials),
    resistances: normalizeStringList(profile.resistances),
  };
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeProfileEntries(value: unknown): EncounterProfileEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const current = entry as Partial<EncounterProfileEntry>;
    if (typeof current.label !== "string" || typeof current.detail !== "string") {
      return [];
    }

    return [{
      label: current.label,
      detail: current.detail,
    }];
  });
}

function cloneCombatProfile(profile: EncounterCombatProfile): EncounterCombatProfile {
  return {
    sourcePath: profile.sourcePath,
    summary: [...profile.summary],
    saves: [...profile.saves],
    attacks: profile.attacks.map((entry) => ({ ...entry })),
    skills: profile.skills.map((entry) => ({ ...entry })),
    spells: profile.spells.map((entry) => ({ ...entry })),
    specials: profile.specials.map((entry) => ({ ...entry })),
    resistances: [...profile.resistances],
  };
}

function buildQuickAddOptions(
  presets: EncounterPreset[],
  groups: EncounterPresetGroup[],
): QuickAddOption[] {
  const options: QuickAddOption[] = [];

  for (const group of groups) {
    options.push({
      value: `group:${group.id}`,
      label: `${group.name} (${group.memberIds.length})`,
    });
  }

  for (const preset of presets) {
    const source = preset.sourcePath.replace(/^.*?games\/corona-eclipsa\//, "");
    const levelLabel = preset.level !== null ? `L${preset.level}` : "No level";
    options.push({
      value: `preset:${preset.id}`,
      label: `${preset.name} • ${capitalize(preset.role)} • ${levelLabel} • ${source}`,
    });
  }

  if (options.length === 0) {
    options.push({
      value: PARTY_GROUP_VALUE,
      label: "No note presets found",
    });
  }

  return options;
}

function createUniqueName(baseName: string, existingNames: string[]) {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 2;
  while (existingNames.includes(`${baseName} ${counter}`)) {
    counter += 1;
  }

  return `${baseName} ${counter}`;
}

function normalizeEffects(effects: unknown): TrackedEffect[] {
  if (!Array.isArray(effects)) {
    return [];
  }

  return effects.flatMap((effect) => {
    if (typeof effect === "string") {
      const trimmed = effect.trim();
      if (!trimmed) {
        return [];
      }

      return [buildTrackedEffect(trimmed)];
    }

    if (effect && typeof effect === "object") {
      const maybeEffect = effect as Partial<TrackedEffect>;
      if (!maybeEffect.name || typeof maybeEffect.name !== "string") {
        return [];
      }

      return [{
        id: typeof maybeEffect.id === "string" ? maybeEffect.id : createId(),
        name: maybeEffect.name,
        value: typeof maybeEffect.value === "string" ? maybeEffect.value : "",
      }];
    }

    return [];
  });
}

function buildTrackedEffect(rawEffect: string): TrackedEffect {
  const match = rawEffect.match(/^(.*?)(?:\s+(\d+))?$/);
  const baseName = match?.[1]?.trim() || rawEffect.trim();
  const knownEffect = PF2E_EFFECTS.find((effect) => effect.name.toLowerCase() === baseName.toLowerCase());

  return {
    id: createId(),
    name: knownEffect?.name ?? baseName,
    value: match?.[2] ?? "",
  };
}

function formatEffectsSummary(effects: TrackedEffect[]) {
  return effects
    .map((effect) => effect.value.trim() ? `${effect.name} ${effect.value}` : effect.name)
    .join(" • ");
}

function applyDamageToTemporaryHp(effects: TrackedEffect[], damage: number) {
  let remainingDamage = damage;

  const nextEffects = effects.flatMap((effect) => {
    if (effect.name !== "Temporary HP" || remainingDamage <= 0) {
      return [effect];
    }

    const tempHp = Math.max(0, safeInteger(effect.value));
    if (tempHp <= 0) {
      return [];
    }

    if (remainingDamage >= tempHp) {
      remainingDamage -= tempHp;
      return [];
    }

    const nextTempHp = tempHp - remainingDamage;
    remainingDamage = 0;

    return [{
      ...effect,
      value: String(nextTempHp),
    }];
  });

  return {
    effects: nextEffects,
    remainingDamage,
  };
}
