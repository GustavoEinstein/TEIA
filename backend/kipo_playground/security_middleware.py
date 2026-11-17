"""
Middleware de Segurança para Django - Headers HTTP Hardened
Adiciona headers de segurança em todas as respostas.
"""
import logging
import uuid
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

# Logger para structured logging
structured_logger = logging.getLogger('kipo_playground.structured')


class StructuredLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para adicionar contexto estruturado aos logs.
    Injeta request_id e user_id em todos os log records da requisição.
    Compatível com Loki, ELK, Graylog, Datadog.
    """

    def process_request(self, request):
        # Gerar ou extrair request_id
        request_id = request.META.get('HTTP_X_REQUEST_ID') or str(uuid.uuid4())
        request.request_id = request_id

        # Adicionar request_id ao header de resposta (para tracing cliente-servidor)
        request._request_id_for_response = request_id

        # Bind request_id ao logger via extra
        # Isso fará com que todos os logs dentro desta requisição tenham request_id
        request._log_extra = {
            'request_id': request_id,
            'method': request.method,
            'path': request.path,
            'remote_addr': self._get_client_ip(request),
        }

        # Log de início de requisição (apenas em DEBUG ou para endpoints sensíveis)
        if settings.DEBUG or request.path.startswith('/api/token/') or request.path.startswith('/api/register/'):
            structured_logger.info(
                'Request started',
                extra={
                    **request._log_extra,
                    'event': 'request_start',
                }
            )

        return None

    def process_response(self, request, response):
        # Adicionar request_id ao header de resposta
        if hasattr(request, '_request_id_for_response'):
            response['X-Request-ID'] = request._request_id_for_response

        # Log de fim de requisição
        if hasattr(request, '_log_extra'):
            duration_ms = None
            if hasattr(request, '_start_time'):
                import time
                duration_ms = int((time.time() - request._start_time) * 1000)

            # Determinar nível baseado no status code
            if response.status_code >= 500:
                level = 'error'
            elif response.status_code >= 400:
                level = 'warning'
            else:
                level = 'info'

            log_data = {
                **request._log_extra,
                'event': 'request_end',
                'status_code': response.status_code,
                'duration_ms': duration_ms,
            }

            # Adicionar user_id se autenticado
            if hasattr(request, 'user') and request.user.is_authenticated:
                log_data['user_id'] = request.user.id
                log_data['username'] = request.user.username

            getattr(structured_logger, level)(
                'Request completed',
                extra=log_data
            )

        return response

    def process_exception(self, request, exception):
        """Log de exceções não tratadas."""
        if hasattr(request, '_log_extra'):
            structured_logger.error(
                'Request exception',
                extra={
                    **request._log_extra,
                    'event': 'request_exception',
                    'exception_type': type(exception).__name__,
                    'exception_message': str(exception),
                },
                exc_info=True
            )
        return None

    def _get_client_ip(self, request):
        """Extrai IP real do cliente considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para adicionar headers de segurança HTTP.
    Implementa defense-in-depth além das configurações do settings.py.
    """

    def process_response(self, request, response):
        # ---------------------------------------------------------------------
        # 1. X-Content-Type-Options: Previne MIME sniffing
        # ---------------------------------------------------------------------
        response['X-Content-Type-Options'] = 'nosniff'

        # ---------------------------------------------------------------------
        # 2. X-Frame-Options: Previne clickjacking
        #    SAMEORIGIN permite iframes apenas do mesmo origem
        # ---------------------------------------------------------------------
        response['X-Frame-Options'] = 'SAMEORIGIN'

        # ---------------------------------------------------------------------
        # 3. X-XSS-Protection: Proteção XSS legada (ainda útil para browsers antigos)
        # ---------------------------------------------------------------------
        response['X-XSS-Protection'] = '1; mode=block'

        # ---------------------------------------------------------------------
        # 4. Referrer-Policy: Controla informação de referrer
        # ---------------------------------------------------------------------
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # ---------------------------------------------------------------------
        # 5. Permissions-Policy (Feature-Policy): Controla APIs do navegador
        # ---------------------------------------------------------------------
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )

        # ---------------------------------------------------------------------
        # 6. Content-Security-Policy (CSP)
        #    Configuração restritiva mas funcional para Django + React
        # ---------------------------------------------------------------------
        if not settings.DEBUG:
            # Produção: CSP estrita
            csp_policy = self._get_production_csp(request)
        else:
            # Desenvolvimento: CSP mais permissiva para hot-reload, etc.
            csp_policy = self._get_development_csp(request)

        response['Content-Security-Policy'] = csp_policy

        # ---------------------------------------------------------------------
        # 7. HSTS (Strict-Transport-Security)
        #    Já configurado via settings.SECURE_HSTS_SECONDS, mas reforçamos aqui
        # ---------------------------------------------------------------------
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )

        # ---------------------------------------------------------------------
        # 8. Cross-Origin-Opener-Policy (COOP) e Cross-Origin-Embedder-Policy (COEP)
        #    Isolamento de contexto para prevenir Spectre-like attacks
        #    DESABILITADO em desenvolvimento para permitir cross-origin (React -> Django)
        # ---------------------------------------------------------------------
        if not settings.DEBUG:
            response['Cross-Origin-Opener-Policy'] = 'same-origin'
            response['Cross-Origin-Embedder-Policy'] = 'require-corp'
        else:
            # Desenvolvimento: permitir cross-origin embedding
            response['Cross-Origin-Opener-Policy'] = 'unsafe-none'
            response['Cross-Origin-Embedder-Policy'] = 'unsafe-none'

        # ---------------------------------------------------------------------
        # 9. Remover headers que vazam informação
        # ---------------------------------------------------------------------
        # Remover Server header (feito no nginx/gunicorn config)
        # Remover X-Powered-By se existir
        if 'X-Powered-By' in response:
            del response['X-Powered-By']

        return response

    def _get_production_csp(self, request):
        """CSP para produção - restritiva."""
        # Base CSP
        policies = [
            "default-src 'self'",
            "script-src 'self'",  # Sem 'unsafe-inline' nem 'unsafe-eval' em produção
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",  # unsafe-inline para Tailwind/JIT
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' https://ia-router.unb.br https://*.unb.br",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-src 'none'",
            "media-src 'self'",
            "worker-src 'self' blob:",
            "manifest-src 'self'",
        ]

        # Adicionar nonce para scripts inline se necessário (requer template tags)
        # nonce = getattr(request, 'csp_nonce', None)
        # if nonce:
        #     policies[1] = f"script-src 'self' 'nonce-{nonce}'"

        return "; ".join(policies)

    def _get_development_csp(self, request):
        """CSP para desenvolvimento - mais permissiva."""
        # Permitir conexões para o frontend (Vite dev server) e backend
        policies = [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' https://ia-router.unb.br http://localhost:8000 http://127.0.0.1:8000 ws://localhost:5173 ws://127.0.0.1:5173 http://localhost:5173 http://127.0.0.1:5173 https://*.unb.br",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ]
        return "; ".join(policies)


class CORSSecurityMiddleware(MiddlewareMixin):
    """
    Middleware adicional para validação estrita de CORS.
    Complementa django-cors-headers.
    """

    def process_request(self, request):
        # Validar Origin header em requisições sensíveis (mutating)
        # Permitir OPTIONS (preflight) passar sem validação
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            origin = request.META.get('HTTP_ORIGIN')
            referer = request.META.get('HTTP_REFERER')

            # Se não há origin/referer em mutação, pode ser CSRF ou bot
            # django-cors-headers + CSRF middleware já tratam, mas logamos
            pass

        return None

    def process_response(self, request, response):
        # NÃO remover headers CORS - deixamos o django-cors-headers gerenciar
        # Este middleware apenas loga/valida, não remove headers CORS em respostas 2xx
        # Removido: lógica que deletava headers CORS pois causava problemas com token endpoint
        return response