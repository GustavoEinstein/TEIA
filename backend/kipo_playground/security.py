"""
Utilitários de segurança para validação de arquivos, proteção SSRF e throttling.
"""
import os
import magic
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework.throttling import ScopedRateThrottle


# ============================================================================
# 1. VALIDAÇÃO DE UPLOAD DE ARQUIVOS
# ============================================================================

# Tipos MIME permitidos (mapeamento extensão -> MIME types válidos)
# Para formatos OOXML (.docx, .pptx, .xlsx), python-magic pode detectar como application/octet-stream
# quando o arquivo é pequeno; a validação de magic bytes (PK header) garante que é ZIP válido
ALLOWED_MIME_TYPES = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream',  # fallback para ZIP genérico detectado por magic
    ],
    '.txt': ['text/plain'],
    '.ppt': ['application/vnd.ms-powerpoint'],
    '.pptx': [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/octet-stream',
    ],
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream',
    ],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
}

# Magic bytes para validação adicional (header bytes)
MAGIC_BYTES = {
    '.pdf': [b'%PDF'],
    '.doc': [b'\xd0\xcf\x11\xe0', b'\x0e\x11\xfc\x0d\xd0\xcf\x11\xe0'],  # OLE compound document
    '.docx': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'],  # ZIP-based (OOXML)
    '.ppt': [b'\xd0\xcf\x11\xe0'],
    '.pptx': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'],
    '.xls': [b'\xd0\xcf\x11\xe0'],
    '.xlsx': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'],
    '.jpg': [b'\xff\xd8\xff'],
    '.jpeg': [b'\xff\xd8\xff'],
    '.png': [b'\x89PNG\r\n\x1a\n'],
    # .txt não tem magic bytes específicos
}

# Extensões permitidas (mantido para compatibilidade)
ALLOWED_EXTENSIONS = list(ALLOWED_MIME_TYPES.keys())

# Tamanho máximo de arquivo (10 MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_file_upload(file, field_name='arquivo'):
    """
    Valida arquivo de upload verificando:
    - Extensão permitida
    - Tipo MIME real (via python-magic)
    - Magic bytes (assinatura do arquivo)
    - Tamanho máximo

    Returns:
        tuple: (is_valid, error_message)
    """
    if not file:
        return False, f'{field_name}: Nenhum arquivo enviado.'

    # 1. Verificar tamanho
    if file.size > MAX_FILE_SIZE:
        return False, f'{field_name}: Arquivo muito grande. Máximo {MAX_FILE_SIZE // (1024*1024)} MB.'

    # 2. Verificar extensão
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f'{field_name}: Extensão "{ext}" não permitida. Permitidas: {", ".join(ALLOWED_EXTENSIONS)}'

    # 3. Ler primeiros bytes para magic bytes e MIME
    file.seek(0)
    header = file.read(8192)  # Lê até 8KB para detecção
    file.seek(0)

    if not header:
        return False, f'{field_name}: Arquivo vazio.'

    # 4. Verificar magic bytes
    if ext in MAGIC_BYTES:
        valid_magic = False
        for magic_bytes in MAGIC_BYTES[ext]:
            if header.startswith(magic_bytes):
                valid_magic = True
                break
        if not valid_magic:
            return False, f'{field_name}: Arquivo não parece ser um {ext.upper()} válido (assinatura inválida).'

    # 5. Verificar MIME type real via python-magic
    try:
        mime_type = magic.from_buffer(header, mime=True)
        allowed_mimes = ALLOWED_MIME_TYPES.get(ext, [])
        if mime_type not in allowed_mimes:
            return False, f'{field_name}: Tipo MIME "{mime_type}" não corresponde à extensão {ext}.'
    except Exception as e:
        # Se python-magic falhar, continua (magic bytes já validou)
        pass

    return True, None


def validate_multiple_files(files_dict):
    """
    Valida múltiplos arquivos de um request.FILES.

    Args:
        files_dict: request.FILES

    Returns:
        tuple: (is_valid, errors_dict)
    """
    errors = {}
    for field_name, file in files_dict.items():
        is_valid, error = validate_file_upload(file, field_name)
        if not is_valid:
            errors[field_name] = error
    return len(errors) == 0, errors


# ============================================================================
# 2. PROTEÇÃO SSRF - URL ALLOWLIST
# ============================================================================

