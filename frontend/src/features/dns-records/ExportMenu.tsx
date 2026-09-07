"use client";

import { useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { triggerExportDownload } from "@/services/api/exports";
import { useToast } from "@/components/feedback/ToastProvider";

export function ExportMenu({ zoneId }: { zoneId: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  useOnClickOutside(ref, () => setOpen(false));

  function handleExport(format: "json" | "bind") {
    setOpen(false);
    triggerExportDownload(zoneId, format);
    toast.info(`Exporting as ${format.toUpperCase()}`, "Your download should start shortly.");
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <Download size={14} /> Export <ChevronDown size={13} />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-44 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <button
            role="menuitem"
            onClick={() => handleExport("json")}
            className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
          >
            Export as JSON
          </button>
          <button
            role="menuitem"
            onClick={() => handleExport("bind")}
            className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
          >
            Export as BIND zone file
          </button>
        </div>
      )}
    </div>
  );
}
