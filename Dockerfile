# SANTIS MASTER OS — Production Dockerfile
# Multi-stage build: Builder + Runtime

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıkları
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Güvenlik: root olmayan kullanıcı
RUN groupadd -r santis && useradd -r -g santis santis

WORKDIR /app

# Sistem bağımlılıkları (sadece runtime için)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Wheel'ları kopyala ve kur
COPY --from=builder /build/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Uygulama dosyalarını kopyala
COPY --chown=santis:santis . .

# Logs klasörü
RUN mkdir -p /app/logs && chown santis:santis /app/logs

# Kullanıcıya geç
USER santis

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Port
EXPOSE 8000

# Production start (--reload YOK, workers var)
CMD ["uvicorn", "server:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "4", \
    "--proxy-headers", \
    "--forwarded-allow-ips", "*"]
