"use client";

type PdfModalProps = {
  onClose: () => void;
  pdfPath: string;
  pdfUrl?: string;
  title: string;
};

export function PdfModal({ onClose, pdfPath, pdfUrl, title }: PdfModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-line bg-panel-strong shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Army Reference
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Local PDF quick view loaded from this app.
            </p>
            {pdfUrl ? (
              <a
                className="mt-2 inline-block text-xs uppercase tracking-[0.22em] text-accent transition hover:text-accent-strong"
                href={pdfUrl}
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

        <div className="min-h-0 flex-1 bg-black/20 p-3">
          <iframe
            className="h-full min-h-[70vh] w-full rounded-2xl border border-line bg-white"
            src={pdfPath}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
