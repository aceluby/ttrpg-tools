"use client";

import { useEffect, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
import { EditorPane } from "@/components/editor-pane";
import { MarkdownViewer } from "@/components/markdown-viewer";

type DocumentPanelProps = {
  filePath: string;
  title: string;
  markdown: string;
};

export function DocumentPanel({
  filePath,
  title,
  markdown,
}: DocumentPanelProps) {
  const [tab, setTab] = useState<"view" | "edit">("view");

  useEffect(() => {
    if (tab !== "view") {
      return;
    }

    let attempts = 0;

    function scrollToHash() {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        return;
      }

      const element = document.getElementById(hash);
      const container = document.querySelector<HTMLElement>("[data-doc-scroll-container]");
      if (element) {
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
        return;
      }

      if (attempts < 8) {
        attempts += 1;
        window.setTimeout(scrollToHash, 50);
      }
    }

    scrollToHash();
  }, [filePath, markdown, tab]);

  useEffect(() => {
    if (tab !== "view") {
      return;
    }

    const scrollContainer = document.querySelector<HTMLElement>("[data-doc-scroll-container]");
    if (!scrollContainer) {
      return;
    }
    const container = scrollContainer;

    let frame = 0;

    function broadcastActiveHeading(id: string) {
      window.dispatchEvent(
        new CustomEvent("corona-eclipsa-active-heading", {
          detail: {
            filePath,
            id,
          },
        }),
      );
    }

    function updateActiveHeading() {
      frame = 0;

      const headings = Array.from(
        container.querySelectorAll<HTMLElement>("[id].scroll-mt-24"),
      );

      if (headings.length === 0) {
        broadcastActiveHeading("");
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + 120;
      let activeId = headings[0]?.id ?? "";

      for (const heading of headings) {
        if (!heading.id) {
          continue;
        }

        const headingTop = heading.getBoundingClientRect().top;
        if (headingTop <= threshold) {
          activeId = heading.id;
        } else {
          break;
        }
      }

      broadcastActiveHeading(activeId);
    }

    function queueUpdate() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateActiveHeading);
    }

    queueUpdate();
    container.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("hashchange", queueUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      container.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("hashchange", queueUpdate);
    };
  }, [filePath, markdown, tab]);

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-stone-50/92">
      <AppPanelHeader
        currentFile={filePath}
        eyebrow=""
        title={null}
      />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {tab === "view" ? "Viewing Document" : "Editing Document"}
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold text-stone-900">
              {title}
            </h2>
          </div>

          <div className="inline-flex rounded-full border border-stone-300 bg-white p-1 shadow-sm">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === "view"
                  ? "bg-stone-900 text-stone-50"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
              onClick={() => setTab("view")}
              type="button"
            >
              View
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === "edit"
                  ? "bg-stone-900 text-stone-50"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
              onClick={() => setTab("edit")}
              type="button"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8" data-doc-scroll-container>
        {tab === "view" ? (
          <div className="mx-auto max-w-7xl rounded-[28px] border border-stone-300/80 bg-white/90 px-10 py-10 shadow-[0_24px_80px_rgba(52,38,18,0.14)]">
            <MarkdownViewer currentFile={filePath} markdown={markdown} />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            <EditorPane
              compact
              filePath={filePath}
              initialMarkdown={markdown}
            />
          </div>
        )}
      </div>
    </section>
  );
}
