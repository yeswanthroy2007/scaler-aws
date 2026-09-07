import type { DnsRecordFormValues, DnsRecordType } from "@/types/dnsRecord";

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HOSTNAME_LABEL_RE = /^(\*|[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?)$/;
const CAA_TAGS = ["issue", "issuewild", "iodef"];

export type FormErrors = Partial<Record<keyof DnsRecordFormValues, string>>;

function isValidIpv4(value: string): boolean {
  const match = IPV4_RE.exec(value);
  if (!match) return false;
  return match.slice(1).every((octet) => Number(octet) <= 255);
}

function isValidIpv6(value: string): boolean {
  // Pragmatic client-side check; the backend performs the authoritative validation.
  return /^[0-9a-fA-F:]+$/.test(value) && value.includes(":") && value.length <= 45;
}

function isValidName(name: string): boolean {
  if (name === "") return true;
  return name.split(".").every((label) => HOSTNAME_LABEL_RE.test(label));
}

export function validateRecordForm(values: DnsRecordFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!isValidName(values.name)) {
    errors.name = "Enter a valid record name (letters, numbers, hyphens).";
  }

  if (!values.value.trim()) {
    errors.value = "This field is required.";
  }

  if (values.ttl < 0 || !Number.isFinite(values.ttl)) {
    errors.ttl = "TTL must be a non-negative number.";
  }

  switch (values.type) {
    case "A":
      if (values.value && !isValidIpv4(values.value)) errors.value = "Enter a valid IPv4 address, e.g. 192.0.2.1";
      break;
    case "AAAA":
      if (values.value && !isValidIpv6(values.value)) errors.value = "Enter a valid IPv6 address, e.g. 2001:db8::1";
      break;
    case "CNAME":
      if (values.name === "") errors.name = "CNAME records cannot be created at the zone apex.";
      break;
    case "MX":
      if (values.priority === undefined || values.priority === null || Number.isNaN(values.priority)) {
        errors.priority = "Priority is required.";
      }
      break;
    case "SRV":
      (["priority", "weight", "port"] as const).forEach((field) => {
        const val = values[field];
        if (val === undefined || val === null || Number.isNaN(val)) {
          errors[field] = "Required for SRV records.";
        }
      });
      break;
    case "CAA":
      if (!values.tag || !CAA_TAGS.includes(values.tag)) {
        errors.tag = `Tag must be one of: ${CAA_TAGS.join(", ")}`;
      }
      break;
    default:
      break;
  }

  return errors;
}

export function defaultValuesForType(type: DnsRecordType, base?: Partial<DnsRecordFormValues>): DnsRecordFormValues {
  return {
    name: "",
    type,
    ttl: 300,
    value: "",
    priority: type === "MX" || type === "SRV" ? 10 : undefined,
    weight: type === "SRV" ? 1 : undefined,
    port: type === "SRV" ? 443 : undefined,
    flags: type === "CAA" ? 0 : undefined,
    tag: type === "CAA" ? "issue" : undefined,
    routing_policy: "simple",
    set_identifier: undefined,
    ...base,
  };
}
