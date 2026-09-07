"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/feedback/Alert";
import { dnsRecordsApi } from "@/services/api/dnsRecords";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import { DNS_RECORD_TYPES, type DnsRecord, type DnsRecordFormValues, type DnsRecordType } from "@/types/dnsRecord";
import { RECORD_TYPE_CONFIG, TTL_PRESETS } from "@/constants/dnsRecordFields";
import { defaultValuesForType, validateRecordForm, type FormErrors } from "./recordValidation";

interface DnsRecordFormModalProps {
  open: boolean;
  onClose: () => void;
  zoneId: number;
  domainName: string;
  record?: DnsRecord | null;
  onSaved: () => void;
}

function fromRecord(record: DnsRecord): DnsRecordFormValues {
  return {
    name: record.name,
    type: record.type,
    ttl: record.ttl,
    value: record.value,
    priority: record.priority ?? undefined,
    weight: record.weight ?? undefined,
    port: record.port ?? undefined,
    flags: record.flags ?? undefined,
    tag: record.tag ?? undefined,
    routing_policy: record.routing_policy,
    set_identifier: record.set_identifier ?? undefined,
  };
}

export function DnsRecordFormModal({ open, onClose, zoneId, domainName, record, onSaved }: DnsRecordFormModalProps) {
  const isEdit = Boolean(record);
  const toast = useToast();
  const [values, setValues] = useState<DnsRecordFormValues>(() => (record ? fromRecord(record) : defaultValuesForType("A")));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-initialize the form whenever the modal transitions to open (rather than
  // in an Effect) so the fields reset synchronously, before the opening paint.
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setValues(record ? fromRecord(record) : defaultValuesForType("A"));
    setErrors({});
    setSubmitError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleTypeChange(type: DnsRecordType) {
    setValues((prev) => defaultValuesForType(type, { name: prev.name, ttl: prev.ttl }));
    setErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateRecordForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (isEdit && record) {
        await dnsRecordsApi.update(zoneId, record.id, values);
        toast.success("Record updated", `${values.name || "@"} (${values.type})`);
      } else {
        await dnsRecordsApi.create(zoneId, values);
        toast.success("Record created", `${values.name || "@"} (${values.type})`);
      }
      onSaved();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  }

  const config = RECORD_TYPE_CONFIG[values.type];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit record" : "Create record"}
      description={domainName}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEdit ? "Save changes" : "Create record"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Record name" error={errors.name} hint={`Relative to ${domainName}. Leave blank for the zone apex.`}>
            {(id) => (
              <div className="flex items-center gap-1.5">
                <Input
                  id={id}
                  value={values.name}
                  placeholder="www"
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  hasError={Boolean(errors.name)}
                  disabled={isEdit}
                  autoFocus
                />
                <span className="shrink-0 text-xs text-[var(--color-text-muted)]">.{domainName}</span>
              </div>
            )}
          </FormField>

          <FormField label="Record type" error={undefined}>
            {(id) => (
              <Select id={id} value={values.type} onChange={(e) => handleTypeChange(e.target.value as DnsRecordType)} disabled={isEdit}>
                {DNS_RECORD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        <p className="-mt-2 text-xs text-[var(--color-text-secondary)]">{config.description}</p>

        <FormField label="TTL (seconds)" required error={errors.ttl} hint="Time to live: how long resolvers cache this record.">
          {(id) => (
            <div className="flex items-center gap-2">
              <Input
                id={id}
                type="number"
                min={0}
                value={values.ttl}
                onChange={(e) => setValues((v) => ({ ...v, ttl: Number(e.target.value) }))}
                hasError={Boolean(errors.ttl)}
                className="max-w-[140px]"
              />
              <Select
                aria-label="TTL preset"
                value=""
                onChange={(e) => e.target.value && setValues((v) => ({ ...v, ttl: Number(e.target.value) }))}
                className="w-40!"
              >
                <option value="">Presets...</option>
                {TTL_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </FormField>

        {(values.type === "MX" || values.type === "SRV") && (
          <FormField label="Priority" required error={errors.priority}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={65535}
                value={values.priority ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value === "" ? undefined : Number(e.target.value) }))}
                hasError={Boolean(errors.priority)}
              />
            )}
          </FormField>
        )}

        {values.type === "SRV" && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Weight" required error={errors.weight}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={65535}
                  value={values.weight ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, weight: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  hasError={Boolean(errors.weight)}
                />
              )}
            </FormField>
            <FormField label="Port" required error={errors.port}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={65535}
                  value={values.port ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, port: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  hasError={Boolean(errors.port)}
                />
              )}
            </FormField>
          </div>
        )}

        {values.type === "CAA" && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Flags" error={errors.flags}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={255}
                  value={values.flags ?? 0}
                  onChange={(e) => setValues((v) => ({ ...v, flags: Number(e.target.value) }))}
                />
              )}
            </FormField>
            <FormField label="Tag" required error={errors.tag}>
              {(id) => (
                <Select id={id} value={values.tag ?? "issue"} onChange={(e) => setValues((v) => ({ ...v, tag: e.target.value }))}>
                  <option value="issue">issue</option>
                  <option value="issuewild">issuewild</option>
                  <option value="iodef">iodef</option>
                </Select>
              )}
            </FormField>
          </div>
        )}

        <FormField label={config.valueLabel} required error={errors.value}>
          {(id) => (
            <Input
              id={id}
              value={values.value}
              placeholder={config.valuePlaceholder}
              onChange={(e) => setValues((v) => ({ ...v, value: e.target.value }))}
              hasError={Boolean(errors.value)}
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
