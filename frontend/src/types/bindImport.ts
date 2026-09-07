import type { DnsRecordFormValues } from "./dnsRecord";

export interface ParsedRecordPreview {
  line_number: number;
  raw_line: string;
  record: DnsRecordFormValues | null;
  error: string | null;
}

export interface BindImportPreviewResponse {
  zone_id: number;
  total_lines_parsed: number;
  valid_count: number;
  invalid_count: number;
  preview: ParsedRecordPreview[];
  import_token: string;
}

export interface BindImportSummary {
  created: number;
  skipped: number;
  failed: number;
  failures: string[];
}