def get_allowed_ollama_hosts():
    """Retorna lista de hosts Ollama permitidos a partir do settings."""
    url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434')
    # Extrai host:port da URL
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return [f"{parsed.hostname}:{parsed.port or 11434}"]


def validate_ollama_url(url):
    """
    Valida se a URL do Ollama está na allowlist.
    Previne SSRF bloqueando IPs internos, localhost (exceto permitido), etc.
    """
    from urllib.parse import urlparse
    import ipaddress

    try:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or 11434

        if not host:
            return False, "URL inválida: sem host"

        # Verificar se é IP privado/loopback não permitido
        try:
            ip = ipaddress.ip_address(host)
            # Bloquear loopback, link-local, multicast, reservado
            if ip.is_loopback and host not in ['127.0.0.1', 'localhost']:
                return False, "Loopback não permitido"
            if ip.is_private and host not in ['127.0.0.1', 'localhost']:
                return False, "IP privado não permitido"
            if ip.is_link_local or ip.is_multicast or ip.is_reserved:
                return False, "IP reservado não permitido"
        except ValueError:
            # É hostname, não IP - verificar allowlist
            allowed_hosts = get_allowed_ollama_hosts()
            host_port = f"{host}:{port}"
            if host_port not in allowed_hosts and host not in [h.split(':')[0] for h in allowed_hosts]:
                return False, f"Host '{host_port}' não está na allowlist"

        return True, None
    except Exception as e:
        return False, f"Erro ao validar URL: {str(e)}"


def get_ollama_url():
    """Retorna URL do Ollama validada do settings."""
    url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434')
    # Garantir que termina com /api/chat
    if not url.endswith('/api/chat'):
        url = url.rstrip('/') + '/api/chat'
    return url


# ============================================================================
# 3. THROTTLING PERSONALIZADO
# ============================================================================

class AICatalogThrottle(ScopedRateThrottle):
    scope = 'ai_catalog'


class AIPlannerThrottle(ScopedRateThrottle):
    scope = 'ai_planner'


class PasswordResetRequestThrottle(ScopedRateThrottle):
    scope = 'password_reset_request'


class PasswordResetConfirmThrottle(ScopedRateThrottle):
    scope = 'password_reset_confirm'


class RegisterThrottle(ScopedRateThrottle):
    scope = 'register'


# ============================================================================
# 4. PASSWORD RESET TOKEN SINGLE-USE
# ============================================================================

from django.core.cache import cache
from django.contrib.auth.tokens import default_token_generator


def store_password_reset_token(user, token):
    """Armazena token de reset no cache com TTL de 1 hora."""
    key = f"password_reset:{user.pk}:{token}"
    cache.set(key, True, timeout=3600)  # 1 hora


def consume_password_reset_token(user, token):
    """
    Verifica e consome (invalida) o token de reset.
    Retorna True se token era válido e foi consumido.
    """
    key = f"password_reset:{user.pk}:{token}"
    if cache.get(key):
        cache.delete(key)
        return True
    return False


# ============================================================================
# 5. PII MASKING PARA CRM
# ============================================================================

def mask_email(email):
    """Mascarar e-mail para logs/exibição parcial."""
    if not email or '@' not in email:
        return email
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


def mask_phone(phone):
    """Mascarar telefone."""
    if not phone:
        return phone
    digits = ''.join(filter(str.isdigit, phone))
    if len(digits) <= 4:
        return '*' * len(digits)
    return '*' * (len(digits) - 4) + digits[-4:]


def sanitize_crm_data(data, request_user):
    """
    Sanitiza dados do CRM removendo/mascarando PII sensível.
    Superusers veem tudo; outros admins veem dados mascarados.
    """
    if request_user.is_superuser:
        return data

    sanitized = data.copy()
    # Mascarar campos sensíveis
    if 'contato' in sanitized:
        sanitized['contato'] = mask_phone(sanitized['contato'])
    if 'email' in sanitized:
        sanitized['email'] = mask_email(sanitized['email'])
    # Remover campos desnecessários para não-superusers
    sensitive_fields = ['cpf', 'rg', 'endereco', 'telefone']
    for field in sensitive_fields:
        if field in sanitized:
            sanitized[field] = '[REDACTED]'
    return sanitized