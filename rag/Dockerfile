# ============================================
# Stage 1: Build dependencies
# ============================================
FROM python:3.10-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=300 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system deps needed for psycopg2 build
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 2: Runtime (minimal)
# ============================================
FROM python:3.10-slim AS final

# Add labels
LABEL maintainer="EduMind Team" \
      app="edumind-rag" \
      version="1.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install only runtime lib (not compiler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy source code
COPY . .

# Ensure data directory exists, scripts are executable, and permissions are set
RUN mkdir -p /app/data && \
    chmod +x /app/start.sh && \
    chown -R appuser:appgroup /app

EXPOSE 8000

# Health check
# HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
#     CMD curl -f http://localhost:8000/docs || exit 1

# Switch to non-root user
USER appuser

CMD ["./start.sh"]
