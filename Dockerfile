# ==========================================
# Stage 1: Build Frontend (Next.js Standalone)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
# We set API_URL so the standalone server knows how to route internal requests if needed
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_URL=http://127.0.0.1:8000
RUN npm run build

# ==========================================
# Stage 2: Build Backend Dependencies
# ==========================================
FROM python:3.12-slim AS backend-builder
WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
# Create wheels to speed up final image installation and reduce size
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl nginx supervisor ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /app/wheels /wheels
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir /wheels/*

COPY backend/ /app/backend/

COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static

COPY nginx.cloudrun.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment Variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
