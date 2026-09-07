"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Globe2 } from "lucide-react";
import { ROUTE53_NAV } from "@/constants/navigation";
import { cn } from "@/utils/cn";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <nav
      aria-label="Route 53 navigation"
      className={cn(
        "flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] transition-[width] duration-150",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-3 text-left hover:bg-[var(--color-sidebar-hover)]"
        aria-expanded={expanded}
      >
        <Globe2 size={18} className="shrink-0 text-[var(--color-text-secondary)]" />
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-bold text-[var(--color-text)]">Route 53</span>
            {expanded ? (
              <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            )}
          </>
        )}
      </button>

      {expanded && (
        <ul className="flex flex-col gap-0.5 overflow-y-auto py-2">
          {ROUTE53_NAV.map((item) => {
            const isActive =
              item.href === "/route53" ? pathname === "/route53" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mx-2 flex items-center gap-2.5 rounded px-2.5 py-2 text-sm font-medium",
                    isActive
                      ? "bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-sidebar-hover)]"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.comingSoon && (
                    <span className="shrink-0 rounded-full bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                      Soon
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
