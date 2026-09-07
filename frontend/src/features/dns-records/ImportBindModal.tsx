"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { Badge } from "@/components/ui/Badge";
import { importsApi } from "@/services/api/imports";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import type { BindImportPreviewResponse, BindImportSummary } from "@/types/bindImport";

type Step = "upload" | "preview" | "summary";

export function ImportBindModal({
  open,
  onClose,
  zoneId,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  zoneId: number;
  onImported: () => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<BindImportPreviewResponse | null>(null);
  const [summary, setSummary] = useState<BindImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("upload");
    setPreview(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelected(file: File) {
    setError(null);
    setBusy(true);
    try {
      const result = await importsApi.preview(zoneId, file);
      setPreview(result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to parse the uploaded file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const result = await importsApi.confirm(zoneId, preview.import_token);
      setSummary(result);
      setStep("summary");
      onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to import records.");
    } finally {
      setBusy(false);
    }
  }

  function handleDone() {
    toast.success("Import complete", summary ? `${summary.created} record(s) created.` : undefined);
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import BIND zone file"
      description="Upload a standard BIND zone file to bulk-create DNS records."
      size="lg"
      footer={
        step === "upload" ? (
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        ) : step === "preview" ? (
          <>
            <Button variant="secondary" onClick={reset} disabled={busy}>
              Back
            </Button>
            <Button variant="primary" onClick={handleConfirm} loading={busy} disabled={!preview || preview.valid_count === 0}>
              Import {preview?.valid_count ?? 0} record(s)
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={handleDone}>
            Done
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {step === "upload" && (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-[var(--color-border-strong)] px-6 py-14 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelected(file);
          }}
        >
          <Upload size={28} className="text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Drag and drop a zone file, or</p>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} loading={busy}>
            Browse files
          </Button>
          <p className="text-xs text-[var(--color-text-muted)]">.txt, .zone, .bind, or .db files, up to 1 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.zone,.bind,.db"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />
        </div>
      )}

      {step === "preview" && preview && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-[var(--color-success)]">
              <CheckCircle2 size={15} /> {preview.valid_count} valid
            </span>
            <span className="flex items-center gap-1.5 text-[var(--color-danger)]">
              <XCircle size={15} /> {preview.invalid_count} invalid
            </span>
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <FileText size={15} /> {preview.total_lines_parsed} lines parsed
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                  <th>Line</th>
                  <th>Record</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {preview.preview.map((item) => (
                  <tr key={item.line_number}>
                    <td className="px-3 py-1.5 text-[var(--color-text-muted)]">{item.line_number}</td>
                    <td className="px-3 py-1.5 font-mono">{item.raw_line.trim()}</td>
                    <td className="px-3 py-1.5">
                      {item.record ? (
                        <Badge variant="green">{item.record.type}</Badge>
                      ) : (
                        <span className="text-[var(--color-danger)]" title={item.error ?? undefined}>
                          {item.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "summary" && summary && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3">
              <p className="text-2xl font-semibold text-[var(--color-success)]">{summary.created}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Created</p>
            </div>
            <div className="rounded border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3">
              <p className="text-2xl font-semibold text-[var(--color-warning)]">{summary.skipped}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Skipped (duplicates)</p>
            </div>
            <div className="rounded border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3">
              <p className="text-2xl font-semibold text-[var(--color-danger)]">{summary.failed}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Failed</p>
            </div>
          </div>
          {summary.failures.length > 0 && (
            <div className="rounded border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-secondary)]">
              <p className="mb-1 font-semibold text-[var(--color-text)]">Failure details</p>
              <ul className="list-inside list-disc">
                {summary.failures.map((failure, i) => (
                  <li key={i}>{failure}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
