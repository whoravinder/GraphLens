import os

from neo4j import AsyncGraphDatabase, AsyncDriver
import structlog

logger = structlog.get_logger(__name__)

AUTO_CREATE_INDEXES = os.environ.get('AUTO_CREATE_INDEXES', 'true').lower() == 'true'

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        neo4j_uri = os.getenv("NEO4J_URI")
        neo4j_user = os.getenv("NEO4J_USER")
        neo4j_password = os.getenv("NEO4J_PASSWORD")
        if not neo4j_uri or not neo4j_user or not neo4j_password:
            raise RuntimeError("NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables are required")
        _driver = AsyncGraphDatabase.driver(
            neo4j_uri,
            auth=(neo4j_user, neo4j_password),
            max_connection_pool_size=50,
        )
    return _driver


async def close_driver() -> None:
    global _driver
    if _driver:
        await _driver.close()
        _driver = None


async def verify_connectivity() -> bool:
    try:
        driver = get_driver()
        await driver.verify_connectivity()
        return True
    except Exception as exc:
        logger.warning("neo4j_connectivity_failed", error=str(exc))
        return False


async def run_query(cypher: str, params: dict | None = None) -> list[dict]:
    driver = get_driver()
    async with driver.session() as session:
        result = await session.run(cypher, params or {})
        records = [dict(record) async for record in result]
        return records


async def create_incident_node(incident_id: str, title: str, severity: str, tags: list[str] | None = None) -> str:
    node_id = f"incident_{incident_id}"
    await run_query(
        """
        MERGE (i:Incident {node_id: $node_id})
        SET i.id = $id, i.title = $title, i.severity = $severity, i.tags = $tags, i.updated_at = datetime()
        """,
        {"node_id": node_id, "id": incident_id, "title": title, "severity": severity, "tags": tags or []},
    )
    return node_id


async def create_cve_node(cve_id: str, description: str, cvss_score: float | None) -> str:
    node_id = f"cve_{cve_id}"
    await run_query(
        """
        MERGE (c:CVE {cve_id: $cve_id})
        SET c.node_id = $node_id, c.description = $description, c.cvss_score = $cvss_score
        """,
        {"node_id": node_id, "cve_id": cve_id, "description": description, "cvss_score": cvss_score},
    )
    return node_id


async def link_incident_to_cve(incident_node_id: str, cve_node_id: str) -> None:
    await run_query(
        """
        MATCH (i:Incident {node_id: $incident_node_id})
        MATCH (c:CVE {node_id: $cve_node_id})
        MERGE (i)-[:AFFECTED_BY]->(c)
        """,
        {"incident_node_id": incident_node_id, "cve_node_id": cve_node_id},
    )


async def get_incident_neighbors(node_id: str, depth: int = 2) -> dict:
    records = await run_query(
        """
        MATCH path = (n {node_id: $node_id})-[*1..$depth]-(m)
        RETURN nodes(path) as nodes, relationships(path) as rels
        LIMIT 100
        """,
        {"node_id": node_id, "depth": depth},
    )
    nodes_set = {}
    rels_list = []
    for record in records:
        for node in record.get("nodes", []):
            nid = str(dict(node).get("node_id", id(node)))
            nodes_set[nid] = {"id": nid, "labels": list(node.labels), "properties": dict(node)}
        for rel in record.get("rels", []):
            rels_list.append({
                "id": str(rel.element_id),
                "type": rel.type,
                "start_node": str(rel.start_node.element_id),
                "end_node": str(rel.end_node.element_id),
                "properties": dict(rel),
            })
    return {"nodes": list(nodes_set.values()), "relationships": rels_list}


async def setup_constraints() -> None:
    if not AUTO_CREATE_INDEXES:
        return
    queries = [
        "CREATE CONSTRAINT incident_node_id IF NOT EXISTS FOR (i:Incident) REQUIRE i.node_id IS UNIQUE",
        "CREATE CONSTRAINT cve_id IF NOT EXISTS FOR (c:CVE) REQUIRE c.cve_id IS UNIQUE",
        "CREATE CONSTRAINT device_id IF NOT EXISTS FOR (d:Device) REQUIRE d.device_id IS UNIQUE",
    ]
    for query in queries:
        try:
            await run_query(query)
        except Exception as exc:
            logger.warning("constraint_setup_skipped", query=query, error=str(exc))
