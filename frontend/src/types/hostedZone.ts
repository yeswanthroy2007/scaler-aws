export type HostedZoneType = "public" | "private";

export interface HostedZone {
  id: number;
  zone_id: string;
  domain_name: string;
  zone_type: HostedZoneType;
  description: string | null;
  comment: string | null;
  vpc_id: string | null;
  vpc_region: string | null;
  name_servers: string[];
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneCreatePayload {
  domain_name: string;
  description?: string;
  zone_type: HostedZoneType;
  vpc_id?: string;
  vpc_region?: string;
}

export interface HostedZoneUpdatePayload {
  description?: string;
  comment?: string;
}

export interface HostedZoneListParams {
  search?: string;
  zone_type?: HostedZoneType;
  sort_by?: "domain_name" | "created_at" | "updated_at" | "zone_type";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface DashboardStats {
  total_zones: number;
  public_zones: number;
  private_zones: number;
}
