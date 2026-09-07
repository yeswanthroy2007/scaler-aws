export type SearchResultType = "hosted_zone" | "dns_record" | "section";

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  href: string;
}

export interface SearchResponse {
  query: string;
  items: SearchResultItem[];
}
