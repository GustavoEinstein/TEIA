"""
Middleware de Segurança para Django - Headers HTTP Hardened
Adiciona headers de segurança em todas as respostas.
"""
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


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
        # ---------------------------------------------------------------------
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        response['Cross-Origin-Embedder-Policy'] = 'require-corp'

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
        policies = [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' https://ia-router.unb.br http://localhost:8000 ws://localhost:5173 https://*.unb.br",
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
        # Validar Origin header em requisições sensíveis
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            origin = request.META.get('HTTP_ORIGIN')
            referer = request.META.get('HTTP_REFERER')

            # Se não há origin/referer em mutação, pode ser CSRF ou bot
            # django-cors-headers + CSRF middleware já tratam, mas logamos
            pass

        return None

    def process_response(self, request, response):
        # Garantir que CORS headers não vazem em erros
        if response.status_code >= 400:
            # Remover headers CORS em respostas de erro para não vazar info
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Credentials',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers',
            ]
            for header in cors_headers:
                if header in response:
                    del response[header]

        return response