"""
Django settings for TCC_DjangoScrumKipo project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Constrói os caminhos base do projeto. BASE_DIR = .../TEIA/backend
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-substitua-esta-chave-em-producao')

# LLM Provider: 'local' (Ollama), 'unb' (LiteLLM UnB), ou 'gemini'
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'local')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# SECURITY WARNING: don't run with debug turned on in production!
# Puxa o valor do .env (Se não achar, o padrão é False para segurança)
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Lê do .env (Ex: 164.41.76.34/28,localhost,127.0.0.1) e transforma em lista
# Padrão seguro para desenvolvimento local
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Bibliotecas de Terceiros
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Para blacklist de refresh tokens rotacionados
    'corsheaders',

    # O seu App
    'kipo_playground',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # CORS DEVE VIR NO TOPO PARA O REACT
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'TCC_DjangoScrumKipo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'TCC_DjangoScrumKipo.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True


# ============================================================================
# ARQUIVOS ESTÁTICOS (CSS, JS, Imagens, Logo da UnB)
# ============================================================================
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'kipo_playground', 'static')
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================================
# 1. CONFIGURAÇÕES DO REST FRAMEWORK E AUTENTICAÇÃO JWT
# ============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'login_attempts': '10/m',
        'ai_catalog': '20/h',           # Catálogo IA: 20 req/hora por usuário
        'ai_planner': '10/h',           # Planejador IA: 10 req/hora por usuário
        'password_reset_request': '3/h', # Reset senha request: 3/hora por IP
        'password_reset_confirm': '5/h', # Reset senha confirm: 5/hora por IP
        'register': '5/h',              # Registro: 5/hora por IP
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=45),      # 45 minutos
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),         # 7 dias
    'ROTATE_REFRESH_TOKENS': True,                       # Rotaciona a cada uso
    'BLACKLIST_AFTER_ROTATION': True,                    # Invalida refresh tokens antigos
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ============================================================================
# 2. CONFIGURAÇÕES DO CORS (Para o React conseguir consumir a API)
# ============================================================================
# CORS_ALLOW_ALL_ORIGINS = True  # REMOVIDO: inseguro para produção
# Origens permitidas (Lê do .env, ex: http://localhost:5173,https://teia.unb.br)
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')

# Origens confiáveis para CSRF (Lê do .env, ex: https://teia.unb.br,http://localhost:8000)
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:8000,http://127.0.0.1:8000').split(',')


# ============================================================================
# 5. CONFIGURAÇÕES DE SEGURANÇA DE COOKIES E HTTPS
# ============================================================================
# Em produção (DEBUG=False): cookies seguros, SameSite=Strict, HSTS
# Em desenvolvimento (DEBUG=True): cookies lax para funcionar em localhost HTTP
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = 'Strict'
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 ano
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
else:
    # Desenvolvimento local: cookies funcionam em HTTP localhost
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = 'Lax'


# ============================================================================
# 3. CONFIGURAÇÕES DE ARQUIVOS (MEDIA FILES: Uploads de PDF, Docs, etc)
# ============================================================================
# A URL pública pelo qual o navegador e o React vão acessar o arquivo
MEDIA_URL = '/media/'

# O caminho FÍSICO exato no seu servidor/Docker
# Vai gerar exatamente: .../backend/kipo_playground/media
MEDIA_ROOT = os.path.join(BASE_DIR, 'kipo_playground', 'media')


# ============================================================================
# 4. CONFIGURAÇÕES DE E-MAIL (Recuperação de Senha)
# ============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True      # Porta 587 usa STARTTLS
EMAIL_USE_SSL = False     # SSL implícito usa porta 465

# Puxando as credenciais de forma segura do arquivo .env!
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL')

# Configurações do modelo local (Ollama)
LOCAL_LLM_URL = os.getenv('LOCAL_LLM_URL', 'http://127.0.0.1:11434/v1')
LOCAL_LLM_MODEL = os.getenv('LOCAL_LLM_MODEL', 'qwen3:8b')
LOCAL_LLM_TIMEOUT = 90

# Configurações do provedor UnB (LiteLLM)
UNB_LLM_URL = os.getenv('UNB_LLM_URL', 'https://ia-router.unb.br/v1/')
UNB_LLM_MODEL = os.getenv('UNB_LLM_MODEL', 'UnB-Llama-3.3-70B-Instruct')
UNB_API_KEY = os.getenv('UNB_API_KEY', '')

# Frontend URL (para links de reset de senha, etc.)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')