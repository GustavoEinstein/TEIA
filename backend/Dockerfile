# =============================================================================
# TEIA Backend - Multi-stage Dockerfile (Production Hardened)
# =============================================================================
# Stage 1: Builder - Install dependencies and compile
# Stage 2: Runtime - Minimal image with non-root user
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS builder

# Instalar dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para build
RUN useradd --no-create-home --uid 1000 --shell /bin/bash appuser

WORKDIR /app

# Copiar apenas requirements primeiro (cache de layer)
COPY requirements.txt .

# Instalar dependências Python em diretório isolado
RUN pip install --no-cache-dir --user -r requirements.txt

# Instalar gunicorn
RUN pip install --no-cache-dir --user gunicorn

# Copiar código da aplicação
COPY --chown=appuser:appuser . .

# -----------------------------------------------------------------------------
# STAGE 2: Runtime
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# Instalar apenas dependências de runtime necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libharfbuzz-subset0 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    libmagic1 \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root com UID/GID fixos
RUN groupadd --gid 1000 appgroup && \
    useradd --no-create-home --uid 1000 --gid 1000 --shell /bin/bash --home-dir /app appuser

WORKDIR /app

# Copiar dependências Python do builder (instaladas com --user)
COPY --from=builder /root/.local /home/appuser/.local

# Copiar código da aplicação
COPY --from=builder --chown=appuser:appgroup /app /app

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /app/staticfiles /app/kipo_playground/media /app/database && \
    chown -R appuser:appgroup /app

# Variáveis de ambiente para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/appuser/.local/bin:${PATH}" \
    HOME=/app

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Comando de inicialização
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "TCC_DjangoScrumKipo.wsgi:application"]