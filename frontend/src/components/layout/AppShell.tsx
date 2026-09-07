"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { GlobalShortcuts } from "@/features/shortcuts/GlobalShortcuts";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleNav() {
    // One toggle serves both layouts: it only ever affects whichever
    // behavior is active for the current viewport width (see Sidebar.tsx).
    setCollapsed((v) => !v);
    setMobileOpen((v) => !v);
  }

  return (
    <div className="flex h-dvh flex-col">
      <Header onToggleSidebar={toggleNav} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto bg-[var(--color-page-bg)]">
          {children}
        </main>
      </div>
      <GlobalShortcuts />
    </div>
  );
}
