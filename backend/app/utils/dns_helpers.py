import hashlib

_NAME_SERVER_TEMPLATES = [
    "ns-{}.awsdns-{:02d}.com",
    "ns-{}.awsdns-{:02d}.net",
    "ns-{}.awsdns-{:02d}.org",
    "ns-{}.awsdns-{:02d}.co.uk",
]


def generate_name_servers(domain_name: str) -> list[str]:
    """Deterministically derive 4 mock AWS-style name servers from the domain name."""
    digest = hashlib.sha1(domain_name.encode("utf-8")).hexdigest()
    servers = []
    for i, template in enumerate(_NAME_SERVER_TEMPLATES):
        number = int(digest[i * 4 : i * 4 + 4], 16) % 2048
        suffix = int(digest[i * 2 : i * 2 + 2], 16) % 64
        servers.append(template.format(number, suffix))
    return servers
