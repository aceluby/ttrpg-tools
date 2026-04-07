import { DocumentPanel } from "@/components/document-panel";
import { EncounterPanelShell } from "@/components/encounter-panel-shell";
import { MusicPanel } from "@/components/music-panel";
import { SidebarNav } from "@/components/sidebar-nav";
import { listGameDocs, readGameDoc } from "@/lib/game-files";

type HomePageProps = {
  searchParams: Promise<{
    file?: string;
    mode?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const docs = await listGameDocs();
  const params = await searchParams;
  const mode = params.mode === "encounter"
    ? "encounter"
    : params.mode === "music"
      ? "music"
      : "docs";
  const selectedPath = params.file ?? docs[0]?.path ?? "GAME.md";
  const selectedDoc = mode === "docs"
    ? await readGameDoc(selectedPath)
    : null;

  return (
    <main className="grid h-screen overflow-hidden grid-cols-[280px_minmax(0,1fr)] bg-[radial-gradient(circle_at_top,_rgba(255,245,214,0.75),_transparent_36%),linear-gradient(135deg,#eadfcb_0%,#d5c6ad_42%,#aea183_100%)] text-stone-950">
      <aside className="flex min-h-0 flex-col border-r border-stone-400/60 bg-stone-950/95 px-4 py-5 text-stone-100">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50">
            Corona Eclipsa
          </h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <SidebarNav
            docs={docs}
            selectedMode={mode}
            selectedPath={selectedDoc?.path ?? selectedPath}
          />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {mode === "encounter" ? (
            <EncounterPanelShell />
          ) : mode === "music" ? (
            <MusicPanel />
          ) : selectedDoc ? (
            <DocumentPanel
              filePath={selectedDoc.path}
              key={selectedDoc.path}
              markdown={selectedDoc.markdown}
              title={selectedDoc.title}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
