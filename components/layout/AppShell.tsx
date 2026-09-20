"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-col">
        <div
          className="sticky top-0 z-[60] flex items-center gap-3 border-b border-line bg-background px-4 py-3 lg:hidden"
        >
          <button
            type="button"
            className="min-h-12 min-w-12 rounded-md border border-line bg-surface px-3 text-body-small font-bold shadow-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? "Close" : "Menu"}
          </button>
          <p className="text-body-small font-bold text-green-dark">Växa Production</p>
        </div>

        <div
          className="mx-auto w-full max-w-[1480px] px-[var(--main-pad-x)] pt-[var(--main-pad-top)] pb-10 max-lg:px-4 max-lg:pt-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
