import { GameRunnerShell } from "@/components/game-runner-shell";

type GamePageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { matchId } = await params;

  return <GameRunnerShell matchId={matchId} />;
}
