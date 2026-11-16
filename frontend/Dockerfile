# =============================================================================
# TEIA Frontend - Multi-stage Dockerfile (Production Hardened)
# =============================================================================
# Stage 1: Builder - Install dependencies and build Vite app
# Stage 2: Runtime - Nginx serving static files with non-root user
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM node:21-alpine AS builder

# Instalar dependências de build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files primeiro (cache de layer)
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci --prefer-offline --no-audit

# Copiar código fonte
COPY . .

# Build da aplicação (produção)
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2: Runtime - Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Instalar curl para health check
RUN apk add --no-cache curl

# Criar usuário não-root para nginx
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S -G appgroup -h /app appuser

# Copiar build do frontend
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY --chown=root:root nginx.conf /etc/nginx/nginx.conf
COPY --chown=root:root default.conf /etc/nginx/conf.d/default.conf

# Criar diretórios necessários para nginx (cache, pid, etc.) com permissões corretas
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx

# Mudar para usuário não-root
USER appuser

# Expor porta (nginx roda em porta não privilegiada)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]