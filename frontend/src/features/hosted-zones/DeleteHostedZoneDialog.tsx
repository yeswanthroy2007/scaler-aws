"use client";

import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { hostedZonesApi } from "@/services/api/hostedZones";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import type { HostedZone } from "@/types/hostedZone";

export function DeleteHostedZoneDialog({
  zone,
  open,
  onClose,
  onDeleted,
}: {
  zone: HostedZone | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  if (!zone) return null;

  async function handleConfirm() {
    if (!zone) return;
    try {
      await hostedZonesApi.remove(zone.id);
      toast.success("Hosted zone deleted", `${zone.domain_name} and its ${zone.record_count} record(s) were removed.`);
      onDeleted();
    } catch (error) {
      toast.error("Failed to delete hosted zone", error instanceof ApiError ? error.message : undefined);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete hosted zone"
      description={`Deleting "${zone.domain_name}" will permanently remove this hosted zone and all ${zone.record_count} DNS record(s) it contains. This action cannot be undone.`}
      confirmLabel="Delete hosted zone"
      requireTypedConfirmation={zone.domain_name}
    />
  );
}
