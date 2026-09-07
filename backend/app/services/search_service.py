from __future__ import annotations

from urllib.parse import quote

from sqlalchemy.orm import Session

from app.repositories.dns_record_repository import DnsRecordRepository
from app.repositories.hosted_zone_repository import HostedZoneRepository
from app.schemas.search import SearchResponse, SearchResultItem

# Static catalog of Route 53 sections in this console. Not database-backed
# because these are fixed application routes, not user data -- but matching
# against them still happens server-side, in one place, alongside the
# database-backed results, rather than being duplicated/hardcoded per page
# on the frontend.
_SECTIONS: list[dict[str, str]] = [
    {"id": "overview", "title": "Route 53 overview", "href": "/route53", "keywords": "dashboard overview home"},
    {"id": "hosted-zones", "title": "Hosted zones", "href": "/route53/hosted-zones", "keywords": "hosted zones domains dns"},
    {
        "id": "traffic-policies",
        "title": "Traffic policies",
        "href": "/route53/traffic-policies",
        "keywords": "traffic policies routing",
    },
    {"id": "health-checks", "title": "Health checks", "href": "/route53/health-checks", "keywords": "health checks monitoring"},
    {"id": "resolver", "title": "Resolver", "href": "/route53/resolver", "keywords": "resolver endpoints forwarding"},
    {"id": "profiles", "title": "Profiles", "href": "/route53/profiles", "keywords": "profiles vpc associations"},
]

_MAX_PER_CATEGORY = 5


class SearchService:
    def __init__(self, db: Session) -> None:
        self.zones = HostedZoneRepository(db)
        self.records = DnsRecordRepository(db)

    def search(self, query: str) -> SearchResponse:
        normalized = query.strip()
        if not normalized:
            return SearchResponse(query=query, items=[])

        items: list[SearchResultItem] = []
        items.extend(self._search_hosted_zones(normalized))
        items.extend(self._search_dns_records(normalized))
        items.extend(self._search_sections(normalized))

        return SearchResponse(query=query, items=items)

    def _search_hosted_zones(self, query: str) -> list[SearchResultItem]:
        zones, _ = self.zones.list_paginated(
            search=query, zone_type=None, sort_by="domain_name", sort_dir="asc", page=1, page_size=_MAX_PER_CATEGORY
        )
        return [
            SearchResultItem(
                type="hosted_zone",
                id=str(zone.id),
                title=zone.domain_name,
                subtitle=zone.description or f"Hosted zone -- {zone.zone_type.value}",
                badge=zone.zone_type.value,
                href=f"/route53/hosted-zones/{zone.id}",
            )
            for zone in zones
        ]

    def _search_dns_records(self, query: str) -> list[SearchResultItem]:
        pairs = self.records.search_global(query, limit=_MAX_PER_CATEGORY)
        items = []
        for record, zone in pairs:
            full_name = f"{record.name}.{zone.domain_name}" if record.name else zone.domain_name
            search_token = record.name or record.value
            items.append(
                SearchResultItem(
                    type="dns_record",
                    id=str(record.id),
                    title=full_name,
                    subtitle=f"{record.type.value} record -> {record.value} (in {zone.domain_name})",
                    badge=record.type.value,
                    href=f"/route53/hosted-zones/{zone.id}?search={quote(search_token)}",
                )
            )
        return items

    def _search_sections(self, query: str) -> list[SearchResultItem]:
        normalized = query.lower()
        matches = [
            section
            for section in _SECTIONS
            if normalized in section["title"].lower() or normalized in section["keywords"]
        ]
        return [
            SearchResultItem(
                type="section",
                id=section["id"],
                title=section["title"],
                subtitle="Route 53",
                href=section["href"],
            )
            for section in matches[:_MAX_PER_CATEGORY]
        ]
