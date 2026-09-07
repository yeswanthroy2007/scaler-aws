"""Database seed script.

Usage:
    python -m app.seed          # seed if empty (safe to re-run)
    python -m app.seed --reset  # drop and recreate all tables, then seed
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.audit_log import AuditLog
from app.models.dns_record import DnsRecord, DnsRecordType, RoutingPolicy
from app.models.hosted_zone import HostedZone, HostedZoneType
from app.models.user import User
from app.utils.dns_helpers import generate_name_servers

DEMO_EMAIL = "admin@example.com"
DEMO_PASSWORD = "Password123!"
DEMO_NAME = "Alex Administrator"


def _seed_zone(db, *, domain: str, zone_type: HostedZoneType, description: str, owner_id: int, vpc_id: str | None = None, vpc_region: str | None = None) -> HostedZone:
    zone = HostedZone(
        domain_name=domain,
        zone_type=zone_type,
        description=description,
        owner_id=owner_id,
        vpc_id=vpc_id,
        vpc_region=vpc_region,
        name_servers="\n".join(generate_name_servers(domain)),
    )
    db.add(zone)
    db.flush()
    return zone


def _add_record(db, zone: HostedZone, **kwargs) -> DnsRecord:
    record = DnsRecord(hosted_zone_id=zone.id, **kwargs)
    db.add(record)
    return record


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing_user is not None and not reset:
            print("Database already seeded. Use --reset to wipe and reseed.")
            return

        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            name=DEMO_NAME,
            account_id="123456789012",
        )
        db.add(user)
        db.flush()

        # ---- example.com ----------------------------------------------------
        zone = _seed_zone(
            db, domain="example.com", zone_type=HostedZoneType.PUBLIC,
            description="Primary marketing site and API for Example Corp.", owner_id=user.id,
        )
        _add_record(db, zone, name="", type=DnsRecordType.A, ttl=300, value="192.0.2.10")
        _add_record(db, zone, name="", type=DnsRecordType.AAAA, ttl=300, value="2001:db8::10")
        _add_record(db, zone, name="www", type=DnsRecordType.CNAME, ttl=300, value="example.com")
        _add_record(db, zone, name="api", type=DnsRecordType.A, ttl=60, value="192.0.2.20")
        _add_record(db, zone, name="", type=DnsRecordType.MX, ttl=3600, value="mail.example.com", priority=10)
        _add_record(db, zone, name="", type=DnsRecordType.MX, ttl=3600, value="mail2.example.com", priority=20)
        _add_record(db, zone, name="mail", type=DnsRecordType.A, ttl=3600, value="192.0.2.30")
        _add_record(db, zone, name="", type=DnsRecordType.TXT, ttl=3600, value="v=spf1 include:_spf.example.com ~all")
        _add_record(db, zone, name="_dmarc", type=DnsRecordType.TXT, ttl=3600, value="v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com")
        _add_record(db, zone, name="", type=DnsRecordType.NS, ttl=172800, value=zone.name_server_list[0])
        _add_record(
            db, zone, name="_sip._tcp", type=DnsRecordType.SRV, ttl=3600, value="sipserver.example.com",
            priority=10, weight=60, port=5060,
        )
        _add_record(db, zone, name="", type=DnsRecordType.CAA, ttl=3600, value="letsencrypt.org", flags=0, tag="issue")

        # ---- example.org ------------------------------------------------------
        zone2 = _seed_zone(
            db, domain="example.org", zone_type=HostedZoneType.PUBLIC,
            description="Non-profit foundation site.", owner_id=user.id,
        )
        _add_record(db, zone2, name="", type=DnsRecordType.A, ttl=300, value="203.0.113.5")
        _add_record(db, zone2, name="www", type=DnsRecordType.CNAME, ttl=300, value="example.org")
        _add_record(db, zone2, name="", type=DnsRecordType.MX, ttl=3600, value="aspmx.l.example.org", priority=1)
        _add_record(db, zone2, name="", type=DnsRecordType.TXT, ttl=3600, value="v=spf1 -all")
        _add_record(db, zone2, name="donate", type=DnsRecordType.A, ttl=300, value="203.0.113.15")

        # ---- myapp.com ----------------------------------------------------
        zone3 = _seed_zone(
            db, domain="myapp.com", zone_type=HostedZoneType.PUBLIC,
            description="Production SaaS application infrastructure.", owner_id=user.id,
        )
        _add_record(db, zone3, name="", type=DnsRecordType.A, ttl=60, value="198.51.100.11")
        _add_record(db, zone3, name="app", type=DnsRecordType.A, ttl=60, value="198.51.100.12")
        _add_record(db, zone3, name="app", type=DnsRecordType.A, ttl=60, value="198.51.100.13", set_identifier="secondary", routing_policy=RoutingPolicy.WEIGHTED, weight=50)
        _add_record(db, zone3, name="cdn", type=DnsRecordType.CNAME, ttl=300, value="d111111abcdef8.cloudfront.example.net")
        _add_record(db, zone3, name="status", type=DnsRecordType.CNAME, ttl=300, value="statuspage.example.net")
        _add_record(db, zone3, name="api", type=DnsRecordType.AAAA, ttl=60, value="2001:db8:85a3::8a2e:370:7334")
        _add_record(db, zone3, name="", type=DnsRecordType.TXT, ttl=3600, value="google-site-verification=abc123def456")
        _add_record(db, zone3, name="db-primary", type=DnsRecordType.A, ttl=30, value="198.51.100.50", health_check_status="healthy")
        _add_record(db, zone3, name="db-standby", type=DnsRecordType.A, ttl=30, value="198.51.100.51", health_check_status="healthy", routing_policy=RoutingPolicy.FAILOVER, set_identifier="standby")

        # ---- internal.example.com (private) -----------------------------
        zone4 = _seed_zone(
            db, domain="internal.example.com", zone_type=HostedZoneType.PRIVATE,
            description="Internal services resolvable only within the corporate VPC.",
            owner_id=user.id, vpc_id="vpc-0a1b2c3d4e5f6g7h8", vpc_region="us-east-1",
        )
        _add_record(db, zone4, name="jenkins", type=DnsRecordType.A, ttl=300, value="10.0.1.15")
        _add_record(db, zone4, name="jira", type=DnsRecordType.A, ttl=300, value="10.0.1.16")
        _add_record(db, zone4, name="vpn", type=DnsRecordType.A, ttl=300, value="10.0.0.1")
        _add_record(db, zone4, name="db", type=DnsRecordType.CNAME, ttl=300, value="prod-db.internal.example.com")
        _add_record(db, zone4, name="prod-db", type=DnsRecordType.A, ttl=60, value="10.0.2.20")

        # ---- company.test -------------------------------------------------
        zone5 = _seed_zone(
            db, domain="company.test", zone_type=HostedZoneType.PUBLIC,
            description="Staging environment for internal QA.", owner_id=user.id,
        )
        _add_record(db, zone5, name="", type=DnsRecordType.A, ttl=300, value="192.0.2.99")
        _add_record(db, zone5, name="staging", type=DnsRecordType.A, ttl=300, value="192.0.2.100")
        _add_record(db, zone5, name="staging-legacy", type=DnsRecordType.PTR, ttl=300, value="staging.company.test")
        _add_record(db, zone5, name="", type=DnsRecordType.TXT, ttl=3600, value="heroku-verification=xyz789")

        # ---- sample recent activity feed ----------------------------------
        now = datetime.now(timezone.utc)
        activity = [
            ("create", "hosted_zone", zone.zone_id, zone.domain_name, timedelta(days=6)),
            ("create", "hosted_zone", zone2.zone_id, zone2.domain_name, timedelta(days=5, hours=20)),
            ("create", "hosted_zone", zone3.zone_id, zone3.domain_name, timedelta(days=4)),
            ("create", "dns_record", "seed", "app.myapp.com (A)", timedelta(days=3, hours=6)),
            ("update", "dns_record", "seed", "www.example.com (CNAME)", timedelta(days=2, hours=10)),
            ("create", "hosted_zone", zone4.zone_id, zone4.domain_name, timedelta(days=2)),
            ("import", "hosted_zone", str(zone5.id), zone5.domain_name, timedelta(days=1, hours=4)),
            ("create", "hosted_zone", zone5.zone_id, zone5.domain_name, timedelta(hours=20)),
            ("create", "dns_record", "seed", "staging.company.test (A)", timedelta(hours=3)),
        ]
        for action, resource_type, resource_id, label, age in activity:
            db.add(
                AuditLog(
                    user_id=user.id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    resource_label=label,
                    created_at=now - age,
                )
            )

        db.commit()
        print(f"Seeded database with 5 hosted zones and demo user '{DEMO_EMAIL}'.")
        print(f"Demo credentials -> email: {DEMO_EMAIL}  password: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
