"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { type DocHeading, type GameDoc } from "@/lib/game-files";
import { getFolderLabel } from "@/lib/folder-labels";

type OutlineSection = {
  id: string;
  text: string;
  children: DocHeading[];
};

type SidebarNavProps = {
  docs: GameDoc[];
  selectedMode: "docs" | "encounter" | "music";
  selectedPath: string;
};

export function SidebarNav({ docs, selectedMode, selectedPath }: SidebarNavProps) {
  const router = useRouter();
  const groupedDocs = useMemo(() => {
    return docs.reduce<Record<string, GameDoc[]>>((groups, doc) => {
      groups[doc.folder] ??= [];
      groups[doc.folder].push(doc);
      return groups;
    }, {});
  }, [docs]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set());
  const [openDocs, setOpenDocs] = useState<Set<string>>(() => new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());
  const [activeHeadingId, setActiveHeadingId] = useState("");

  useEffect(() => {
    if (selectedMode !== "docs") {
      return;
    }

    const selectedDoc = docs.find((doc) => doc.path === selectedPath);
    if (!selectedDoc) {
      return;
    }

    setOpenFolders((current) => {
      const next = new Set(current);
      next.add(selectedDoc.folder);
      return next;
    });

    setOpenDocs((current) => {
      const next = new Set(current);
      next.add(selectedDoc.path);
      return next;
    });
  }, [docs, selectedMode, selectedPath]);

  useEffect(() => {
    function syncFromHash() {
      setActiveHeadingId(window.location.hash.replace(/^#/, ""));
    }

    function handleActiveHeading(event: Event) {
      const customEvent = event as CustomEvent<{ filePath?: string; id?: string }>;
      if (customEvent.detail?.filePath !== selectedPath) {
        return;
      }

      setActiveHeadingId(customEvent.detail?.id ?? "");
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("corona-eclipsa-active-heading", handleActiveHeading);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("corona-eclipsa-active-heading", handleActiveHeading);
    };
  }, [selectedPath]);

  useEffect(() => {
    if (!activeHeadingId) {
      return;
    }

    const selectedDoc = docs.find((doc) => doc.path === selectedPath);
    if (!selectedDoc) {
      return;
    }

    const matchingSection = buildOutlineSections(selectedDoc.headings).find((section) => {
      return (
        section.id === activeHeadingId ||
        section.children.some((child) => child.id === activeHeadingId)
      );
    });

    if (!matchingSection) {
      return;
    }

    setOpenFolders((current) => new Set(current).add(selectedDoc.folder));
    setOpenDocs((current) => new Set(current).add(selectedDoc.path));
    setOpenSections((current) => new Set(current).add(`${selectedDoc.path}:${matchingSection.id}`));
  }, [activeHeadingId, docs, selectedPath]);

  function buildOutlineSections(headings: DocHeading[]): OutlineSection[] {
    const output: OutlineSection[] = [];
    let current: OutlineSection | null = null;

    for (const heading of headings) {
      if (heading.depth <= 2) {
        current = { id: heading.id, text: heading.text, children: [] };
        output.push(current);
        continue;
      }

      if (!current) {
        current = { id: heading.id, text: heading.text, children: [] };
        output.push(current);
        continue;
      }

      current.children.push(heading);
    }

    return output;
  }

  function toggleFolder(folder: string) {
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  }

  function toggleDoc(docPath: string) {
    setOpenDocs((current) => {
      const next = new Set(current);
      if (next.has(docPath)) {
        next.delete(docPath);
      } else {
        next.add(docPath);
      }
      return next;
    });
  }

  function toggleSection(id: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openContainingTree(docPath: string, sectionId?: string) {
    const folder = docs.find((doc) => doc.path === docPath)?.folder;
    if (folder) {
      setOpenFolders((current) => new Set(current).add(folder));
    }

    setOpenDocs((current) => new Set(current).add(docPath));

    if (sectionId) {
      setOpenSections((current) => new Set(current).add(`${docPath}:${sectionId}`));
    }
  }

  function selectDocument(docPath: string) {
    router.push(`/?file=${encodeURIComponent(docPath)}`, {
      scroll: false,
    });
  }

  function selectEncounter() {
    router.push("/?mode=encounter", {
      scroll: false,
    });
  }

  function selectMusic() {
    router.push("/?mode=music", {
      scroll: false,
    });
  }

  function jumpToHeading(docPath: string, id: string) {
    openContainingTree(docPath, id);
    const nextUrl = `/?file=${encodeURIComponent(docPath)}#${id}`;

    if (docPath !== selectedPath) {
      router.push(nextUrl, {
        scroll: false,
      });
      return;
    }

    window.history.replaceState(null, "", nextUrl);

    window.requestAnimationFrame(() => {
      const element = document.getElementById(id);
      const container = document.querySelector<HTMLElement>("[data-doc-scroll-container]");
      if (!element) {
        return;
      }

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const nextTop = container.scrollTop + elementRect.top - containerRect.top - 24;

        container.scrollTo({
          top: nextTop,
          behavior: "smooth",
        });
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <nav className="space-y-4">
      <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-2">
        <div className="space-y-2">
          <button
            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
              selectedMode === "encounter"
                ? "bg-amber-200 text-stone-950"
                : "text-amber-100 hover:bg-amber-400/10"
            }`}
            onClick={selectEncounter}
            type="button"
          >
            <div>
              <span className="block text-sm font-medium">Encounter Runner</span>
            </div>
          </button>

          <button
            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
              selectedMode === "music"
                ? "bg-amber-200 text-stone-950"
                : "text-amber-100 hover:bg-amber-400/10"
            }`}
            onClick={selectMusic}
            type="button"
          >
            <div>
              <span className="block text-sm font-medium">Music Director</span>
            </div>
            <span className="text-lg">♪</span>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-2">
        <div className="px-2 py-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
            Campaign
          </p>
        </div>

        {Object.entries(groupedDocs).map(([folder, folderDocs]) => {
        const isOpen = openFolders.has(folder);
        const folderActive = folderDocs.some((doc) => doc.path === selectedPath);

        return (
          <section
            key={folder}
            className={`rounded-xl border transition ${
              folderActive
                ? "border-amber-300/70 bg-amber-200/12"
                : "border-amber-500/20 bg-stone-950/30"
            }`}
          >
            <button
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                folderActive
                  ? "text-amber-50 hover:bg-amber-300/15"
                  : "text-amber-100 hover:bg-amber-400/10"
              }`}
              onClick={() => toggleFolder(folder)}
              type="button"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-current/80">
                {getFolderLabel(folder)}
              </span>
              <span className="text-sm text-amber-100/80">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen ? (
              <ul className="space-y-1 border-t border-amber-500/20 px-2 py-2">
                {folderDocs.map((doc) => {
                  const selected = doc.path === selectedPath;
                  const docOpen = openDocs.has(doc.path);
                  const outlineSections = buildOutlineSections(doc.headings);

                  return (
                    <li key={doc.path}>
                      <div
                        className={`overflow-hidden rounded-xl border transition ${
                          selected
                            ? "border-amber-300 bg-amber-200 text-stone-950"
                            : "border-transparent bg-transparent hover:bg-amber-400/10"
                        }`}
                      >
                        <div className="flex items-center">
                          <button
                            className={`min-w-0 flex-1 px-3 py-2 text-left text-sm transition ${
                              selected
                                ? "text-stone-950"
                                : "text-amber-100 hover:bg-amber-400/10 hover:text-amber-50"
                            }`}
                            onClick={() => selectDocument(doc.path)}
                            type="button"
                          >
                            <span className="block truncate font-medium">{doc.title}</span>
                          </button>
                          {outlineSections.length > 0 ? (
                            <button
                              className={`mr-2 shrink-0 rounded-full px-2 py-1 text-xs font-semibold transition ${
                                selected
                                  ? "text-stone-700 hover:bg-amber-300"
                                  : "text-amber-100/80 hover:bg-amber-400/10"
                              }`}
                              onClick={() => toggleDoc(doc.path)}
                              type="button"
                            >
                              {docOpen ? "−" : "+"}
                            </button>
                          ) : null}
                        </div>

                        {docOpen && outlineSections.length > 0 ? (
                          <div className={`border-t px-2 py-2 ${selected ? "border-stone-900/10" : "border-amber-500/20"}`}>
                            <ul className="space-y-2">
                              {outlineSections.map((section) => {
                                const sectionKey = `${doc.path}:${section.id}`;
                                const sectionOpen = openSections.has(sectionKey);
                                const sectionActive = activeHeadingId === section.id || section.children.some((child) => child.id === activeHeadingId);

                                return (
                                  <li key={sectionKey}>
                                    <div
                                      className={`rounded-xl border transition ${
                                        sectionActive
                                          ? "border-amber-300 bg-amber-200 text-stone-950"
                                          : selected
                                            ? "border-stone-900/10 bg-white/55"
                                            : "border-amber-500/15 bg-stone-950/20"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 px-2 py-2">
                                        <button
                                          className={`min-w-0 truncate text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                            sectionActive
                                              ? "text-stone-950"
                                              : selected
                                                ? "text-stone-800 hover:text-amber-800"
                                                : "text-amber-100 hover:text-amber-50"
                                          }`}
                                          onClick={() => jumpToHeading(doc.path, section.id)}
                                          type="button"
                                        >
                                          {section.text}
                                        </button>
                                        {section.children.length > 0 ? (
                                          <button
                                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                                              selected
                                                ? "text-stone-600 hover:bg-stone-950/10"
                                                : "text-amber-100/80 hover:bg-amber-400/10"
                                            }`}
                                            onClick={() => toggleSection(sectionKey)}
                                            type="button"
                                          >
                                            {sectionOpen ? "−" : "+"}
                                          </button>
                                        ) : null}
                                      </div>

                                      {sectionOpen && section.children.length > 0 ? (
                                        <ul
                                          className={`space-y-1 border-t px-2 py-2 ${
                                            selected ? "border-stone-900/10" : "border-amber-500/20"
                                          }`}
                                        >
                                          {section.children.map((child) => (
                                            <li key={`${doc.path}:${child.id}`}>
                                              <button
                                                className={`block w-full rounded-lg px-2 py-1 text-left text-sm transition ${
                                                  activeHeadingId === child.id
                                                    ? "bg-amber-200 text-stone-950"
                                                    : selected
                                                      ? "text-stone-700 hover:bg-stone-950/8 hover:text-amber-800"
                                                      : "text-amber-100/85 hover:bg-amber-400/10 hover:text-amber-50"
                                                }`}
                                                onClick={() => jumpToHeading(doc.path, child.id)}
                                                type="button"
                                              >
                                                {child.text}
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : null}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
      </section>
    </nav>
  );
}
