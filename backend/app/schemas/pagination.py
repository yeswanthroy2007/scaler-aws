from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PageMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class Page(BaseModel, Generic[T]):
    items: list[T]
    meta: PageMeta


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)


def build_page(items: list[T], total: int, page: int, page_size: int) -> Page[T]:
    total_pages = max(1, (total + page_size - 1) // page_size)
    return Page[T](items=items, meta=PageMeta(total=total, page=page, page_size=page_size, total_pages=total_pages))
