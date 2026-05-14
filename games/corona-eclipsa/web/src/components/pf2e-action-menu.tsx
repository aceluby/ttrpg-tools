"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const BASIC_ACTION_REFERENCE = [
  { name: "Aid", cost: "Reaction", detail: "Trigger: an ally is about to use an action requiring a skill check or attack roll. Prepare to help on your turn, then roll when the trigger happens; success usually grants +1, critical success +2 or better." },
  { name: "Crawl", cost: "1 action", detail: "Requirement: you're prone and have at least 10-foot Speed. Move 5 feet while staying prone." },
  { name: "Delay", cost: "Free", detail: "Trigger: your turn begins. Remove yourself from initiative and re-enter at the end of another creature's turn; your initiative changes to the new spot." },
  { name: "Drop Prone", cost: "1 action", detail: "Fall prone." },
  { name: "Escape", cost: "1 action", detail: "Attempt to escape being grabbed, immobilized, or restrained, usually using your unarmed modifier, Acrobatics, or Athletics against the relevant DC." },
  { name: "Interact", cost: "1 action", detail: "Manipulate an object or terrain: draw, open, pick up, swap held items, and similar tasks." },
  { name: "Leap", cost: "1 action", detail: "Make a short horizontal or vertical jump. Longer jumps usually use High Jump or Long Jump instead." },
  { name: "Ready", cost: "2 actions", detail: "Choose a single action or free action and a trigger. If the trigger happens before your next turn, you use that action as a reaction." },
  { name: "Release", cost: "Free", detail: "Let go of something you're holding. Unlike most manipulate actions, this doesn't trigger reactions to manipulate actions." },
  { name: "Seek", cost: "1 action", detail: "Scan an area for hidden creatures, hazards, secret doors, or objects. The GM rolls a secret Perception check for you." },
  { name: "Sense Motive", cost: "1 action", detail: "Assess whether a creature is acting strangely or deceptively. The GM rolls a secret Perception check against the relevant DC." },
  { name: "Stand", cost: "1 action", detail: "Stand up from prone." },
  { name: "Step", cost: "1 action", detail: "Move 5 feet without triggering reactions based on movement. You can't Step into difficult terrain." },
  { name: "Stride", cost: "1 action", detail: "Move up to your Speed." },
  { name: "Strike", cost: "1 action", detail: "Make a melee or ranged attack with a weapon, unarmed attack, or similar offensive option." },
] as const;

const EXPLORATION_ACTIVITY_REFERENCE = [
  { name: "Avoid Notice", pace: "Half Speed", detail: "Use Stealth while traveling so you can begin encounters sneaking or roll Stealth for initiative when appropriate." },
  { name: "Defend", pace: "Half Speed", detail: "Travel with your shield raised so if combat breaks out you already gain the benefits of Raise a Shield before your first turn." },
  { name: "Detect Magic", pace: "Half Speed", detail: "Repeat detect magic while moving; useful for noticing magical auras before you blunder into them." },
  { name: "Follow the Expert", pace: "Match Ally", detail: "Choose an expert ally's recurring tactic or skill-based exploration activity to gain your level as proficiency bonus and a circumstance bonus." },
  { name: "Hustle", pace: "Faster Travel", detail: "Push the party to travel faster for a limited time, useful when speed matters more than caution." },
  { name: "Investigate", pace: "Normal Pace", detail: "Study your surroundings and connect clues, often setting up Recall Knowledge when the GM provides something to analyze." },
  { name: "Repeat a Spell", pace: "Half Speed", detail: "Cast or sustain the same spell over and over while moving, usually to keep a useful cantrip or effect ready." },
  { name: "Scout", pace: "Half Speed", detail: "Watch ahead and behind the group for danger; at the start of the next encounter, the party gets a +1 circumstance bonus to initiative." },
  { name: "Search", pace: "Half Speed", detail: "Travel while actively looking for hidden doors, hazards, clues, or concealed objects." },
] as const;

export function Pf2eActionMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState<"basic" | "exploration" | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const portalRoot = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuOpen) {
        return;
      }

      if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  }, [menuOpen]);

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          ref={buttonRef}
          className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100"
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          Reference
        </button>

        {menuOpen ? (
          <div
            className="fixed z-[160] w-64 rounded-3xl border border-stone-300 bg-white p-3 shadow-[0_20px_60px_rgba(35,25,12,0.2)]"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            <div className="grid gap-2">
              <button
                className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => {
                  setReferenceOpen("basic");
                  setMenuOpen(false);
                }}
                type="button"
              >
                Basic Actions
              </button>
              <button
                className="rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => {
                  setReferenceOpen("exploration");
                  setMenuOpen(false);
                }}
                type="button"
              >
                Exploration Activities
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {portalRoot && referenceOpen
        ? createPortal(
            <ActionReferenceModal
              mode={referenceOpen}
              onClose={() => setReferenceOpen(null)}
            />,
            portalRoot,
          )
        : null}
    </>
  );
}

function ActionReferenceModal({
  mode,
  onClose,
}: {
  mode: "basic" | "exploration";
  onClose: () => void;
}) {
  const entries = mode === "basic" ? BASIC_ACTION_REFERENCE : EXPLORATION_ACTIVITY_REFERENCE;
  const eyebrow = mode === "basic" ? "Basic Actions" : "Exploration Activities";
  const title = mode === "basic" ? "PF2e Basic Actions" : "PF2e Exploration Activities";
  const description = mode === "basic"
    ? "Official table reminders for the core actions every creature can use."
    : "Common exploration activities to track what the party is doing between encounters.";
  const badgeLabel = mode === "basic" ? "Cost" : "Pace";

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[400] grid place-items-center bg-stone-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-stone-300 bg-stone-50 p-6 shadow-[0_30px_100px_rgba(23,15,5,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h2>
            <p className="mt-2 text-sm text-stone-600">{description}</p>
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
          {entries.map((action) => (
            <div
              key={action.name}
              className="rounded-3xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-900">{action.name}</h3>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                  {"cost" in action ? action.cost : action.pace}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                {badgeLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-700">{action.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
