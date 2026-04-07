"use client";

import { type ReactNode } from "react";

import { SearchPopover } from "@/components/search-popover";
import { SpotifyHeaderControls } from "@/components/spotify-header-controls";

type AppPanelHeaderProps = {
  children?: ReactNode;
  currentFile?: string;
  description?: string;
  eyebrow?: string;
  title?: ReactNode;
};

export function AppPanelHeader({
  children,
  currentFile = "",
  description,
  eyebrow,
  title,
}: AppPanelHeaderProps) {
  return (
    <div className="shrink-0 border-b border-stone-300 bg-stone-100/90 px-6 py-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {eyebrow || title || description ? (
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <div className={`${eyebrow ? "mt-2" : ""} min-w-0`}>
                {title}
              </div>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm text-stone-600">
                {description}
              </p>
            ) : null}
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <SearchPopover currentFile={currentFile} />
            <SpotifyHeaderControls />
          </div>
          {children ? (
            <div className="flex flex-wrap items-center gap-3">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
