"""BIND zone file parsing utilities.

Implements a pragmatic (not exhaustive) parser for the common subset of BIND
zone file syntax needed by the assignment: $ORIGIN / $TTL directives, ';'
comments, blank lines, and single-line resource records of the supported
types (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA). Multi-line records using
parentheses are not supported and will surface as a parse error for that line.
"""

from __future__ import annotations

import re
import shlex
from dataclasses import dataclass

from pydantic import ValidationError as PydanticValidationError

from app.models.dns_record import DnsRecordType
from app.schemas.dns_record import DnsRecordCreate

_SUPPORTED_TYPES = {t.value for t in DnsRecordType}
_CLASS_TOKENS = {"IN", "CH", "HS"}


@dataclass
class ParsedLineResult:
    line_number: int
    raw_line: str
    record: DnsRecordCreate | None
    error: str | None


def _strip_trailing_dot(name: str) -> str:
    return name[:-1] if name.endswith(".") else name


def _relative_name(name: str, origin: str) -> str:
    name = _strip_trailing_dot(name)
    if name in ("@", ""):
        return ""
    origin_stripped = _strip_trailing_dot(origin)
    if origin_stripped and (name == origin_stripped or name.endswith("." + origin_stripped)):
        relative = name[: -(len(origin_stripped) + 1)] if name != origin_stripped else ""
        return relative
    return name


def parse_bind_zone(content: str, *, default_ttl: int = 300) -> list[ParsedLineResult]:
    results: list[ParsedLineResult] = []
    origin = ""
    current_ttl = default_ttl
    last_name = ""

    for idx, raw_line in enumerate(content.splitlines(), start=1):
        line = raw_line.split(";", 1)[0].rstrip()
        if not line.strip():
            continue

        stripped = line.strip()

        if stripped.upper().startswith("$ORIGIN"):
            parts = stripped.split()
            if len(parts) >= 2:
                origin = parts[1]
            continue

        if stripped.upper().startswith("$TTL"):
            parts = stripped.split()
            if len(parts) >= 2 and parts[1].isdigit():
                current_ttl = int(parts[1])
            continue

        try:
            tokens = shlex.split(line, posix=True)
        except ValueError as exc:
            results.append(ParsedLineResult(idx, raw_line, None, f"Could not tokenize line: {exc}"))
            continue

        if not tokens:
            continue

        try:
            record, name_for_state = _parse_record_tokens(tokens, origin, current_ttl, last_name)
            last_name = name_for_state
            results.append(ParsedLineResult(idx, raw_line, record, None))
        except ValueError as exc:
            results.append(ParsedLineResult(idx, raw_line, None, str(exc)))

    return results


def _parse_record_tokens(
    tokens: list[str], origin: str, default_ttl: int, last_name: str
) -> tuple[DnsRecordCreate, str]:
    pos = 0

    # Leading name is optional in BIND (defaults to the previous record's name).
    if tokens[0].isdigit() or tokens[0].upper() in _CLASS_TOKENS or tokens[0].upper() in _SUPPORTED_TYPES:
        name_token = last_name if last_name else "@"
    else:
        name_token = tokens[0]
        pos += 1

    ttl = default_ttl
    if pos < len(tokens) and tokens[pos].isdigit():
        ttl = int(tokens[pos])
        pos += 1

    if pos < len(tokens) and tokens[pos].upper() in _CLASS_TOKENS:
        pos += 1

    if pos >= len(tokens):
        raise ValueError("Missing record type")

    record_type_token = tokens[pos].upper()
    pos += 1
    if record_type_token not in _SUPPORTED_TYPES:
        raise ValueError(f"Unsupported or unrecognized record type '{record_type_token}'")

    rest = tokens[pos:]
    record_type = DnsRecordType(record_type_token)
    name = _relative_name(name_token, origin)

    field_kwargs: dict = {"name": name, "type": record_type, "ttl": ttl}

    if record_type == DnsRecordType.MX:
        if len(rest) < 2:
            raise ValueError("MX record requires priority and mail server")
        field_kwargs["priority"] = int(rest[0])
        field_kwargs["value"] = _strip_trailing_dot(rest[1])
    elif record_type == DnsRecordType.SRV:
        if len(rest) < 4:
            raise ValueError("SRV record requires priority, weight, port, and target")
        field_kwargs["priority"] = int(rest[0])
        field_kwargs["weight"] = int(rest[1])
        field_kwargs["port"] = int(rest[2])
        field_kwargs["value"] = _strip_trailing_dot(rest[3])
    elif record_type == DnsRecordType.CAA:
        if len(rest) < 3:
            raise ValueError("CAA record requires flags, tag, and value")
        field_kwargs["flags"] = int(rest[0])
        field_kwargs["tag"] = rest[1]
        field_kwargs["value"] = rest[2].strip('"')
    elif record_type == DnsRecordType.TXT:
        if not rest:
            raise ValueError("TXT record requires a value")
        field_kwargs["value"] = " ".join(rest).strip('"')
    else:
        if not rest:
            raise ValueError(f"{record_type_token} record requires a value")
        field_kwargs["value"] = _strip_trailing_dot(rest[0])

    try:
        record = DnsRecordCreate(**field_kwargs)
    except PydanticValidationError as exc:
        raise ValueError(exc.errors()[0]["msg"]) from exc

    return record, (name if name else "@")
