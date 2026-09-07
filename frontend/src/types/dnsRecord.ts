export type DnsRecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "PTR" | "SRV" | "CAA";

export type RoutingPolicy = "simple" | "weighted" | "latency" | "failover" | "geolocation";

export interface DnsRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: DnsRecordType;
  ttl: number;
  value: string;
  priority: number | null;
  weight: number | null;
  port: number | null;
  flags: number | null;
  tag: string | null;
  routing_policy: RoutingPolicy;
  set_identifier: string | null;
  health_check_status: string;
  created_at: string;
  updated_at: string;
}

export interface DnsRecordFormValues {
  name: string;
  type: DnsRecordType;
  ttl: number;
  value: string;
  priority?: number | null;
  weight?: number | null;
  port?: number | null;
  flags?: number | null;
  tag?: string | null;
  routing_policy: RoutingPolicy;
  set_identifier?: string | null;
}

export interface DnsRecordListParams {
  search?: string;
  type?: DnsRecordType;
  sort_by?: "name" | "type" | "ttl" | "created_at";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export const DNS_RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"];
