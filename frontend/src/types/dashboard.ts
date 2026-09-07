export interface ActivityItem {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_label: string | null;
  user_name: string | null;
  created_at: string;
}

export interface DashboardSummary {
  total_zones: number;
  public_zones: number;
  private_zones: number;
  total_records: number;
  recent_activity: ActivityItem[];
}
