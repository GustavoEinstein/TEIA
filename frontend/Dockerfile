# =============================================================================
# TEIA Frontend - Multi-stage Dockerfile (Production Hardened)
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM node:21-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY .env.production .env
COPY . .

RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2: Runtime - Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

RUN apk add --no-cache curl

# Criar utilizador e grupo se não existirem e ajustar pastas do Nginx
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S -G appgroup -h /app appuser

# Copiar build do frontend
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Ajustar permissões das pastas do Nginx para o utilizador appuser escrever o PID e logs
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d

# Criar o ficheiro nginx.pid vazio com permissão para o appuser gerir
RUN touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid

# Mudar para utilizador não-root
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]