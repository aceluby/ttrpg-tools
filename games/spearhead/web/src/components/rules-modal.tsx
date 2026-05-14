"use client";

import type { RuleContent } from "@/lib/rules/setup-rules";

type RulesModalProps = {
  content: RuleContent | null;
  onClose: () => void;
};

export function RulesModal({ content, onClose }: RulesModalProps) {
  if (!content) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-line bg-panel-strong p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Rules Popup
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              {content.title}
            </h2>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
              {content.sourceLabel}
            </p>
            {content.sourceUrl ? (
              <a
                className="mt-2 inline-block text-xs uppercase tracking-[0.22em] text-accent transition hover:text-accent-strong"
                href={content.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open official source
              </a>
            ) : null}
          </div>

          <button
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-accent hover:text-accent-strong"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
          {content.bullets.map((bullet) => (
            <li
              className="rounded-2xl border border-line bg-black/10 px-4 py-3"
              key={bullet}
            >
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
