import type { ArmySummary } from "@/lib/spearhead-data/types";

type MatchSummaryCardProps = {
  army: ArmySummary | null;
  emptyLabel: string;
  title: string;
};

export function MatchSummaryCard({
  army,
  emptyLabel,
  title,
}: MatchSummaryCardProps) {
  return (
    <section className="rounded-[32px] border border-line bg-panel p-6 shadow-xl shadow-black/20">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
        {title}
      </p>

      {!army ? (
        <p className="mt-4 text-sm leading-7 text-muted">{emptyLabel}</p>
      ) : (
        <>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            {army.name}
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.24em] text-muted">
            {army.faction}
          </p>
          <p className="mt-4 text-sm leading-7 text-muted">{army.summary}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {army.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.22em] text-accent">
            {army.dataStatus}
          </p>
        </>
      )}
    </section>
  );
}
