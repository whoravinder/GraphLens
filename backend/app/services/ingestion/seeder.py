import asyncio
import structlog
from app.config import get_settings
from app.services.rag.vector_store import get_collection_stats, ensure_collection
from app.services.ingestion.cisa import ingest_cisa_kev, ingest_mitre_attack
from app.services.ingestion.nvd import ingest_nvd_cves

logger = structlog.get_logger(__name__)
settings = get_settings()

_seeding_in_progress = False
_seeded = False


async def _is_collection_empty() -> bool:
    try:
        stats = await get_collection_stats()
        count = stats.get("points_count", 0) or 0
        return count == 0
    except Exception:
        return True


async def seed_knowledge_base() -> None:
    global _seeding_in_progress, _seeded

    if _seeded or _seeding_in_progress:
        return

    try:
        empty = await _is_collection_empty()
        if not empty:
            logger.info("seed_skipped_already_populated")
            _seeded = True
            return
    except Exception as exc:
        logger.warning("seed_check_failed", error=str(exc))
        return

    _seeding_in_progress = True
    logger.info("auto_seed_starting", reason="collection is empty")

    results = {}

    try:
        results["cisa_kev"] = await ingest_cisa_kev()
        logger.info("seed_cisa_kev_done", count=results["cisa_kev"])
    except Exception as exc:
        logger.warning("seed_cisa_kev_failed", error=str(exc))
        results["cisa_kev"] = 0

    try:
        results["mitre_attack"] = await ingest_mitre_attack()
        logger.info("seed_mitre_done", count=results["mitre_attack"])
    except Exception as exc:
        logger.warning("seed_mitre_failed", error=str(exc))
        results["mitre_attack"] = 0

    try:
        results["nvd_cves"] = await ingest_nvd_cves("network", results_per_page=50)
        logger.info("seed_nvd_done", count=results["nvd_cves"])
    except Exception as exc:
        logger.warning("seed_nvd_failed", error=str(exc))
        results["nvd_cves"] = 0

    total = sum(results.values())
    logger.info("auto_seed_complete", total_documents=total, breakdown=results)
    _seeded = True
    _seeding_in_progress = False


async def run_seed_in_background() -> None:
    if not settings.AUTO_SEED_ON_STARTUP:
        logger.info("auto_seed_disabled", reason="AUTO_SEED_ON_STARTUP=false")
        return
    asyncio.create_task(seed_knowledge_base())
