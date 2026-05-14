"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
import {
  createInitialSubsystemRunnerState,
  getSubsystemDefinition,
  PF2E_SUBSYSTEMS,
  type SubsystemCollectionDefinition,
  type SubsystemFieldDefinition,
  type SubsystemId,
  type SubsystemRow,
  type SubsystemRunnerState,
  type SubsystemWorkspace,
} from "@/lib/pf2e-subsystems";

const STORAGE_KEY = "corona-eclipsa-subsystem-runner";

export function SubsystemPanel() {
  const [runnerState, setRunnerState] = useState<SubsystemRunnerState>(() => createInitialSubsystemRunnerState());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      hasLoadedRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SubsystemRunnerState;
      const next = mergeWithInitialState(parsed);
      setRunnerState(next);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runnerState));
  }, [runnerState]);

  const activeDefinition = useMemo(
    () => getSubsystemDefinition(runnerState.selectedSubsystemId),
    [runnerState.selectedSubsystemId],
  );
  const activeWorkspace = runnerState.workspaces[activeDefinition.id];

  function updateWorkspace(mutator: (workspace: SubsystemWorkspace) => SubsystemWorkspace) {
    setRunnerState((current) => ({
      ...current,
      workspaces: {
        ...current.workspaces,
        [activeDefinition.id]: mutator(current.workspaces[activeDefinition.id]),
      },
    }));
  }

  function setSubsystem(subsystemId: SubsystemId) {
    setRunnerState((current) => ({
      ...current,
      selectedSubsystemId: subsystemId,
    }));
  }

  function setWorkspaceValue<K extends keyof SubsystemWorkspace>(key: K, value: SubsystemWorkspace[K]) {
    updateWorkspace((workspace) => ({
      ...workspace,
      [key]: value,
    }));
  }

  function adjustWorkspaceRound(delta: number) {
    updateWorkspace((workspace) => ({
      ...workspace,
      round: Math.max(1, workspace.round + delta),
    }));
  }

  function adjustMetric(metricKey: string, delta: number) {
    updateWorkspace((workspace) => ({
      ...workspace,
      metrics: {
        ...workspace.metrics,
        [metricKey]: Math.max(0, (workspace.metrics[metricKey] ?? 0) + delta),
      },
    }));
  }

  function setMetric(metricKey: string, value: number) {
    updateWorkspace((workspace) => ({
      ...workspace,
      metrics: {
        ...workspace.metrics,
        [metricKey]: Math.max(0, value || 0),
      },
    }));
  }

  function addCollectionRow(collection: SubsystemCollectionDefinition) {
    updateWorkspace((workspace) => ({
      ...workspace,
      collections: {
        ...workspace.collections,
        [collection.key]: [
          ...(workspace.collections[collection.key] ?? []),
          {
            ...collection.template,
            id: createRowId(),
          },
        ],
      },
    }));
  }

  function updateCollectionRow(
    collectionKey: string,
    rowId: string,
    field: keyof SubsystemRow,
    value: string | number,
  ) {
    updateWorkspace((workspace) => ({
      ...workspace,
      collections: {
        ...workspace.collections,
        [collectionKey]: (workspace.collections[collectionKey] ?? []).map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          return {
            ...row,
            [field]: value,
          };
        }),
      },
    }));
  }

  function removeCollectionRow(collectionKey: string, rowId: string) {
    updateWorkspace((workspace) => ({
      ...workspace,
      collections: {
        ...workspace.collections,
        [collectionKey]: (workspace.collections[collectionKey] ?? []).filter((row) => row.id !== rowId),
      },
    }));
  }

  function resetActiveSubsystem() {
    const fresh = createInitialSubsystemRunnerState();
    setRunnerState((current) => ({
      ...current,
      workspaces: {
        ...current.workspaces,
        [activeDefinition.id]: fresh.workspaces[activeDefinition.id],
      },
    }));
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Pathfinder 2e GM Core
            </p>
            <h2 className="mt-1 text-3xl font-semibold text-stone-900">Subsystem Runner</h2>
            <p className="mt-2 max-w-3xl text-sm text-stone-600">
              Pick a subsystem, track the moving parts, and keep the core procedures visible while you run the scene.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              onClick={resetActiveSubsystem}
              type="button"
            >
              Reset This Subsystem
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_180px_180px]">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Subsystem
                </span>
                <select
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setSubsystem(event.target.value as SubsystemId)}
                  value={activeDefinition.id}
                >
                  {PF2E_SUBSYSTEMS.map((subsystem) => (
                    <option key={subsystem.id} value={subsystem.id}>
                      {subsystem.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Phase
                </span>
                <select
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setWorkspaceValue("phase", event.target.value)}
                  value={activeWorkspace.phase}
                >
                  {activeDefinition.phases.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Round / Interval
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2">
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition hover:bg-stone-100"
                    onClick={() => adjustWorkspaceRound(-1)}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    className="w-full bg-transparent text-center text-sm font-semibold text-stone-900 outline-none"
                    min={1}
                    onChange={(event) => setWorkspaceValue("round", Math.max(1, Number(event.target.value) || 1))}
                    type="number"
                    value={activeWorkspace.round}
                  />
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition hover:bg-stone-100"
                    onClick={() => adjustWorkspaceRound(1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Scene Title
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setWorkspaceValue("title", event.target.value)}
                  placeholder={activeDefinition.label}
                  type="text"
                  value={activeWorkspace.title}
                />
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  {activeDefinition.eyebrow}
                </p>
                <p className="mt-2 text-sm text-stone-700">{activeDefinition.description}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Core Trackers</p>
                    <h3 className="mt-1 text-xl font-semibold text-stone-900">{activeDefinition.label}</h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {activeDefinition.metrics.map((metric) => {
                    const value = activeWorkspace.metrics[metric.key] ?? 0;
                    const step = metric.step ?? 1;

                    return (
                      <div
                        key={metric.key}
                        className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-sm text-stone-600">{metric.description}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition hover:bg-stone-100"
                            onClick={() => adjustMetric(metric.key, -step)}
                            type="button"
                          >
                            -
                          </button>
                          <input
                            className="w-full rounded-full border border-stone-300 bg-white px-3 py-2 text-center text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-600"
                            min={0}
                            onChange={(event) => setMetric(metric.key, Number(event.target.value) || 0)}
                            type="number"
                            value={value}
                          />
                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition hover:bg-stone-100"
                            onClick={() => adjustMetric(metric.key, step)}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {activeDefinition.collections.map((collection) => (
                <section
                  key={collection.key}
                  className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{collection.label}</p>
                      <p className="mt-2 max-w-3xl text-sm text-stone-600">{collection.description}</p>
                    </div>

                    <button
                      className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700"
                      onClick={() => addCollectionRow(collection)}
                      type="button"
                    >
                      {collection.addLabel}
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {(activeWorkspace.collections[collection.key] ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-500">
                        {collection.emptyLabel}
                      </div>
                    ) : (
                      (activeWorkspace.collections[collection.key] ?? []).map((row) => (
                        <CollectionRowEditor
                          collection={collection}
                          key={row.id}
                          onChange={(field, value) => updateCollectionRow(collection.key, row.id, field, value)}
                          onRemove={() => removeCollectionRow(collection.key, row.id)}
                          row={row}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Run Loop</p>
                <ol className="mt-4 space-y-3">
                  {activeDefinition.runLoop.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-stone-50">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-sm text-stone-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Rules Reference</p>
                    <h3 className="mt-1 text-xl font-semibold text-stone-900">{activeDefinition.label}</h3>
                  </div>
                  <Link
                    className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    href={activeDefinition.sourceHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open AoN
                  </Link>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-stone-700">
                  {activeDefinition.rules.map((rule) => (
                    <li key={rule} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                      {rule}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">GM Notes</p>
                  <textarea
                    className="mt-3 h-44 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                    onChange={(event) => setWorkspaceValue("gmNotes", event.target.value)}
                    placeholder="Custom rulings, improvised complications, threshold effects..."
                    value={activeWorkspace.gmNotes}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Table Notes</p>
                <textarea
                  className="mt-3 h-48 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setWorkspaceValue("notes", event.target.value)}
                  placeholder="Live scene notes, outcomes, discovered hooks, consequences..."
                  value={activeWorkspace.notes}
                />

                {activeDefinition.tips.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                      GM Tips
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-stone-700">
                      {activeDefinition.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type CollectionRowEditorProps = {
  collection: SubsystemCollectionDefinition;
  onChange: (field: keyof SubsystemRow, value: string | number) => void;
  onRemove: () => void;
  row: SubsystemRow;
};

function CollectionRowEditor({
  collection,
  onChange,
  onRemove,
  row,
}: CollectionRowEditorProps) {
  const compactFields = collection.fields.filter((field) => field.type !== "textarea");
  const textareaFields = collection.fields.filter((field) => field.type === "textarea");

  return (
    <div className="rounded-[26px] border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-base font-semibold text-stone-900">
          {row.name || "New Entry"}
        </p>
        <button
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
          onClick={onRemove}
          type="button"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {compactFields.map((field) => (
          <label key={field.key} className={field.key === "name" ? "md:col-span-2 xl:col-span-1" : ""}>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              {field.label}
            </span>
            <FieldInput field={field} onChange={onChange} value={row[field.key]} />
          </label>
        ))}
      </div>

      {textareaFields.length > 0 ? (
        <div className="mt-4 space-y-3">
          {textareaFields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                {field.label}
              </span>
              <FieldInput field={field} onChange={onChange} value={row[field.key]} />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type FieldInputProps = {
  field: SubsystemFieldDefinition;
  onChange: (field: keyof SubsystemRow, value: string | number) => void;
  value: SubsystemRow[keyof SubsystemRow];
};

function FieldInput({ field, onChange, value }: FieldInputProps) {
  if (field.type === "textarea") {
    return (
      <textarea
        className="h-24 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => onChange(field.key, event.target.value)}
        placeholder={field.placeholder}
        value={String(value ?? "")}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => onChange(field.key, event.target.value)}
        value={String(value ?? "")}
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "number") {
    return (
      <input
        className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        min={field.min}
        onChange={(event) => onChange(field.key, Number(event.target.value) || 0)}
        type="number"
        value={Number(value ?? 0)}
      />
    );
  }

  return (
    <input
      className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
      onChange={(event) => onChange(field.key, event.target.value)}
      placeholder={field.placeholder}
      type="text"
      value={String(value ?? "")}
    />
  );
}

function mergeWithInitialState(saved: SubsystemRunnerState): SubsystemRunnerState {
  const fresh = createInitialSubsystemRunnerState();

  return {
    selectedSubsystemId: saved.selectedSubsystemId ?? fresh.selectedSubsystemId,
    workspaces: PF2E_SUBSYSTEMS.reduce<SubsystemRunnerState["workspaces"]>((accumulator, definition) => {
      const savedWorkspace = saved.workspaces?.[definition.id];
      const freshWorkspace = fresh.workspaces[definition.id];

      accumulator[definition.id] = {
        ...freshWorkspace,
        ...savedWorkspace,
        metrics: {
          ...freshWorkspace.metrics,
          ...(savedWorkspace?.metrics ?? {}),
        },
        collections: {
          ...freshWorkspace.collections,
          ...(savedWorkspace?.collections ?? {}),
        },
      };

      return accumulator;
    }, {} as SubsystemRunnerState["workspaces"]),
  };
}

function createRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
