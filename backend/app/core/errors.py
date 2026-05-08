from fastapi import HTTPException, Request
from fastapi.responses import ORJSONResponse
from pydantic import ValidationError
import structlog

logger = structlog.get_logger(__name__)


class GraphLensException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(GraphLensException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} '{identifier}' not found",
            code="NOT_FOUND",
            status_code=404,
        )


class ValidationException(GraphLensException):
    def __init__(self, message: str):
        super().__init__(message=message, code="VALIDATION_ERROR", status_code=422)


class ServiceUnavailableException(GraphLensException):
    def __init__(self, service: str):
        super().__init__(
            message=f"Service '{service}' is currently unavailable",
            code="SERVICE_UNAVAILABLE",
            status_code=503,
        )


async def graphlens_exception_handler(request: Request, exc: GraphLensException) -> ORJSONResponse:
    logger.warning("graphlens_exception", path=request.url.path, code=exc.code, message=exc.message)
    return ORJSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> ORJSONResponse:
    logger.warning("http_exception", path=request.url.path, status_code=exc.status_code, detail=exc.detail)
    return ORJSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
    )


async def validation_exception_handler(request: Request, exc: ValidationError) -> ORJSONResponse:
    logger.warning("validation_error", path=request.url.path, errors=exc.errors())
    return ORJSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "details": exc.errors()}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> ORJSONResponse:
    logger.exception("unhandled_exception", path=request.url.path, exc_info=exc)
    return ORJSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )
