from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

from app.api.routes import auth, dashboard, exports, hosted_zones, imports, records
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.exceptions import (
    AppError,
    ConflictError,
    FileTooLargeError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
import app.models  # noqa: F401  (ensures all models are registered before create_all)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("route53_clone")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="A production-quality educational clone of the AWS Route 53 console API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_ERROR_STATUS_MAP = {
    NotFoundError: 404,
    ConflictError: 409,
    ValidationError: 422,
    UnauthorizedError: 401,
    FileTooLargeError: 413,
}


@app.exception_handler(AppError)
def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    status_code = _ERROR_STATUS_MAP.get(type(exc), 400)
    return JSONResponse(status_code=status_code, content={"detail": exc.message})


@app.exception_handler(PydanticValidationError)
def handle_pydantic_error(request: Request, exc: PydanticValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An unexpected internal error occurred."})


app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)
app.include_router(imports.router)
app.include_router(exports.router)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok", "service": settings.app_name}
