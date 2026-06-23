import bleakHost from "@/lib/spearhead-data/armies/bleak-host.json";
import bloodcraveHunt from "@/lib/spearhead-data/armies/bloodcrave-hunt.json";
import gnawfeastClawpack from "@/lib/spearhead-data/armies/gnawfeast-clawpack.json";
import vigilantBrotherhood from "@/lib/spearhead-data/armies/vigilant-brotherhood.json";
import wallsmasherStomp from "@/lib/spearhead-data/armies/wallsmasher-stomp.json";
import type { ArmySummary } from "@/lib/spearhead-data/types";

const armySummaries = [
  vigilantBrotherhood,
  gnawfeastClawpack,
  bleakHost,
  bloodcraveHunt,
  wallsmasherStomp,
] as ArmySummary[];

const armySummariesById = new Map(armySummaries.map((army) => [army.id, army]));

export function getArmyById(armyId: string) {
  return armySummariesById.get(armyId) ?? null;
}

export function getArmySummaryById(armyId: string) {
  return armySummariesById.get(armyId) ?? null;
}

export function listArmies() {
  return armySummaries;
}
