"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { SearchResult } from "@/lib/game-files";
import { getFolderLabel } from "@/lib/folder-labels";

type SearchPopoverProps = {
  currentFile: string;
};

type PopupPosition =
  | {
      mode: "anchored";
    }
  | {
      mode: "cursor";
      x: number;
      y: number;
    };

export function SearchPopover({ currentFile }: SearchPopoverProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({ mode: "anchored" });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setPopupPosition({ mode: "anchored" });
  }, [currentFile]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleLookupEvent(event: Event) {
      const customEvent = event as CustomEvent<{ query?: string; x?: number; y?: number }>;
      const nextQuery = customEvent.detail?.query?.trim() ?? "";
      if (!nextQuery) {
        return;
      }

      if (
        typeof customEvent.detail?.x === "number"
        && typeof customEvent.detail?.y === "number"
      ) {
        setPopupPosition({
          mode: "cursor",
          x: customEvent.detail.x,
          y: customEvent.detail.y,
        });
      } else {
        setPopupPosition({ mode: "anchored" });
      }

      setQuery(nextQuery);
      setIsOpen(true);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("corona-eclipsa-search", handleLookupEvent);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("corona-eclipsa-search", handleLookupEvent);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setResults([]);
          return;
        }

        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
        setIsOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const showPanel = isOpen && query.trim().length > 0;
  const panelStyle =
    popupPosition.mode === "cursor"
      ? {
          left: `clamp(16px, calc(${popupPosition.x}px - 14rem), calc(100vw - 30rem - 16px))`,
          top: `clamp(16px, calc(${popupPosition.y}px + 12px), calc(100vh - 32rem))`,
        }
      : undefined;

  function jumpToResult(result: SearchResult) {
    setIsOpen(false);

    if (result.path !== currentFile || !result.targetId) {
      router.push(result.href, {
        scroll: false,
      });
      return;
    }

    window.history.replaceState(null, "", result.href);

    window.requestAnimationFrame(() => {
      const targetId = result.targetId;
      if (!targetId) {
        return;
      }

      const element = document.getElementById(targetId);
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
    <div className="relative" ref={rootRef}>
      <label className="sr-only" htmlFor="doc-search">
        Search documents
      </label>
      <input
        className="w-72 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-amber-500"
        id="doc-search"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          setPopupPosition({ mode: "anchored" });
          if (query.trim()) {
            setIsOpen(true);
          }
        }}
        placeholder="Search the campaign..."
        type="search"
        value={query}
      />

      {showPanel ? (
        <div
          className={`z-20 w-[30rem] overflow-hidden rounded-[24px] border border-stone-300 bg-white/98 shadow-[0_28px_60px_rgba(31,26,23,0.22)] backdrop-blur ${
            popupPosition.mode === "cursor" ? "fixed" : "absolute right-0 mt-3"
          }`}
          style={panelStyle}
        >
          <div className="border-b border-stone-200 px-4 py-3 text-xs uppercase tracking-[0.18em] text-stone-500">
            {isLoading ? "Searching..." : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-2">
            {results.length > 0 ? (
              <ul className="space-y-2">
                {results.map((result) => (
                  <li key={`${result.path}:${result.sectionTitle ?? result.title}`} className="w-full">
                    <button
                      className="block w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition hover:border-amber-400/70 hover:bg-amber-50/50"
                      onClick={() => jumpToResult(result)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            {result.title}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-amber-800/70">
                            {getFolderLabel(result.folder)}
                            {result.sectionTitle ? ` / ${result.sectionTitle}` : ""}
                          </p>
                        </div>
                      </div>
                      {result.preview ? (
                        <p className="mt-2 text-sm leading-6 text-stone-700">{result.preview}</p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-6 text-sm text-stone-500">No matching notes found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
