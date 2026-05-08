from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import ORJSONResponse
from app.config import get_settings

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri=settings.REDIS_URL,
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> ORJSONResponse:
    return ORJSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Rate limit exceeded. Retry after {exc.retry_after} seconds.",
                "retry_after": exc.retry_after,
            }
        },
        headers={"Retry-After": str(exc.retry_after)},
    )
