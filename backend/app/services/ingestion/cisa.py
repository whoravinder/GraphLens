import httpx
import os
import structlog
from app.services.rag.vector_store import upsert_documents
import uuid

logger = structlog.get_logger(__name__)

CISA_KEV_URL = os.environ.get('CISA_KEV_URL', 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')
MITRE_ATTACK_URL = os.environ.get('MITRE_ATTACK_URL', 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json')


async def ingest_cisa_kev() -> int:
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.get(CISA_KEV_URL)
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            logger.error("cisa_kev_fetch_failed", error=str(exc))
            return 0

    vulnerabilities = data.get("vulnerabilities", [])
    documents = []
    for vuln in vulnerabilities[:500]:
        cve_id = vuln.get("cveID", "")
        product = vuln.get("product", "")
        vendor = vuln.get("vendorProject", "")
        description = vuln.get("shortDescription", "")
        action = vuln.get("requiredAction", "")
        due_date = vuln.get("dueDate", "")

        documents.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"cisa_{cve_id}")),
            "title": f"CISA KEV: {cve_id} - {product}",
            "content": f"{cve_id} ({vendor} {product}): {description} Required action: {action} Due: {due_date}",
            "source": "CISA_KEV",
            "url": f"https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
            "tags": ["kev", "cve", "cisa", "exploited"],
            "metadata": {"vendor": vendor, "product": product, "due_date": due_date},
        })

    if documents:
        count = await upsert_documents(documents)
        logger.info("cisa_kev_ingestion_complete", count=count)
        return count
    return 0


async def ingest_mitre_attack() -> int:
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            response = await client.get(MITRE_ATTACK_URL)
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            logger.error("mitre_attack_fetch_failed", error=str(exc))
            return 0

    objects = data.get("objects", [])
    techniques = [o for o in objects if o.get("type") == "attack-pattern"]

    documents = []
    for technique in techniques[:300]:
        technique_id = ""
        for ext_ref in technique.get("external_references", []):
            if ext_ref.get("source_name") == "mitre-attack":
                technique_id = ext_ref.get("external_id", "")
                break

        name = technique.get("name", "")
        description = technique.get("description", "")[:600]
        kill_chain = [kcp.get("phase_name", "") for kcp in technique.get("kill_chain_phases", [])]

        documents.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"mitre_{technique_id}")),
            "title": f"MITRE ATT&CK {technique_id}: {name}",
            "content": f"{technique_id} {name}: {description}",
            "source": "MITRE_ATTACK",
            "url": f"https://attack.mitre.org/techniques/{technique_id.replace('.', '/')}",
            "tags": ["mitre", "attack", "technique"] + kill_chain,
            "metadata": {"technique_id": technique_id, "kill_chain_phases": kill_chain},
        })

    if documents:
        count = await upsert_documents(documents)
        logger.info("mitre_ingestion_complete", count=count)
        return count
    return 0
