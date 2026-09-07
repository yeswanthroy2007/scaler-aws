"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, HelpCircle, ChevronDown, Moon, Sun, LogOut, Keyboard, User as UserIcon } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "@/features/theme/ThemeProvider";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { KeyboardShortcutsHelp } from "@/features/shortcuts/KeyboardShortcutsHelp";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(accountRef, () => setAccountOpen(false));
  useOnClickOutside(helpRef, () => setHelpOpen(false));

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-[var(--color-header-bg)] px-2 text-white">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        className="rounded p-2 hover:bg-[var(--color-header-hover)]"
      >
        <Menu size={18} />
      </button>

      <Link href="/route53" className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-[var(--color-header-hover)]">
        <span className="grid h-6 w-6 place-items-center rounded bg-[#ff9900] text-xs font-bold text-black">R53</span>
        <span className="hidden text-sm font-semibold sm:inline">Route 53 Console</span>
      </Link>

      <div className="mx-2 hidden min-w-0 flex-1 items-center rounded border border-[var(--color-header-hover)] bg-[#1b2532] px-2 py-1 focus-within:ring-2 focus-within:ring-white/40 md:flex">
        <Search size={14} className="mr-2 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search"
          placeholder="Search for services, features, hosted zones..."
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <span className="mr-1 hidden rounded border border-[var(--color-header-hover)] px-2 py-1 text-xs text-slate-300 lg:inline">
          N. Virginia (us-east-1)
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded p-2 hover:bg-[var(--color-header-hover)]"
          title="Toggle color theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative" ref={helpRef}>
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={helpOpen}
            aria-label="Help"
            className="rounded p-2 hover:bg-[var(--color-header-hover)]"
          >
            <HelpCircle size={17} />
          </button>
          {helpOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-56 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-[var(--color-text)] shadow-lg"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setShortcutsOpen(true);
                  setHelpOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
              >
                <Keyboard size={15} /> Keyboard shortcuts
              </button>
              <a
                href="https://docs.aws.amazon.com/route53/"
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
              >
                Documentation
              </a>
            </div>
          )}
        </div>

        <button type="button" aria-label="Notifications" className="rounded p-2 hover:bg-[var(--color-header-hover)]">
          <Bell size={17} />
        </button>

        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            className="flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-[var(--color-header-hover)]"
          >
            <UserIcon size={16} />
            <span className="hidden text-sm sm:inline">{user?.name ?? "Account"}</span>
            <ChevronDown size={14} />
          </button>
          {accountOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-64 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-[var(--color-text)] shadow-lg"
            >
              <div className="border-b border-[var(--color-border)] px-3 py-2">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{user?.email}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Account ID: {user?.account_id}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </header>
  );
}
