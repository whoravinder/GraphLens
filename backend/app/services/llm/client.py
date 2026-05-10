from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger(__name__)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
OPENAI_BASE_URL = os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')
LLM_MODEL = os.environ.get('LLM_MODEL', 'gpt-4o-mini')
LLM_TEMPERATURE = float(os.environ.get('LLM_TEMPERATURE', '0.1'))
LLM_MAX_TOKENS = int(os.environ.get('LLM_MAX_TOKENS', '4096'))
OPENAI_TIMEOUT_SECONDS = int(os.environ.get('OPENAI_TIMEOUT_SECONDS', '120'))
EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'text-embedding-3-small')
EMBEDDING_DIMENSIONS = int(os.environ.get('EMBEDDING_DIMENSIONS', '1536'))

_llm: ChatOpenAI | None = None
_embeddings: OpenAIEmbeddings | None = None


def get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=LLM_MODEL,
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_BASE_URL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            timeout=OPENAI_TIMEOUT_SECONDS,
            max_retries=3,
        )
    return _llm


def get_embeddings() -> OpenAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=EMBEDDING_MODEL,
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_BASE_URL,
            dimensions=EMBEDDING_DIMENSIONS,
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
