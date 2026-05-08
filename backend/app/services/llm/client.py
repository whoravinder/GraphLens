from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from app.config import get_settings
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger(__name__)
settings = get_settings()

_llm: ChatOpenAI | None = None
_embeddings: OpenAIEmbeddings | None = None


def get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_retries=3,
        )
    return _llm


def get_embeddings() -> OpenAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        )
    return _embeddings


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = get_embeddings()
    return await embeddings.aembed_documents(texts)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def embed_query(text: str) -> list[float]:
    embeddings = get_embeddings()
    return await embeddings.aembed_query(text)
