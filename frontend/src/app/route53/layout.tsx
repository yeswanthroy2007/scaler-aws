"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";

export default function Route53Layout({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--color-page-bg)]">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={28} aria-label="Loading" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
