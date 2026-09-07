"use client";

import { Modal } from "@/components/modals/Modal";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "/", description: "Focus the search box on the current page" },
  { keys: "n", description: "Create a new hosted zone or DNS record (context-aware)" },
  { keys: "Esc", description: "Close the open modal or dialog" },
  { keys: "g then h", description: "Go to Hosted zones" },
  { keys: "g then o", description: "Go to Route 53 overview" },
];

export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <ul className="flex flex-col gap-2.5">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[var(--color-text-secondary)]">{shortcut.description}</span>
            <kbd className="shrink-0 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)] px-2 py-0.5 font-mono text-xs">
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
