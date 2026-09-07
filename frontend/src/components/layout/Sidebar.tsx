"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Globe2 } from "lucide-react";
import { ROUTE53_NAV } from "@/constants/navigation";
import { cn } from "@/utils/cn";

interface SidebarProps {
  /** Desktop-only: icon-rail vs full-width. Has no effect below the `md` breakpoint. */
  collapsed: boolean;
  /** Mobile-only: whether the off-canvas drawer is open. Has no effect at `md` and above. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      {/* Backdrop: only ever rendered/visible below `md`, dismisses the drawer. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={onCloseMobile}
        />
      )}

      <nav
        aria-label="Route 53 navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] transition-transform duration-200",
          "md:static md:z-auto md:translate-x-0 md:transition-[width] md:duration-150",
          mobileOpen && "translate-x-0",
          collapsed ? "md:w-14" : "md:w-60"
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-3 text-left hover:bg-[var(--color-sidebar-hover)]"
          aria-expanded={expanded}
        >
          <Globe2 size={18} className="shrink-0 text-[var(--color-text-secondary)]" />
          <span className={cn("flex-1 text-sm font-bold text-[var(--color-text)]", collapsed && "md:hidden")}>
            Route 53
          </span>
          <span className={cn(collapsed && "md:hidden")}>
            {expanded ? (
              <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            )}
          </span>
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
                    onClick={onCloseMobile}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "mx-2 flex items-center gap-2.5 rounded px-2.5 py-2 text-sm font-medium",
                      isActive
                        ? "bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-sidebar-hover)]"
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className={cn("flex-1 truncate", collapsed && "md:hidden")}>{item.label}</span>
                    {item.comingSoon && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]",
                          collapsed && "md:hidden"
                        )}
                      >
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
    </>
  );
}
