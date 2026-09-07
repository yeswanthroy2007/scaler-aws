"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/feedback/Alert";
import { hostedZonesApi } from "@/services/api/hostedZones";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import type { HostedZone } from "@/types/hostedZone";

export function EditHostedZoneModal({
  zone,
  open,
  onClose,
  onUpdated,
}: {
  zone: HostedZone;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const toast = useToast();
  const [description, setDescription] = useState(zone.description ?? "");
  const [comment, setComment] = useState(zone.comment ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-initialize the form whenever the modal transitions to open, synchronously
  // during render rather than in an Effect (see: "adjusting state on a prop change").
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDescription(zone.description ?? "");
    setComment(zone.comment ?? "");
    setSubmitError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await hostedZonesApi.update(zone.id, { description: description.trim(), comment: comment.trim() });
      toast.success("Hosted zone updated");
      onUpdated();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to update hosted zone.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit hosted zone details`}
      description={zone.domain_name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}
        <FormField label="Description">
          {(id) => (
            <Textarea id={id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
          )}
        </FormField>
        <FormField label="Comment" hint="Internal note, not shown to end users.">
          {(id) => <Textarea id={id} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </FormField>
      </form>
    </Modal>
  );
}
