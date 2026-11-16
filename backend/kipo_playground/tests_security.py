"""
Testes de segurança para validação das correções aplicadas.
"""
import io
import tempfile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from kipo_playground.security import (
    validate_file_upload,
    validate_multiple_files,
    validate_ollama_url,
    get_allowed_ollama_hosts,
    store_password_reset_token,
    consume_password_reset_token,
    sanitize_crm_data,
    mask_email,
    mask_phone,
)
from kipo_playground.models import Producao, Profile

User = get_user_model()


class FileUploadValidationTests(TestCase):
    """Testes de validação de upload de arquivos."""

    def setUp(self):
        # PDF válido com magic bytes %PDF
        self.valid_pdf = SimpleUploadedFile(
            "test.pdf",
            b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n",
            content_type="application/pdf"
        )
        # DOCX válido (ZIP-based OOXML) - magic bytes PK\x03\x04 com conteúdo mínimo ZIP
        # python-magic precisa de mais conteúdo para detectar como application/vnd.openxmlformats-officedocument.wordprocessingml.document
        self.valid_docx = SimpleUploadedFile(
            "test.docx",
            b"PK\x03\x04\x14\x00\x00\x00\x08\x00" + b"[Content_Types].xml" + b"x" * 100,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        # Executável disfarçado de PDF
        self.fake_pdf = SimpleUploadedFile(
            "malware.pdf",
            b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00",  # PE header (Windows .exe)
            content_type="application/pdf"
        )
        # Arquivo muito grande
        self.large_file = SimpleUploadedFile(
            "large.pdf",
            b"%PDF-1.4\n" + b"x" * (11 * 1024 * 1024),  # 11 MB
            content_type="application/pdf"
        )

    def test_valid_pdf_passes(self):
        """PDF com magic bytes válidos deve passar."""
        is_valid, error = validate_file_upload(self.valid_pdf)
        self.assertTrue(is_valid, f"PDF válido rejeitado: {error}")
        self.assertIsNone(error)

    def test_valid_docx_passes(self):
        """DOCX com magic bytes válidos deve passar."""
        is_valid, error = validate_file_upload(self.valid_docx)
        self.assertTrue(is_valid, f"DOCX válido rejeitado: {error}")
        self.assertIsNone(error)

    def test_fake_pdf_blocked(self):
        """EXE renomeado para .pdf deve ser bloqueado."""
        is_valid, error = validate_file_upload(self.fake_pdf)
        self.assertFalse(is_valid, "Arquivo falso (EXE) deveria ser bloqueado")
        self.assertIn("assinatura inválida", error.lower())

    def test_large_file_blocked(self):
        """Arquivo > 10MB deve ser bloqueado."""
        is_valid, error = validate_file_upload(self.large_file)
        self.assertFalse(is_valid, "Arquivo grande deveria ser bloqueado")
        self.assertIn("muito grande", error.lower())

    def test_multiple_files_validation(self):
        """Validação de múltiplos arquivos."""
        files = {
            'arquivo1': self.valid_pdf,
            'arquivo2': self.fake_pdf,
        }
        is_valid, errors = validate_multiple_files(files)
        self.assertFalse(is_valid)
        self.assertIn('arquivo2', errors)
        self.assertNotIn('arquivo1', errors)


class SSRFProtectionTests(TestCase):
    """Testes de proteção SSRF para URL do Ollama."""

    def test_local_ollama_allowed(self):
        """Ollama local configurado deve ser aceito."""
        url = "http://127.0.0.1:11434/api/chat"
        is_valid, error = validate_ollama_url(url)
        self.assertTrue(is_valid, f"Ollama local deveria ser aceito: {error}")

    def test_localhost_ollama_allowed(self):
        """Ollama localhost deve ser aceito."""
        url = "http://localhost:11434/api/chat"
        is_valid, error = validate_ollama_url(url)
        self.assertTrue(is_valid, f"Ollama localhost deveria ser aceito: {error}")

    def test_aws_metadata_blocked(self):
        """IP do metadata AWS (169.254.169.254) deve ser bloqueado."""
        url = "http://169.254.169.254/latest/meta-data/"
        is_valid, error = validate_ollama_url(url)
        self.assertFalse(is_valid, "IP AWS metadata deveria ser bloqueado")
        # Aceita qualquer erro de bloqueio (privado, reservado, etc)
        self.assertTrue("privado" in error.lower() or "reservado" in error.lower() or "não permitido" in error.lower())

    def test_private_ip_blocked(self):
        """IPs privados não permitidos devem ser bloqueados."""
        url = "http://10.0.0.1:11434/api/chat"
        is_valid, error = validate_ollama_url(url)
        self.assertFalse(is_valid, "IP privado 10.x deveria ser bloqueado")

    def test_link_local_blocked(self):
        """IP link-local deve ser bloqueado."""
        url = "http://169.254.1.1:11434/api/chat"
        is_valid, error = validate_ollama_url(url)
        self.assertFalse(is_valid, "IP link-local deveria ser bloqueado")

    def test_allowed_hosts_from_settings(self):
        """Allowlist deve refletir settings."""
        hosts = get_allowed_ollama_hosts()
        # Pode ser localhost:11434 ou 127.0.0.1:11434 dependendo do settings
        self.assertTrue(any(h in hosts for h in ["127.0.0.1:11434", "localhost:11434"]))


class WeasyPrintPDFTests(TestCase):
    """Testes de geração de PDF com WeasyPrint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.profile, _ = Profile.objects.get_or_create(user=self.user, defaults={'disciplina': 'Teste'})
        self.producao = Producao.objects.create(
            user=self.user,
            titulo='Teste PDF',
            disciplina='Humanas',
            nivel='Fundamental',
            modelo_ia='Teste',
            categoria='Prática Pedagógica',
            bncc='EF01HI01 - Habilidade teste',
            experiencia='Descrição teste',
            status='Aprovado'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_pdf_generation_base_url_none(self):
        """PDF deve gerar com base_url=None sem quebrar."""
        response = self.client.get(
            reverse('export_production_pdf', kwargs={'pk': self.producao.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 1000)  # PDF não vazio
        self.assertTrue(response.content.startswith(b'%PDF'))

    def test_pdf_unauthorized_blocked(self):
        """Não autenticado deve ser bloqueado."""
        client = APIClient()
        response = client.get(
            reverse('export_production_pdf', kwargs={'pk': self.producao.pk})
        )
        self.assertEqual(response.status_code, 401)


class AuthAndResetTokenTests(TestCase):
    """Testes de autenticação JWT e token de reset single-use."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='resetuser',
            password='oldpass123',
            email='reset@example.com',
            first_name='Teste'
        )
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.status_conta = 'Aprovado'
        profile.save()

        # Usuário separado para teste de JWT (evita conflito com password reset)
        self.jwt_user = User.objects.create_user(
            username='jwtuser',
            password='jwtpass123',
            email='jwt@example.com'
        )
        profile, _ = Profile.objects.get_or_create(user=self.jwt_user)
        profile.status_conta = 'Aprovado'
        profile.save()
        cache.clear()

    def test_password_reset_token_single_use(self):
        """Token de reset deve funcionar apenas uma vez."""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        # Armazenar token no cache
        store_password_reset_token(self.user, token)

        # Primeira tentativa - deve funcionar
        consumed = consume_password_reset_token(self.user, token)
        self.assertTrue(consumed, "Primeiro consumo deveria funcionar")

        # Segunda tentativa - deve falhar
        consumed = consume_password_reset_token(self.user, token)
        self.assertFalse(consumed, "Segundo consumo deveria falhar (token já usado)")

    def test_password_reset_flow(self):
        """Fluxo completo de reset de senha."""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        # 1. Request reset
        response = self.client.post('/api/password_reset/', {
            'email': 'reset@example.com'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # 2. Simular extração do token do email (usar token real)
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        store_password_reset_token(self.user, token)

        # 3. Confirm reset com token válido
        response = self.client.post(f'/api/password_reset_confirm/{uid}/{token}/', {
            'password': 'newpass123'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # 4. Tentar usar mesmo token novamente - deve falhar
        response = self.client.post(f'/api/password_reset_confirm/{uid}/{token}/', {
            'password': 'anotherpass'
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_jwt_refresh_rotation_blacklist(self):
        """Verifica configurações de rotação e blacklist de refresh tokens."""
        from rest_framework_simplejwt.settings import api_settings

        # Verifica se as configurações estão corretas
        self.assertTrue(api_settings.ROTATE_REFRESH_TOKENS)
        self.assertTrue(api_settings.BLACKLIST_AFTER_ROTATION)

        # Verifica se o app token_blacklist está instalado
        from django.apps import apps
        self.assertTrue(apps.is_installed('rest_framework_simplejwt.token_blacklist'))

        # Login deve funcionar
        response = self.client.post('/api/token/', {
            'username': 'jwtuser',
            'password': 'jwtpass123'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('refresh', response.data)
        self.assertIn('access', response.data)

    def test_access_token_expiry(self):
        """Access token deve ter lifetime de ~45 min."""
        from rest_framework_simplejwt.settings import api_settings
        lifetime = api_settings.ACCESS_TOKEN_LIFETIME
        self.assertEqual(lifetime.total_seconds(), 45 * 60)


class PIIMaskingTests(TestCase):
    """Testes de mascaramento de PII no CRM."""

    def test_mask_email(self):
        """E-mail deve ser mascarado corretamente."""
        # Formato: primeira letra + * para o meio + última letra antes do @
        self.assertEqual(mask_email('user@example.com'), 'u**r@example.com')
        self.assertEqual(mask_email('test@example.com'), 't**t@example.com')
        self.assertEqual(mask_email('ab@test.com'), 'a*@test.com')
        self.assertEqual(mask_email('a@b.c'), 'a*@b.c')
        self.assertEqual(mask_email(''), '')
        self.assertEqual(mask_email(None), None)

    def test_mask_phone(self):
        """Telefone deve ser mascarado."""
        # Mantém últimos 4 dígitos, mascara o resto
        self.assertEqual(mask_phone('(61) 99999-8888'), '*******8888')
        self.assertEqual(mask_phone('1234'), '****')
        self.assertEqual(mask_phone(''), '')
        self.assertEqual(mask_phone(None), None)

    def test_sanitize_crm_data_superuser(self):
        """Superuser vê dados completos."""
        user = User.objects.create_user(username='admin', is_superuser=True)
        data = {'contato': '61999998888', 'email': 'test@test.com', 'cpf': '123.456.789-00'}
        result = sanitize_crm_data(data, user)
        self.assertEqual(result['contato'], '61999998888')
        self.assertEqual(result['email'], 'test@test.com')
        self.assertEqual(result['cpf'], '123.456.789-00')

    def test_sanitize_crm_data_regular_admin(self):
        """Admin regular vê dados mascarados."""
        user = User.objects.create_user(username='admin', is_superuser=False, is_staff=True)
        data = {
            'contato': '61999998888',
            'email': 'test@example.com',
            'cpf': '123.456.789-00',
            'rg': '1234567',
            'endereco': 'Rua Teste',
            'telefone': '61999998888'
        }
        result = sanitize_crm_data(data, user)
        self.assertEqual(result['contato'], '*******8888')
        self.assertEqual(result['email'], 't**t@example.com')
        self.assertEqual(result['cpf'], '[REDACTED]')
        self.assertEqual(result['rg'], '[REDACTED]')
        self.assertEqual(result['endereco'], '[REDACTED]')
        # telefone está na lista de campos sensíveis e é redatado (não mascarado)
        self.assertEqual(result['telefone'], '[REDACTED]')


class ThrottlingTests(TestCase):
    """Testes de throttling nas APIs sensíveis."""

    def setUp(self):
        self.client = APIClient()
        cache.clear()

    def test_ai_catalog_throttle_class_exists(self):
        """Verifica se AICatalogThrottle está configurado na view."""
        from kipo_playground.views import AutoCatalogAIView
        from kipo_playground.security import AICatalogThrottle
        self.assertIn(AICatalogThrottle, AutoCatalogAIView.throttle_classes)

    def test_ai_planner_throttle_class_exists(self):
        """Verifica se AIPlannerThrottle está configurado na view."""
        from kipo_playground.views import GeradorPlanoAulaView
        from kipo_playground.security import AIPlannerThrottle
        self.assertIn(AIPlannerThrottle, GeradorPlanoAulaView.throttle_classes)

    def test_password_reset_throttle_classes_exist(self):
        """Verifica se throttles de reset estão importados."""
        from kipo_playground.security import (
            PasswordResetRequestThrottle,
            PasswordResetConfirmThrottle,
            RegisterThrottle
        )
        # Apenas verifica se as classes existem e podem ser instanciadas
        self.assertIsNotNone(PasswordResetRequestThrottle())
        self.assertIsNotNone(PasswordResetConfirmThrottle())
        self.assertIsNotNone(RegisterThrottle())

    def test_throttle_scopes_in_settings(self):
        """Verifica se os scopes de throttle estão no settings."""
        from django.conf import settings
        throttle_rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        self.assertIn('ai_catalog', throttle_rates)
        self.assertIn('ai_planner', throttle_rates)
        self.assertIn('password_reset_request', throttle_rates)
        self.assertIn('password_reset_confirm', throttle_rates)
        self.assertIn('register', throttle_rates)