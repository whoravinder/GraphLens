import os

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings
import structlog

logger = structlog.get_logger(__name__)
settings = get_settings()
_database_url = os.getenv("DATABASE_URL")
engine = None
AsyncSessionLocal = None


class Base(DeclarativeBase):
    pass


if _database_url:
    engine = create_async_engine(
        _database_url,
        echo=settings.DEBUG,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


async def get_db() -> AsyncSession:
    if AsyncSessionLocal is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL environment variable is required")

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables() -> None:
    if engine is None:
        logger.warning("database_init_skipped", reason="DATABASE_URL environment variable is required")
        return

    from app.models.db import incident, analysis

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_tables_created")


async def dispose_engine() -> None:
    if engine is None:
        return

    await engine.dispose()
    logger.info("database_engine_disposed")
