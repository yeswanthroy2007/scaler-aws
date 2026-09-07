import type { DnsRecordType } from "@/types/dnsRecord";

export interface RecordTypeConfig {
  label: string;
  description: string;
  valueLabel: string;
  valuePlaceholder: string;
  fields: Array<"priority" | "weight" | "port" | "flags" | "tag">;
}

export const RECORD_TYPE_CONFIG: Record<DnsRecordType, RecordTypeConfig> = {
  A: {
    label: "A - IPv4 address",
    description: "Routes traffic to an IPv4 address.",
    valueLabel: "Value",
    valuePlaceholder: "192.0.2.1",
    fields: [],
  },
  AAAA: {
    label: "AAAA - IPv6 address",
    description: "Routes traffic to an IPv6 address.",
    valueLabel: "Value",
    valuePlaceholder: "2001:db8::1",
    fields: [],
  },
  CNAME: {
    label: "CNAME - Canonical name",
    description: "Routes traffic to another domain name (cannot be used at the zone apex).",
    valueLabel: "Target",
    valuePlaceholder: "target.example.com",
    fields: [],
  },
  TXT: {
    label: "TXT - Text",
    description: "Holds arbitrary text, commonly used for domain verification and SPF/DMARC.",
    valueLabel: "Value",
    valuePlaceholder: '"v=spf1 include:_spf.example.com ~all"',
    fields: [],
  },
  MX: {
    label: "MX - Mail exchange",
    description: "Routes email to mail servers, ranked by priority (lower is preferred).",
    valueLabel: "Mail server",
    valuePlaceholder: "mail.example.com",
    fields: ["priority"],
  },
  NS: {
    label: "NS - Name server",
    description: "Delegates a subdomain to a different set of name servers.",
    valueLabel: "Name server",
    valuePlaceholder: "ns-1.awsdns-01.com",
    fields: [],
  },
  PTR: {
    label: "PTR - Pointer",
    description: "Maps an IP address to a hostname, commonly used for reverse DNS lookups.",
    valueLabel: "Hostname",
    valuePlaceholder: "host.example.com",
    fields: [],
  },
  SRV: {
    label: "SRV - Service locator",
    description: "Specifies the host and port for a specific service, e.g. SIP or XMPP.",
    valueLabel: "Target",
    valuePlaceholder: "sipserver.example.com",
    fields: ["priority", "weight", "port"],
  },
  CAA: {
    label: "CAA - Certification Authority Authorization",
    description: "Restricts which certificate authorities may issue certificates for this domain.",
    valueLabel: "Value",
    valuePlaceholder: "letsencrypt.org",
    fields: ["flags", "tag"],
  },
};

export const TTL_PRESETS = [
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
  { label: "2 days (default NS/SOA)", value: 172800 },
];
