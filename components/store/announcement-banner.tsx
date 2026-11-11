"use client";

import * as React from "react";
import { Megaphone, X } from "lucide-react";

export interface AnnouncementBannerProps {
  announcement?: string | null;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  const cleanText = announcement?.trim();
  if (!cleanText || dismissed) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="E'lon"
      className="relative z-50 bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-medium border-b border-primary/20 shadow-xs"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0">
          <Megaphone
            className="h-4 w-4 shrink-0 text-primary-foreground/90"
            aria-hidden="true"
          />
          <p className="leading-snug break-words font-medium">
            {cleanText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-foreground transition-colors"
          aria-label="E'lonni yopish"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
