"use client";

import dynamic from "next/dynamic";

export const EncounterPanelShell = dynamic(
  () => import("@/components/encounter-panel").then((module) => module.EncounterPanel),
  {
    ssr: false,
  },
);
