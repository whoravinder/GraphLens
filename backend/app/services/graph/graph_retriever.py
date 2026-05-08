import re
from app.config import get_settings
from app.services.graph.neo4j_client import run_query
import structlog

logger = structlog.get_logger(__name__)
settings = get_settings()


class GraphRetriever:
    async def get_context_for_input(self, input_text: str) -> dict:
        if not settings.ENABLE_GRAPHRAG:
            return {"nodes": [], "relationships": [], "summary": "GraphRAG disabled"}

        cve_ids = re.findall(r"CVE-\d{4}-\d+", input_text, re.IGNORECASE)
        ip_addresses = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", input_text)

        nodes: list[dict] = []
        relationships: list[dict] = []
        summary_parts: list[str] = []

        for cve_id in cve_ids[:3]:
            try:
                records = await run_query(
                    f"MATCH (c:CVE {{cve_id: $cve_id}})-[r]-(n) RETURN c, r, n LIMIT {settings.GRAPH_MAX_RELATIONS}",
                    {"cve_id": cve_id.upper()},
                )
                for rec in records:
                    if rec.get("c"):
                        nodes.append({"type": "CVE", "id": cve_id, "properties": dict(rec["c"])})
                    if rec.get("n"):
                        n = rec["n"]
                        nodes.append({"type": list(n.labels)[0] if n.labels else "Unknown", "properties": dict(n)})
                    if rec.get("r"):
                        r = rec["r"]
                        relationships.append({"type": r.type})
                if records:
                    summary_parts.append(f"CVE {cve_id} found with {len(records)} relationships")
            except Exception as exc:
                logger.warning("graph_cve_lookup_failed", cve_id=cve_id, error=str(exc))

        try:
            recent_records = await run_query(
                "MATCH (i:Incident) RETURN i ORDER BY i.updated_at DESC LIMIT 5"
            )
            for rec in recent_records:
                if rec.get("i"):
                    nodes.append({"type": "Incident", "properties": dict(rec["i"])})
            if recent_records:
                summary_parts.append(f"Found {len(recent_records)} recent incidents in graph")
        except Exception as exc:
            logger.warning("graph_recent_incidents_failed", error=str(exc))

        return {
            "nodes": nodes[:settings.MAX_GRAPH_NODES],
            "relationships": relationships[:settings.GRAPH_MAX_RELATIONS],
            "cves_found": cve_ids,
            "ip_addresses_found": ip_addresses[:10],
            "summary": "; ".join(summary_parts) if summary_parts else "No matching graph entities found",
        }

    async def execute_graph_query(
        self,
        query: str,
        depth: int | None = None,
        limit: int | None = None,
        node_types: list[str] | None = None,
    ) -> dict:
        safe_depth = min(depth if depth is not None else settings.GRAPH_MAX_DEPTH, settings.GRAPH_MAX_DEPTH)
        safe_limit = min(limit if limit is not None else settings.GRAPH_MAX_RELATIONS, settings.MAX_GRAPH_NODES)

        if re.match(r"^\s*MATCH", query, re.IGNORECASE):
            cypher = query
        else:
            type_filter = ""
            if node_types:
                type_filter = f"WHERE any(label IN labels(n) WHERE label IN {node_types})"
            where_clause = ""
            if query:
                where_clause = "WHERE n.title CONTAINS $query OR n.name CONTAINS $query OR n.cve_id CONTAINS $query"
            
            cypher = f"""
                MATCH (n) {type_filter}
                {where_clause}
                OPTIONAL MATCH path = (n)-[*1..{safe_depth}]-(m)
                RETURN nodes(path) as nodes, relationships(path) as rels, n
                LIMIT {safe_limit}
            """

        try:
            records = await run_query(cypher, {"query": query})
        except Exception as exc:
            logger.warning("graph_query_failed", error=str(exc))
            records = []

        nodes_set: dict[str, dict] = {}
        rels_list: list[dict] = []

        for record in records:
            if record.get("n"):
                n = record["n"]
                nid = str(dict(n).get("node_id", dict(n).get("id", str(id(n)))))
                nodes_set[nid] = {"id": nid, "labels": list(n.labels), "properties": dict(n)}
            
            for node in record.get("nodes", []) or []:
                nid = str(dict(node).get("node_id", dict(node).get("id", str(id(node)))))
                nodes_set[nid] = {"id": nid, "labels": list(node.labels), "properties": dict(node)}
            
            for rel in record.get("rels", []) or []:
                rels_list.append({
                    "id": str(rel.element_id),
                    "type": rel.type,
                    "start_node": str(rel.start_node.element_id),
                    "end_node": str(rel.end_node.element_id),
                    "properties": dict(rel),
                })

        node_list = list(nodes_set.values())[:settings.MAX_GRAPH_NODES]
        return {
            "nodes": node_list,
            "relationships": rels_list[:settings.GRAPH_MAX_RELATIONS],
            "total_nodes": len(node_list),
            "total_relationships": len(rels_list),
            "query_used": cypher,
        }
