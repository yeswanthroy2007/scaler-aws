from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

SearchResultType = Literal["hosted_zone", "dns_record", "section"]


class SearchResultItem(BaseModel):
    type: SearchResultType
    id: str
    title: str
    subtitle: str | None = None
    badge: str | None = None
    href: str


class SearchResponse(BaseModel):
    query: str
    items: list[SearchResultItem]
