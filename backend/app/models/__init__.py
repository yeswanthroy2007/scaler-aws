"""Import all models here so SQLAlchemy's mapper registry sees every mapped class
before `Base.metadata.create_all()` / relationship configuration runs."""

from app.models.audit_log import AuditLog
from app.models.dns_record import DnsRecord, DnsRecordType, RoutingPolicy
from app.models.hosted_zone import HostedZone, HostedZoneType
from app.models.user import User

__all__ = [
    "AuditLog",
    "DnsRecord",
    "DnsRecordType",
    "RoutingPolicy",
    "HostedZone",
    "HostedZoneType",
    "User",
]
