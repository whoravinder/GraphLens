from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import ORJSONResponse
import os

RATE_LIMIT_PER_MINUTE = int(os.environ.get('RATE_LIMIT_PER_MINUTE', '60'))

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"],
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
