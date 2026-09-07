# Architecture

This document expands on the [root README](../README.md#architecture) with request-lifecycle diagrams for each major flow.

## Layered overview

```mermaid
flowchart TB
    subgraph Browser
        UI[React components]
    end

    subgraph "Next.js (frontend, :3000)"
        Rewrite["Rewrite: /api/* -> BACKEND_URL/api/*\n(next.config.ts)"]
        Hooks["Feature hooks\n(features/*/use*.ts)"]
        ApiClient["services/api/*\n(typed fetch client)"]
    end

    subgraph "FastAPI (backend, :8000)"
        Routes["api/routes/*\n(thin HTTP layer)"]
        Controllers["controllers/*\n(orchestration + commit)"]
        Services["services/*\n(business rules, validation)"]
        Repos["repositories/*\n(SQL: filter/sort/paginate)"]
        Models["models/*\n(SQLAlchemy ORM)"]
    end

    DB[(SQLite)]

    UI --> Hooks --> ApiClient --> Rewrite --> Routes
    Routes --> Controllers --> Services --> Repos --> Models --> DB
```

Every write flows through exactly one controller function, which is the only place allowed to call `db.commit()`. Services never commit -- they raise a typed exception (`NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`) on failure, which a single global FastAPI exception handler in `main.py` translates into the right HTTP status code. This keeps error handling out of every route function.

## Request lifecycle (any authenticated request)

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js (rewrite)
    participant R as FastAPI route
    participant D as Dependency (get_current_user)
    participant C as Controller
    participant Sv as Service
    participant Rp as Repository
    participant DB as SQLite

    B->>N: fetch("/api/hosted-zones", credentials: include)
    N->>R: proxy to BACKEND_URL/api/hosted-zones (cookie forwarded)
    R->>D: resolve current_user from session cookie
    D-->>R: User (or raise UnauthorizedError -> 401)
    R->>C: call controller with parsed query params
    C->>Sv: list_zones(search, zone_type, sort, page)
    Sv->>Rp: list_paginated(...)
    Rp->>DB: SELECT ... WHERE ... ORDER BY ... LIMIT/OFFSET
    DB-->>Rp: rows + count
    Rp-->>Sv: (items, total)
    Sv-->>C: Page[HostedZoneResponse]
    C-->>R: Page[HostedZoneResponse]
    R-->>N: 200 JSON
    N-->>B: 200 JSON
```

## Authentication flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as AuthProvider (React context)
    participant A as POST /api/auth/login
    participant Svc as AuthService
    participant Sec as core/security.py

    B->>F: submit login form
    F->>A: POST { email, password, remember_me }
    A->>Svc: login(email, password)
    Svc->>Sec: verify_password(password, user.password_hash)
    Sec-->>Svc: bool
    alt invalid credentials
        Svc-->>A: raise UnauthorizedError
        A-->>F: 401 { detail }
        F-->>B: show inline error
    else valid
        Svc->>Sec: create_session_token(user.id)
        Sec-->>Svc: signed, expiring token
        Svc-->>A: (user, token)
        A-->>F: 200 { user, token } + Set-Cookie: r53_session (httpOnly)
        F-->>B: redirect to /route53
    end

    Note over B,F: On every page load, AuthProvider calls GET /api/auth/me.\nproxy.ts also blocks /route53/* at the edge if no session cookie is present,\navoiding a flash of protected content before the client check resolves.
```

Session tokens are **not** JWTs: they are `base64(payload).base64(HMAC-SHA256(payload))`, verified in `core/security.py` without any third-party crypto dependency (no `python-jose`, no `passlib`/`bcrypt`). This keeps the mock-auth dependency footprint at zero native packages -- which matters in practice on Python versions too new for a library's prebuilt wheels, where installing a native extension means compiling from source -- while preserving the same "signed + expiring" security shape a JWT would have.

## Hosted zone CRUD flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as HostedZoneFormModal
    participant Api as hostedZonesApi
    participant R as POST /api/hosted-zones
    participant Sv as HostedZoneService
    participant Rp as HostedZoneRepository

    U->>M: fill domain name, type, (VPC if private), submit
    M->>M: client-side validation (domain regex, private zone requires VPC)
    M->>Api: create({ domain_name, zone_type, ... })
    Api->>R: POST /api/hosted-zones
    R->>Sv: create_zone(payload, owner_id)
    Sv->>Rp: get_by_domain(domain_name)
    alt domain already exists
        Rp-->>Sv: existing zone
        Sv-->>R: raise ConflictError
        R-->>Api: 409 { detail }
        Api-->>M: ApiError(409, message)
        M-->>U: inline error banner
    else new domain
        Sv->>Sv: generate_name_servers(domain_name) (deterministic mock NS)
        Sv->>Rp: create(zone)
        Rp-->>Sv: persisted zone
        Sv->>Sv: audit.record(action="create", ...)
        Sv-->>R: HostedZoneResponse
        R->>R: db.commit()
        R-->>Api: 201 { zone }
        Api-->>M: success
        M-->>U: toast "Hosted zone created" + list refetch
    end
```

Deleting a hosted zone relies on the database's `ON DELETE CASCADE` (SQLite `PRAGMA foreign_keys=ON` is enabled per-connection in `core/database.py`) to remove all of its `dns_records` atomically -- verified by `tests/test_hosted_zones.py::test_delete_zone_cascades_records`.

## DNS record CRUD flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as DnsRecordFormModal
    participant Api as dnsRecordsApi
    participant R as POST .../records
    participant Sv as DnsRecordService
    participant Sch as Pydantic schema (dns_record.py)

    U->>M: pick record type -> form fields change dynamically
    M->>M: client-side validateRecordForm() (mirrors backend rules, for fast feedback)
    M->>Api: create(zoneId, values)
    Api->>R: POST /api/hosted-zones/{id}/records
    R->>Sch: DnsRecordCreate(**body) - type/field validation
    Note right of Sch: model_validator enforces: A/AAAA IP format,\nMX/SRV require priority/weight/port,\nCAA tag in {issue, issuewild, iodef},\nCNAME cannot be at the zone apex
    alt schema validation fails
        Sch-->>R: 422 Unprocessable Entity
        R-->>Api: 422 { detail: [...] }
        Api-->>M: ApiError(422, message)
    else valid
        R->>Sv: create_record(zone_id, payload)
        Sv->>Sv: check_duplicate() - CNAME singleton + exact-duplicate rules
        Sv-->>R: DnsRecordResponse
        R->>R: db.commit()
        R-->>Api: 201 { record }
        Api-->>M: success -> toast + table refetch
    end
```

The frontend's `validateRecordForm` (in `features/dns-records/recordValidation.ts`) is a **UX convenience only** -- the backend's Pydantic validators in `schemas/dns_record.py` are the source of truth and are re-checked on every request regardless of what the client sent.

## BIND import flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as ImportBindModal
    participant Prev as POST .../import/preview
    participant Conf as POST .../import/confirm
    participant Svc as BindImportService
    participant Parser as utils/parsers.py

    U->>M: upload zone file
    M->>Prev: multipart/form-data
    Prev->>Svc: preview(zone_id, file_bytes)
    Svc->>Parser: parse_bind_zone(text)
    Parser-->>Svc: [ {line, record | null, error | null}, ... ]
    Svc->>Svc: stash valid records in-memory under a random import_token (15 min TTL)
    Svc-->>Prev: preview response (valid/invalid counts + per-line detail)
    Prev-->>M: render preview table
    U->>M: click "Import N record(s)"
    M->>Conf: { import_token }
    Conf->>Svc: confirm(zone_id, import_token)
    loop for each staged record
        Svc->>Svc: DnsRecordService.create_record() (dup rules apply)
        alt duplicate
            Svc->>Svc: count as "skipped"
        else other failure
            Svc->>Svc: count as "failed" + capture message
        else success
            Svc->>Svc: count as "created"
        end
    end
    Svc-->>Conf: { created, skipped, failed, failures[] }
    Conf-->>M: summary screen
```

## Export flow

```mermaid
sequenceDiagram
    participant U as User
    participant Menu as ExportMenu
    participant R as GET .../export?format=
    participant Sv as ExportService

    U->>Menu: choose JSON or BIND
    Menu->>R: window navigation to /api/hosted-zones/{id}/export?format=...
    R->>Sv: export(zone_id, format)
    Sv->>Sv: load zone + all records from the database (live data, not cached)
    alt format=json
        Sv-->>R: structured JSON string
    else format=bind
        Sv-->>R: valid BIND zone file text ($ORIGIN, $TTL, NS + record lines)
    end
    R-->>U: file download (Content-Disposition: attachment)
```

## Global search flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as Header (useGlobalSearch)
    participant R as GET /api/search?q=
    participant Sv as SearchService
    participant ZR as HostedZoneRepository
    participant DR as DnsRecordRepository

    U->>H: types into the search box
    H->>H: debounce 250ms, guard against stale responses via a request id
    H->>R: GET /api/search?q=<debounced query>
    R->>Sv: search(query)
    par
        Sv->>ZR: list_paginated(search=query, page_size=5)
        ZR-->>Sv: matching hosted zones
    and
        Sv->>DR: search_global(query, limit=5)
        Note right of DR: JOINs dns_records -> hosted_zones,\nmatches name/value/type, across every zone
        DR-->>Sv: (record, zone) pairs
    and
        Sv->>Sv: match query against the static Route 53 section catalog
    end
    Sv-->>R: SearchResponse { items: [...] } (hosted_zone | dns_record | section)
    R-->>H: 200 JSON
    H-->>U: grouped dropdown (Hosted zones / DNS records / Route 53)
    U->>H: selects a result
    alt hosted_zone or section
        H->>U: router.push(item.href)
    else dns_record
        H->>U: router.push("/route53/hosted-zones/{zoneId}?search={recordToken}")
        Note right of U: Reuses the existing records-table search param --\nno separate "record detail" view needed.
    end
```

The same `?search=` query param that powers the hosted zone's own record search box (`useDnsRecordsList`, URL-synced via `useUrlParams`) is what a DNS record search result deep-links into, so clicking a record result lands on its zone's page with the table already filtered to that record -- no bespoke navigation target was built just for search.
