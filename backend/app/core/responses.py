from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    meta: dict[str, Any] | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


def success_response(data: Any, meta: dict[str, Any] | None = None) -> dict:
    return {"success": True, "data": data, "meta": meta}


def paginated_response(data: list, total: int, page: int, per_page: int) -> dict:
    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
        "has_prev": page > 1,
    }
