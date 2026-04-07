"use client";

import { useState, useTransition } from "react";

type EditorPaneProps = {
  compact?: boolean;
  filePath: string;
  initialMarkdown: string;
};

export function EditorPane({
  compact = false,
  filePath,
  initialMarkdown,
}: EditorPaneProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  async function save() {
    setStatus("idle");

    startTransition(async () => {
      const response = await fetch("/api/files", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: filePath,
          markdown,
        }),
      });

      if (response.ok) {
        setStatus("saved");
        return;
      }

      setStatus("error");
    });
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-stone-300 bg-stone-100 shadow-[0_24px_80px_rgba(52,38,18,0.14)] ${
        compact ? "h-[calc(100vh-160px)]" : "h-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-stone-300 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Editor
          </p>
          <p className="text-sm text-stone-700">{filePath}</p>
        </div>
        <button
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isPending}
          onClick={save}
          type="button"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      <textarea
        className="min-h-0 flex-1 resize-none bg-stone-50 p-4 font-mono text-sm leading-6 text-stone-900 outline-none"
        onChange={(event) => setMarkdown(event.target.value)}
        spellCheck={false}
        value={markdown}
      />

      <div className="border-t border-stone-300 px-4 py-2 text-sm text-stone-600">
        {status === "saved" && "Saved to disk."}
        {status === "error" && "Save failed."}
        {status === "idle" && "Edit markdown directly and save when ready."}
      </div>
    </section>
  );
}
