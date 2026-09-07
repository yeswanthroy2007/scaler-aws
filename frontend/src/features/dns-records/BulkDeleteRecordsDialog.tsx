"use client";

import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { dnsRecordsApi } from "@/services/api/dnsRecords";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";

export function BulkDeleteRecordsDialog({
  zoneId,
  recordIds,
  open,
  onClose,
  onDeleted,
}: {
  zoneId: number;
  recordIds: number[];
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const toast = useToast();

  async function handleConfirm() {
    try {
      const result = await dnsRecordsApi.bulkDelete(zoneId, recordIds);
      toast.success("Records deleted", `${result.deleted} record(s) were removed.`);
      onDeleted();
    } catch (error) {
      toast.error("Failed to delete records", error instanceof ApiError ? error.message : undefined);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete selected records"
      description={`Delete ${recordIds.length} selected record(s)? This action cannot be undone.`}
      confirmLabel={`Delete ${recordIds.length} record(s)`}
    />
  );
}
