from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.dns_record import DnsRecord, DnsRecordType
from app.repositories.dns_record_repository import DnsRecordRepository
from app.repositories.hosted_zone_repository import HostedZoneRepository


def _record_to_bind_line(record: DnsRecord) -> str:
    name = record.name if record.name else "@"
    prefix = f"{name:<32}{record.ttl:<8}IN{record.type.value:>8} "

    if record.type == DnsRecordType.MX:
        return f"{prefix}{record.priority} {record.value}."
    if record.type == DnsRecordType.SRV:
        return f"{prefix}{record.priority} {record.weight} {record.port} {record.value}."
    if record.type == DnsRecordType.CAA:
        return f"{prefix}{record.flags} {record.tag} \"{record.value}\""
    if record.type == DnsRecordType.TXT:
        return f'{prefix}"{record.value}"'
    if record.type in (DnsRecordType.CNAME, DnsRecordType.NS, DnsRecordType.PTR):
        value = record.value if record.value.endswith(".") else f"{record.value}."
        return f"{prefix}{value}"
    return f"{prefix}{record.value}"


class ExportService:
    def __init__(self, db: Session) -> None:
        self.zones = HostedZoneRepository(db)
        self.records = DnsRecordRepository(db)

    def _get_zone_or_raise(self, hosted_zone_id: int):
        zone = self.zones.get_by_id(hosted_zone_id)
        if zone is None:
            raise NotFoundError(f"Hosted zone {hosted_zone_id} was not found")
        return zone

    def export_json(self, hosted_zone_id: int) -> str:
        zone = self._get_zone_or_raise(hosted_zone_id)
        records = self.records.list_all_for_zone(hosted_zone_id)

        payload = {
            "hostedZone": {
                "id": zone.zone_id,
                "domainName": zone.domain_name,
                "type": zone.zone_type.value,
                "description": zone.description,
                "nameServers": zone.name_server_list,
                "vpcId": zone.vpc_id,
                "vpcRegion": zone.vpc_region,
            },
            "recordSets": [
                {
                    "name": record.name,
                    "type": record.type.value,
                    "ttl": record.ttl,
                    "value": record.value,
                    "priority": record.priority,
                    "weight": record.weight,
                    "port": record.port,
                    "flags": record.flags,
                    "tag": record.tag,
                    "routingPolicy": record.routing_policy.value,
                    "setIdentifier": record.set_identifier,
                }
                for record in records
            ],
            "exportedAt": datetime.now(timezone.utc).isoformat(),
        }
        return json.dumps(payload, indent=2)

    def export_bind(self, hosted_zone_id: int) -> str:
        zone = self._get_zone_or_raise(hosted_zone_id)
        records = self.records.list_all_for_zone(hosted_zone_id)

        lines = [
            f"; Zone file for {zone.domain_name}",
            f"; Exported {datetime.now(timezone.utc).isoformat()}",
            f"$ORIGIN {zone.domain_name}.",
            "$TTL 300",
            "",
        ]
        for ns in zone.name_server_list:
            lines.append(f"{'@':<32}{300:<8}IN{'NS':>8} {ns}.")
        lines.append("")
        for record in records:
            lines.append(_record_to_bind_line(record))
        return "\n".join(lines) + "\n"

    def export(self, hosted_zone_id: int, fmt: str) -> tuple[str, str, str]:
        """Returns (content, media_type, filename)."""
        zone = self._get_zone_or_raise(hosted_zone_id)
        if fmt == "json":
            return self.export_json(hosted_zone_id), "application/json", f"{zone.domain_name}.json"
        if fmt == "bind":
            return self.export_bind(hosted_zone_id), "text/dns", f"{zone.domain_name}.zone"
        raise ValidationError("Export format must be 'json' or 'bind'")
