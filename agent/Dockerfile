# syntax=docker/dockerfile:1
ARG PYTHON_VERSION=3.12
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

ENV PYTHONUNBUFFERED=1

# Cache bust: v2

FROM base AS deps

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-install-project

FROM deps AS builder

WORKDIR /app

COPY . .

RUN date > /app/.build-timestamp && cat /app/.build-timestamp

RUN uv sync --frozen --no-install-project
RUN uv pip install --system --no-cache-dir playwright
RUN playwright install --with-deps chromium

FROM base AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

RUN if [ -d /app/agent/src ] && [ ! -d /app/src ]; then ln -s /app/agent/src /app/src; fi

ENV PATH="/app/.venv/bin:$PATH"

ARG BUILD_ID=3
ENV BUILD_ID=${BUILD_ID}

EXPOSE 8080

CMD ["python", "src/agent.py", "start"]
