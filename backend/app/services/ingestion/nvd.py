import httpx
import os
import structlog
from app.services.rag.vector_store import upsert_documents
from app.services.graph.neo4j_client import create_cve_node
import uuid

logger = structlog.get_logger(__name__)

NVD_API_KEY = os.environ.get('NVD_API_KEY', '')
NVD_BASE_URL = os.environ.get('NVD_BASE_URL', 'https://services.nvd.nist.gov/rest/json/cves/2.0')


async def ingest_nvd_cves(keyword: str = "network", results_per_page: int = 20) -> int:
    params = {"keywordSearch": keyword, "resultsPerPage": results_per_page}
    headers = {}
    if NVD_API_KEY:
        headers["apiKey"] = NVD_API_KEY

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.get(NVD_BASE_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            logger.error("nvd_fetch_failed", error=str(exc))
            return 0

    vulnerabilities = data.get("vulnerabilities", [])
    documents = []
    for item in vulnerabilities:
        cve = item.get("cve", {})
        cve_id = cve.get("id", "")
        descriptions = cve.get("descriptions", [])
        description = next((d["value"] for d in descriptions if d["lang"] == "en"), "")
        metrics = cve.get("metrics", {})
        cvss_score = None
        for key in ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2"]:
            if key in metrics and metrics[key]:
                cvss_score = metrics[key][0].get("cvssData", {}).get("baseScore")
                break

        references = [r.get("url", "") for r in cve.get("references", [])[:3]]

        documents.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"nvd_{cve_id}")),
            "title": cve_id,
            "content": f"{cve_id}: {description}",
            "source": "NVD",
            "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "tags": ["cve", "vulnerability"],
            "metadata": {"cvss_score": cvss_score, "references": references},
        })

        try:
            await create_cve_node(cve_id, description[:500], cvss_score)
        except Exception as exc:
            logger.warning("neo4j_cve_node_failed", cve_id=cve_id, error=str(exc))

    if documents:
        count = await upsert_documents(documents)
        logger.info("nvd_ingestion_complete", count=count, keyword=keyword)
        return count
    return 0
