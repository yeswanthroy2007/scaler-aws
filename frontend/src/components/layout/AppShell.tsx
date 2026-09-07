"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { GlobalShortcuts } from "@/features/shortcuts/GlobalShortcuts";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <Header onToggleSidebar={() => setCollapsed((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />
        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto bg-[var(--color-page-bg)]">
          {children}
        </main>
      </div>
      <GlobalShortcuts />
    </div>
  );
}
