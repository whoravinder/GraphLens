from pydantic import BaseModel, Field


class GraphQueryRequest(BaseModel):
    query: str = Field("", min_length=0, max_length=2048, description="Natural language or Cypher query")
    depth: int = Field(2, ge=1, le=5, description="Relationship traversal depth")
    limit: int = Field(25, ge=1, le=100, description="Max nodes to return")
    node_types: list[str] | None = Field(None, description="Filter by node types: incident, device, cve, alert")


class GraphNode(BaseModel):
    id: str
    labels: list[str]
    properties: dict


class GraphRelationship(BaseModel):
    id: str
    type: str
    start_node: str
    end_node: str
    properties: dict


class GraphQueryResult(BaseModel):
    nodes: list[GraphNode]
    relationships: list[GraphRelationship]
    total_nodes: int
    total_relationships: int
    query_used: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1024)
    search_type: str = Field("hybrid", description="hybrid | semantic | keyword")
    top_k: int = Field(10, ge=1, le=50)
    filters: dict | None = None


class SearchResult(BaseModel):
    id: str
    title: str
    excerpt: str
    score: float
    source: str
    metadata: dict | None = None
