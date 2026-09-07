"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  requireTypedConfirmation?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  requireTypedConfirmation,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [typedValue, setTypedValue] = useState("");

  const canConfirm = !requireTypedConfirmation || typedValue === requireTypedConfirmation;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
      setTypedValue("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={submitting}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
      {requireTypedConfirmation && (
        <div className="mt-3">
          <label htmlFor="confirm-input" className="mb-1 block text-xs font-medium text-[var(--color-text)]">
            Type <span className="font-mono font-semibold">{requireTypedConfirmation}</span> to confirm
          </label>
          <input
            id="confirm-input"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            className="w-full rounded border border-[var(--color-border-strong)] px-2.5 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            autoComplete="off"
          />
        </div>
      )}
    </Modal>
  );
}
