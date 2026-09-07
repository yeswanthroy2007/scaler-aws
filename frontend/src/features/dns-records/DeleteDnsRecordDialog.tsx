"use client";

import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { dnsRecordsApi } from "@/services/api/dnsRecords";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import type { DnsRecord } from "@/types/dnsRecord";

export function DeleteDnsRecordDialog({
  zoneId,
  record,
  open,
  onClose,
  onDeleted,
}: {
  zoneId: number;
  record: DnsRecord | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  if (!record) return null;

  async function handleConfirm() {
    if (!record) return;
    try {
      await dnsRecordsApi.remove(zoneId, record.id);
      toast.success("Record deleted", `${record.name || "@"} (${record.type})`);
      onDeleted();
    } catch (error) {
      toast.error("Failed to delete record", error instanceof ApiError ? error.message : undefined);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete record"
      description={`Delete the ${record.type} record "${record.name || "@"}"? This action cannot be undone.`}
      confirmLabel="Delete record"
    />
  );
}
