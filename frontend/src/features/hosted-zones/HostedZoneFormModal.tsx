"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/feedback/Alert";
import { hostedZonesApi } from "@/services/api/hostedZones";
import { ApiError } from "@/services/api/client";
import { useToast } from "@/components/feedback/ToastProvider";
import type { HostedZoneType } from "@/types/hostedZone";

const DOMAIN_RE = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$/;

interface FormState {
  domainName: string;
  description: string;
  zoneType: HostedZoneType;
  vpcId: string;
  vpcRegion: string;
}

const INITIAL_STATE: FormState = {
  domainName: "",
  description: "",
  zoneType: "public",
  vpcId: "",
  vpcRegion: "us-east-1",
};

const AWS_REGIONS = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"];

export function HostedZoneFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm(INITIAL_STATE);
    setErrors({});
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const domain = form.domainName.trim().toLowerCase();
    if (!domain) {
      nextErrors.domainName = "Enter a domain name.";
    } else if (!DOMAIN_RE.test(domain)) {
      nextErrors.domainName = "Enter a valid domain name, e.g. example.com";
    }
    if (form.zoneType === "private") {
      if (!form.vpcId.trim()) nextErrors.vpcId = "VPC ID is required for private hosted zones.";
      if (!form.vpcRegion.trim()) nextErrors.vpcRegion = "VPC region is required for private hosted zones.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await hostedZonesApi.create({
        domain_name: form.domainName.trim().toLowerCase(),
        description: form.description.trim() || undefined,
        zone_type: form.zoneType,
        vpc_id: form.zoneType === "private" ? form.vpcId.trim() : undefined,
        vpc_region: form.zoneType === "private" ? form.vpcRegion.trim() : undefined,
      });
      toast.success("Hosted zone created", `${form.domainName} is ready to use.`);
      reset();
      onCreated();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to create hosted zone.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create hosted zone"
      description="A hosted zone is a container for records, which define how you want to route traffic for a domain."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Create hosted zone
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <FormField label="Domain name" required error={errors.domainName} hint="Records added to this zone must be subdomains of this domain.">
          {(id, describedBy) => (
            <Input
              id={id}
              placeholder="example.com"
              value={form.domainName}
              onChange={(e) => setForm((f) => ({ ...f, domainName: e.target.value }))}
              aria-describedby={describedBy}
              aria-invalid={Boolean(errors.domainName)}
              hasError={Boolean(errors.domainName)}
              autoFocus
            />
          )}
        </FormField>

        <FormField label="Description" error={errors.description}>
          {(id) => (
            <Textarea
              id={id}
              rows={2}
              placeholder="Optional description for this hosted zone"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          )}
        </FormField>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-[var(--color-text)]">Type</legend>
          <div className="flex flex-col gap-2">
            {(
              [
                { value: "public", title: "Public hosted zone", description: "Routes traffic on the internet." },
                { value: "private", title: "Private hosted zone", description: "Routes traffic within one or more VPCs." },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2.5 rounded border border-[var(--color-border)] p-2.5 has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-info-bg)]"
              >
                <input
                  type="radio"
                  name="zoneType"
                  value={option.value}
                  checked={form.zoneType === option.value}
                  onChange={() => setForm((f) => ({ ...f, zoneType: option.value }))}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--color-text)]">{option.title}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)]">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.zoneType === "private" && (
          <div className="grid grid-cols-2 gap-3 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
            <FormField label="VPC ID" required error={errors.vpcId} className="col-span-2">
              {(id) => (
                <Input
                  id={id}
                  placeholder="vpc-0a1b2c3d4e5f6g7h8"
                  value={form.vpcId}
                  onChange={(e) => setForm((f) => ({ ...f, vpcId: e.target.value }))}
                  hasError={Boolean(errors.vpcId)}
                />
              )}
            </FormField>
            <FormField label="VPC region" required error={errors.vpcRegion} className="col-span-2">
              {(id) => (
                <select
                  id={id}
                  value={form.vpcRegion}
                  onChange={(e) => setForm((f) => ({ ...f, vpcRegion: e.target.value }))}
                  className="w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
                >
                  {AWS_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
        )}
      </form>
    </Modal>
  );
}
