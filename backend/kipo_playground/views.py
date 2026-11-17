"""Módulo de Views de kipo_playground"""

from multiprocessing import context
from typing import final
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.template import Template, Context
from django.contrib.auth.decorators import login_required
from django.core.files.storage import FileSystemStorage
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from owlready2 import *
from os.path import exists
import os
import shutil
import json
import sys
import re
import traceback
import requests  # Adicionado para requisições à API do Ollama/Qwen
from random import randint

# --- IMPORTS DE PDF E IA ---
from weasyprint import HTML
from .services.llm import get_llm_provider

# --- IMPORTS DE SEGURANÇA ---
from .security import (
    validate_file_upload, validate_multiple_files,
    get_ollama_url, validate_ollama_url,
    AICatalogThrottle, AIPlannerThrottle,
    PasswordResetRequestThrottle, PasswordResetConfirmThrottle, RegisterThrottle,
    store_password_reset_token, consume_password_reset_token,
    sanitize_crm_data, mask_email, mask_phone
)

# --- IMPORTS DO REST FRAMEWORK ---
from rest_framework.decorators import api_view, permission_classes, authentication_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from django.core.cache import cache

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.throttling import ScopedRateThrottle

# Importação dos modelos
from .models import (
    Profile, Producao, Avaliacao, Topico, Comentario, RegistroXP,
    Conquista, ConquistaUsuario, DiarioOperacao, NotaDiario, ConfiguracaoXP, Escola, Disciplina, Notificacao
)


# Lista de arquivos permitidos no servidor (importada de security)
from .security import ALLOWED_EXTENSIONS

# ============================================================================
# FUNÇÃO AUXILIAR DE GAMIFICAÇÃO
# ============================================================================
def adicionar_xp(perfil, quantidade, descricao):
    """Adiciona XP ao perfil, gera histórico e dispara notificações"""
    nivel_anterior = perfil.get_nivel()
    
    perfil.pontos += quantidade
    perfil.save()
    
    RegistroXP.objects.create(
        perfil=perfil,
        quantidade=quantidade,
        descricao=descricao
    )

    Notificacao.objects.create(
        user=perfil.user,
        titulo=f"+{quantidade} XP",
        mensagem=descricao,
        tipo='XP'
    )

    nivel_atual = perfil.get_nivel()
    if nivel_anterior != nivel_atual:
        Notificacao.objects.create(
            user=perfil.user,
            titulo="🎉 Subiu de Nível!",
            mensagem=f"Parabéns! Você alcançou o título de: {nivel_atual}",
            tipo='NIVEL'
        )

# ----------------------------------------------------

def logout_user(request):
    logout(request)
    return redirect('register')

def login_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('/kipo_playground/welcome/')
        else:
            messages.info(request, 'bad login!')

    context = {}
    return render(request, 'login.html', context)

def register(request):
    form = CreateUser()
    if request.method == 'POST':
        form = CreateUser(request.POST)
        if form.is_valid():
            form.save()
            return redirect('/kipo_playground/welcome/')

    context = {'form': form}
    return render(request, 'register.html', context)


# ============================================================================
# LOGIN CUSTOMIZADO (VERIFICA APROVAÇÃO)
# ============================================================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        if user.is_superuser:
            return data
            
        if not hasattr(user, 'profile'):
            raise AuthenticationFailed('Perfil não encontrado. Acesso negado.')
            
        if user.profile.status_conta == 'Em análise':
            raise AuthenticationFailed('Sua conta está em análise. Aguarde a aprovação do administrador.')
        elif user.profile.status_conta == 'Rejeitado':
            raise AuthenticationFailed('Sua conta foi rejeitada e não tem acesso ao sistema.')
            
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login_attempts'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            if refresh_token:
                # Definir refresh_token em cookie HttpOnly (seguro contra XSS)
                # Não retornar refresh_token no body da resposta
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,      # True em produção (HTTPS)
                    samesite='Lax' if settings.DEBUG else 'Strict',
                    path='/api/token/refresh/',     # Só enviado no endpoint de refresh
                    max_age=60 * 60 * 24 * 7        # 7 dias
                )
                # Remover refresh_token do body da resposta (não expô-lo ao JS)
                del response.data['refresh']

        return response


# ============================================================================
# REFRESH TOKEN VIA HTTPONLY COOKIE (Segurança máxima)
# ============================================================================
class CookieTokenRefreshView(TokenRefreshView):
    """
    View personalizada para refresh de token via HttpOnly Cookie.
    O refresh_token é lido do cookie (inacessível a JavaScript/XSS),
    não do corpo da requisição.
    O novo refresh_token rotacionado é definido no cookie HttpOnly,
    NÃO exposto no body da resposta.
    """
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        # Ler refresh_token do cookie HttpOnly
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {'detail': 'Refresh token não encontrado no cookie.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Adicionar o token ao request.data para o serializer
        request.data['refresh'] = refresh_token

        # Processar refresh normal
        try:
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                new_refresh = response.data.get('refresh')
                if new_refresh:
                    # Definir NOVO refresh_token rotacionado no cookie HttpOnly
                    response.set_cookie(
                        'refresh_token',
                        new_refresh,
                        httponly=True,
                        secure=not settings.DEBUG,
                        samesite='Lax' if settings.DEBUG else 'Strict',
                        path='/api/token/refresh/',
                        max_age=60 * 60 * 24 * 7  # 7 dias
                    )
                    # Remover refresh_token do body (não expô-lo ao JS)
                    del response.data['refresh']

            return response
        except TokenError as e:
            # Se token inválido/expirado, limpar cookie
            response = Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie(
                'refresh_token',
                path='/api/token/refresh/',
                samesite='Lax' if settings.DEBUG else 'Strict'
            )
            return response


# ============================================================================
# OPÇÕES PARA O FORMULÁRIO DE REGISTRO
# ============================================================================
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_get_register_options(request):
    escolas = list(Escola.objects.values_list('nome', flat=True).order_by('nome'))
    disciplinas = list(Disciplina.objects.values_list('nome', flat=True).order_by('nome'))
    
    if "Outra" not in disciplinas:
        disciplinas.append("Outra")

    return Response({
        'escolas': escolas,
        'disciplinas': disciplinas
    })


# ============================================================================
# AUTENTICAÇÃO E PERFIL
# ============================================================================
@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def api_register_user(request):
    data = request.data

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    disciplina = data.get('disciplina', 'Outra')
    escola = data.get('escola', '')
    # Campos de consentimento LGPD (enviados pelo frontend)
    terms_version = data.get('terms_version', '4.1')
    terms_accepted = data.get('terms_accepted', False)
    privacy_version = data.get('privacy_version', '1.1')
    privacy_accepted = data.get('privacy_accepted', False)
    cookies_consent = data.get('cookies_consent', False)
    analytics_consent = data.get('analytics_consent', False)
    marketing_consent = data.get('marketing_consent', False)

    if not username or not password or not email:
        return Response({'erro': 'Preencha todos os campos obrigatórios.'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'erro': 'Este nome de usuário já está em uso.'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'erro': 'Este e-mail já possui uma conta cadastrada.'}, status=400)

    if len(password) < 8:
        return Response({'erro': 'A senha precisa ter no mínimo 8 caracteres.'}, status=400)

    if not terms_accepted or not privacy_accepted:
        return Response({'erro': 'É necessário aceitar os Termos de Uso e a Política de Privacidade.'}, status=400)

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name
        )

        profile, created = Profile.objects.get_or_create(user=user)
        profile.disciplina = disciplina
        profile.escola = escola
        profile.status_conta = 'Em análise'
        # Gravar consentimento LGPD (Art. 8º) - granular
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        profile.terms_version = terms_version
        profile.terms_accepted_at = timezone.now()
        profile.privacy_version = privacy_version
        profile.privacy_accepted_at = timezone.now()
        profile.cookies_consent = cookies_consent
        profile.analytics_consent = analytics_consent
        profile.marketing_consent = marketing_consent
        profile.cookies_accepted_at = timezone.now() if cookies_consent else None
        profile.consent_ip = client_ip
        profile.consent_user_agent = user_agent
        profile.save()

        return Response({'mensagem': 'Conta criada com sucesso! Aguarde aprovação.'}, status=201)

    except Exception as e:
        return Response({'erro': 'Erro interno ao criar conta.'}, status=500)


# ============================================================================
# CONSENTIMENTO LGPD — Consulta e Atualização
# ============================================================================
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_user_consent(request):
    """
    GET: Retorna status de consentimentos do usuário
    PATCH: Atualiza consentimentos granulares (cookies essenciais, analytics, marketing,
           re-aceite de termos/privacidade quando versão muda)
    """
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response({
            'terms_version': profile.terms_version,
            'terms_accepted_at': profile.terms_accepted_at,
            'privacy_version': profile.privacy_version,
            'privacy_accepted_at': profile.privacy_accepted_at,
            'cookies_accepted_at': profile.cookies_accepted_at,
            'cookies_consent': profile.cookies_consent,
            'analytics_consent': profile.analytics_consent,
            'marketing_consent': profile.marketing_consent,
            'current_terms_version': '4.1',  # Versão atual dos termos
            'current_privacy_version': '1.1',  # Versão atual da privacidade
        })

    elif request.method == 'PATCH':
        data = request.data
        updated = False
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Consentimento de cookies essenciais (sempre true se enviado)
        if 'cookies_consent' in data:
            profile.cookies_consent = bool(data['cookies_consent'])
            profile.cookies_accepted_at = timezone.now()
            profile.consent_ip = client_ip
            profile.consent_user_agent = user_agent
            updated = True

        # Consentimento de analytics
        if 'analytics_consent' in data:
            profile.analytics_consent = bool(data['analytics_consent'])
            profile.cookies_accepted_at = timezone.now()
            profile.consent_ip = client_ip
            profile.consent_user_agent = user_agent
            updated = True

        # Consentimento de marketing
        if 'marketing_consent' in data:
            profile.marketing_consent = bool(data['marketing_consent'])
            profile.cookies_accepted_at = timezone.now()
            profile.consent_ip = client_ip
            profile.consent_user_agent = user_agent
            updated = True

        # Re-aceite de termos (quando versão muda)
        if 'terms_version' in data and data['terms_version'] != profile.terms_version:
            profile.terms_version = data['terms_version']
            profile.terms_accepted_at = timezone.now()
            profile.consent_ip = client_ip
            profile.consent_user_agent = user_agent
            updated = True

        # Re-aceite de privacidade (quando versão muda)
        if 'privacy_version' in data and data['privacy_version'] != profile.privacy_version:
            profile.privacy_version = data['privacy_version']
            profile.privacy_accepted_at = timezone.now()
            profile.consent_ip = client_ip
            profile.consent_user_agent = user_agent
            updated = True

        if updated:
            profile.save()
            return Response({'mensagem': 'Consentimentos atualizados com sucesso.'})

        return Response({'mensagem': 'Nenhuma alteração realizada.'})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)

    if request.method == 'GET':
        avatar_url = None
        try:
            if profile.avatar:
                avatar_url = request.build_absolute_uri(profile.avatar.url)
        except:
            pass

        nome_exibicao = user.first_name if user.first_name else user.username
        progresso = profile.get_progresso_proximo_nivel()

        conquistas_usuario = profile.conquistas.all().select_related('conquista')
        lista_conquistas = [{
            'id': c.conquista.id,
            'nome': c.conquista.nome,
            'descricao': c.conquista.descricao,
            'icone': c.conquista.icone,
            'data': c.data_conquista.strftime('%d/%m/%Y')
        } for c in conquistas_usuario]

        return Response({
            'id': user.id,
            'username': nome_exibicao,
            'email': user.email,
            'disciplina': profile.disciplina,
            'escola': profile.escola,
            'avatar': avatar_url,
            'is_superuser': user.is_superuser,
            'pontos': profile.pontos,
            'nivel': profile.get_nivel(),
            'progresso': progresso,
            'conquistas': lista_conquistas
        })

    elif request.method == 'PUT':
        data = request.data
        
        if 'disciplina' in data:
            profile.disciplina = data['disciplina']
            
        if 'escola' in data:
            profile.escola = data['escola']

        file = request.FILES.get('avatar')
        if file:
            profile.avatar = file
            
        profile.save()

        if 'username' in data and data['username']:
            user.first_name = data['username']
            user.save()
        
        avatar_url = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        nome_exibicao = user.first_name if user.first_name else user.username

        return Response({
            'mensagem': 'Perfil atualizado com sucesso!',
            'username': nome_exibicao,
            'avatar': avatar_url,
            'disciplina': profile.disciplina,
            'escola': profile.escola,
            'pontos': profile.pontos,
            'nivel': profile.get_nivel(),
            'progresso': profile.get_progresso_proximo_nivel()
        })


# ============================================================================
# EXCLUSÃO DE CONTA PELO PRÓPRIO USUÁRIO (Direito ao Esquecimento - Art. 18 LGPD)
# ============================================================================
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_my_account(request):
    """
    Exclui a conta do usuário autenticado com anonimização irreversível
    das produções públicas (Art. 12 LGPD).

    Requer confirmação via parâmetro 'confirm': true
    """
    # Verificar confirmação explícita
    if not request.data.get('confirm') is True:
        return Response(
            {'erro': 'Confirmação obrigatória. Envie {"confirm": true}.'},
            status=400
        )

    user = request.user
    profile = getattr(user, 'profile', None)

    # 1. Anonimizar produções do usuário
    producoes = Producao.objects.filter(user=user)
    for prod in producoes:
        # Anonimização irreversível (Art. 12 LGPD)
        prod.exibir_autor = False  # Nunca exibir autor
        prod.user = None  # Dissociar do usuário (FK nullable após migração)
        prod.save()

    # 2. Anonimizar avaliações feitas pelo usuário
    avaliacoes = Avaliacao.objects.filter(revisor=user)
    for av in avaliacoes:
        av.revisor = None
        av.save()

    # 3. Anonimizar tópicos e comentários do fórum
    topicos = Topico.objects.filter(autor=user)
    for t in topicos:
        t.autor = None
        t.save()

    comentarios = Comentario.objects.filter(autor=user)
    for c in comentarios:
        c.autor = None
        c.save()

    # 4. Deletar notificações, conquistas, histórico XP, profile
    Notificacao.objects.filter(user=user).delete()
    ConquistaUsuario.objects.filter(perfil=profile).delete()
    RegistroXP.objects.filter(perfil=profile).delete()

    if profile:
        profile.delete()

    # 5. Deletar o usuário (CASCADE limpa User)
    user.delete()

    # 6. Retornar resposta e limpar cookie de refresh
    response = Response({'mensagem': 'Conta excluída com sucesso. Seus dados pessoais foram eliminados e suas produções foram anonimizadas irreversivelmente.'})
    response.delete_cookie(
        'refresh_token',
        path='/api/token/refresh/',
        samesite='Lax' if settings.DEBUG else 'Strict'
    )
    return response


# ============================================================================
# EXPORTAÇÃO DE DADOS — Portabilidade (Art. 18 LGPD)
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_export_my_data(request):
    """
    Exporta todos os dados do usuário autenticado em formato JSON
    para cumprimento do direito à portabilidade (Art. 18 LGPD).
    """
    user = request.user
    profile = getattr(user, 'profile', None)

    # User data
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
    }

    # Profile data
    profile_data = {}
    if profile:
        profile_data = {
            'disciplina': profile.disciplina,
            'escola': profile.escola,
            'pontos': profile.pontos,
            'nivel': profile.get_nivel(),
            'status_conta': profile.status_conta,
            'progresso': profile.get_progresso_proximo_nivel(),
            # Consentimentos LGPD (granular)
            'terms_version': profile.terms_version,
            'terms_accepted_at': profile.terms_accepted_at.isoformat() if profile.terms_accepted_at else None,
            'privacy_version': profile.privacy_version,
            'privacy_accepted_at': profile.privacy_accepted_at.isoformat() if profile.privacy_accepted_at else None,
            'cookies_accepted_at': profile.cookies_accepted_at.isoformat() if profile.cookies_accepted_at else None,
            'cookies_consent': profile.cookies_consent,
            'analytics_consent': profile.analytics_consent,
            'marketing_consent': profile.marketing_consent,
            'consent_ip': profile.consent_ip,
            'consent_user_agent': profile.consent_user_agent,
        }

    # Produções didáticas
    producoes = Producao.objects.filter(user=user).order_by('-data_criacao')
    producoes_data = []
    for p in producoes:
        producoes_data.append({
            'id': p.id,
            'titulo': p.titulo,
            'disciplina': p.disciplina,
            'nivel': p.nivel,
            'modelo_ia': p.modelo_ia,
            'prompts_ia': p.prompts_ia,
            'categoria': p.categoria,
            'bncc': p.bncc,
            'bncc_computacao': p.bncc_computacao,
            'metodologia': p.metodologia,
            'duracao': p.duracao,
            'recursos': p.recursos,
            'experiencia': p.experiencia,
            'resultados': p.resultados,
            'link_material': p.link_material,
            'exibir_autor': p.exibir_autor,
            'status': p.status,
            'data_criacao': p.data_criacao.isoformat() if p.data_criacao else None,
            'producao_base_id': p.producao_base_id,
        })

    # Avaliações recebidas (nas produções do usuário)
    avaliacoes_recebidas = []
    for p in producoes:
        for av in p.avaliacoes.all():
            avaliacoes_recebidas.append({
                'id': av.id,
                'producao_id': p.id,
                'producao_titulo': p.titulo,
                'revisor_id': av.revisor_id,
                'revisor_nome': av.revisor.first_name if av.revisor else 'Anonimizado',
                'data_avaliacao': av.data_avaliacao.isoformat() if av.data_avaliacao else None,
                'aprovado': av.aprovado,
                'feedback_revisao': av.feedback_revisao,
                'notas': {
                    'coerencia': av.nota_coerencia,
                    'qualidade': av.nota_qualidade,
                    'metodologia': av.nota_metodologia,
                    'avaliacao': av.nota_avaliacao,
                    'inclusao': av.nota_inclusao,
                    'inovacao': av.nota_inovacao,
                }
            })

    # Avaliações feitas pelo usuário
    avaliacoes_feitas = Avaliacao.objects.filter(revisor=user).select_related('producao')
    avaliacoes_feitas_data = []
    for av in avaliacoes_feitas:
        avaliacoes_feitas_data.append({
            'id': av.id,
            'producao_id': av.producao_id,
            'producao_titulo': av.producao.titulo if av.producao else 'Removida',
            'data_avaliacao': av.data_avaliacao.isoformat() if av.data_avaliacao else None,
            'aprovado': av.aprovado,
            'feedback_revisao': av.feedback_revisao,
            'notas': {
                'coerencia': av.nota_coerencia,
                'qualidade': av.nota_qualidade,
                'metodologia': av.nota_metodologia,
                'avaliacao': av.nota_avaliacao,
                'inclusao': av.nota_inclusao,
                'inovacao': av.nota_inovacao,
            }
        })

    # Tópicos do fórum
    topicos = Topico.objects.filter(autor=user).order_by('-data_criacao')
    topicos_data = []
    for t in topicos:
        topicos_data.append({
            'id': t.id,
            'titulo': t.titulo,
            'conteudo': t.conteudo,
            'categoria': t.categoria,
            'resolvido': t.resolvido,
            'data_criacao': t.data_criacao.isoformat() if t.data_criacao else None,
            'producao_base_id': t.producao_base_id,
        })

    # Comentários do fórum
    comentarios = Comentario.objects.filter(autor=user).select_related('topico').order_by('-data_criacao')
    comentarios_data = []
    for c in comentarios:
        comentarios_data.append({
            'id': c.id,
            'topico_id': c.topico_id,
            'topico_titulo': c.topico.titulo if c.topico else 'Removido',
            'conteudo': c.conteudo,
            'data_criacao': c.data_criacao.isoformat() if c.data_criacao else None,
        })

    # Histórico de XP
    historico_xp = RegistroXP.objects.filter(perfil=profile).order_by('-data') if profile else []
    historico_xp_data = []
    for h in historico_xp:
        historico_xp_data.append({
            'quantidade': h.quantidade,
            'descricao': h.descricao,
            'data': h.data.isoformat() if h.data else None,
        })

    # Conquistas
    conquistas = ConquistaUsuario.objects.filter(perfil=profile).select_related('conquista') if profile else []
    conquistas_data = []
    for c in conquistas:
        conquistas_data.append({
            'id': c.conquista.id,
            'nome': c.conquista.nome,
            'descricao': c.conquista.descricao,
            'icone': c.conquista.icone,
            'xp_bonus': c.conquista.xp_bonus,
            'data_conquista': c.data_conquista.isoformat() if c.data_conquista else None,
        })

    # Notificações
    notificacoes = Notificacao.objects.filter(user=user).order_by('-data_criacao')
    notificacoes_data = []
    for n in notificacoes:
        notificacoes_data.append({
            'id': n.id,
            'titulo': n.titulo,
            'mensagem': n.mensagem,
            'tipo': n.tipo,
            'lida': n.lida,
            'data_criacao': n.data_criacao.isoformat() if n.data_criacao else None,
        })

    return Response({
        'exportado_em': timezone.now().isoformat(),
        'usuario': user_data,
        'perfil': profile_data,
        'producoes': producoes_data,
        'avaliacoes_recebidas': avaliacoes_recebidas,
        'avaliacoes_feitas': avaliacoes_feitas_data,
        'topicos_forum': topicos_data,
        'comentarios_forum': comentarios_data,
        'historico_xp': historico_xp_data,
        'conquistas': conquistas_data,
        'notificacoes': notificacoes_data,
    })


# ============================================================================
# LOGOUT - Limpar cookie HttpOnly do refresh_token
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """
    Endpoint de logout que limpa o cookie HttpOnly do refresh_token.
    O access_token em memória é limpo pelo frontend.
    """
    response = Response({'mensagem': 'Logout realizado com sucesso.'})

    # Deletar cookie HttpOnly do refresh_token
    response.delete_cookie(
        'refresh_token',
        path='/api/token/refresh/',
        samesite='Lax' if settings.DEBUG else 'Strict'
    )

    return response


# ============================================================================
# PRODUÇÃO DIDÁTICA E RASCUNHO (ATUALIZADO FASE 1)
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_production(request):
    user = request.user
    data = request.data
    arquivo = request.FILES.get('arquivo')

    # Validar upload de arquivo (MIME type, magic bytes, tamanho)
    if arquivo:
        is_valid, error = validate_file_upload(arquivo, 'arquivo')
        if not is_valid:
            return Response({'erro': error}, status=400)

    try:
        recursos_input = data.getlist('recursos') if hasattr(data, 'getlist') else data.get('recursos', '')
        recursos_str = ", ".join(recursos_input) if isinstance(recursos_input, list) else str(recursos_input)

        is_draft_val = data.get('is_draft')
        is_draft = str(is_draft_val).strip().lower() in ['true', '1', 't', 'y', 'yes']
        status_inicial = 'Rascunho' if is_draft else 'Em revisão'

        # --- LÓGICA DE AUTORIA (PADRÃO ANÔNIMO: exibir_autor = False) ---
        if 'anonimo' in data:
            anonimo_val = data.get('anonimo')
            is_anonimo = str(anonimo_val).strip().lower() in ['true', '1', 't', 'y', 'yes']
            exibir_autor = not is_anonimo
        elif 'exibir_autor' in data:
            exibir_autor_val = data.get('exibir_autor')
            exibir_autor = str(exibir_autor_val).strip().lower() in ['true', '1', 't', 'y', 'yes']
        else:
            exibir_autor = False

        # --- LÓGICA DE RELEITURA (HERANÇA) ---
        producao_base_id = data.get('producao_base')
        producao_base = None
        if producao_base_id:
            try:
                producao_base = Producao.objects.get(id=producao_base_id)
            except Producao.DoesNotExist:
                pass

        nova_producao = Producao.objects.create(
            user=user,
            titulo=data.get('titulo', ''),
            exibir_autor=exibir_autor,     # Salva a escolha do anonimato
            producao_base=producao_base,   # Associa à prática que serviu de base
            disciplina=data.get('disciplina', ''),
            nivel=data.get('nivel_ensino', ''),
            modelo_ia=data.get('modelo_ia', ''),
            prompts_ia=data.get('prompts_ia', ''),
            categoria=data.get('categoria', ''),
            bncc=data.get('bncc', ''),
            bncc_computacao=data.get('bncc_computacao', ''),
            metodologia=data.get('metodologia', ''),
            duracao=data.get('duracao', ''),
            recursos=recursos_str,
            experiencia=data.get('experiencia', ''),
            resultados=data.get('resultados', ''),
            arquivo=arquivo,
            link_material=data.get('link_material', ''),
            status=status_inicial
        )
        return Response({'mensagem': 'Produção criada com sucesso!', 'id': nova_producao.id}, status=201)
    
    except Exception as e:
        return Response({'erro': 'Erro ao salvar produção.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_my_productions(request):
    user = request.user
    producoes = Producao.objects.filter(user=user).order_by('-data_criacao')

    lista = []
    for p in producoes:
        ultima_avaliacao = p.avaliacoes.order_by('-data_avaliacao').first()
        feedback = ultima_avaliacao.feedback_revisao if ultima_avaliacao else None

        total_aprovacoes = p.avaliacoes.filter(aprovado=True).count()

        # XP ganho com esta produção (busca no histórico de XP)
        xp_ganho = 0
        try:
            from kipo_playground.models import RegistroXP
            registro = RegistroXP.objects.filter(
                perfil=user.profile,
                descricao__icontains=str(p.id)
            ).first()
            if registro:
                xp_ganho = registro.quantidade
        except Exception:
            pass

        lista.append({
            'id': p.id,
            'titulo': p.titulo,
            'disciplina': p.disciplina,
            'data': p.data_criacao.strftime('%d/%m/%Y'),
            'status': p.status,
            'modelo_ia': p.modelo_ia,
            'feedback_revisor': feedback,
            'total_aprovacoes': total_aprovacoes,
            'xp_ganho': xp_ganho,
        })

    return Response(lista)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_duplicate_production(request, pk):
    """Duplica uma produção existente como rascunho."""
    try:
        original = Producao.objects.get(id=pk, user=request.user)
    except Producao.DoesNotExist:
        return Response({'erro': 'Produção não encontrada.'}, status=404)

    # Cria cópia como rascunho
    nova = Producao.objects.create(
        user=request.user,
        titulo=f"Cópia de {original.titulo}",
        disciplina=original.disciplina,
        nivel=original.nivel,
        modelo_ia=original.modelo_ia,
        prompts_ia=original.prompts_ia,
        categoria=original.categoria,
        bncc=original.bncc,
        bncc_computacao=original.bncc_computacao,
        metodologia=original.metodologia,
        duracao=original.duracao,
        recursos=original.recursos,
        experiencia=original.experiencia,
        resultados=original.resultados,
        arquivo=original.arquivo,
        exibir_autor=original.exibir_autor,
        link_material=original.link_material,
        status='Rascunho',
        producao_base=original,
    )

    return Response({
        'id': nova.id,
        'titulo': nova.titulo,
        'status': nova.status,
        'message': 'Produção duplicada como rascunho com sucesso.'
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_get_production_details(request, pk):
    try:
        p = Producao.objects.get(id=pk)

        is_dono = p.user == request.user
        is_admin = request.user.is_superuser
        is_aprovado = p.status in ['Aprovado', 'Concluído']
        is_revisor_desta_pratica = p.avaliacoes.filter(revisor=request.user).exists()
        
        minha_disciplina = request.user.profile.disciplina if hasattr(request.user, 'profile') else 'Outra'
        is_potencial_revisor = (p.status == 'Em revisão' and p.disciplina == minha_disciplina and not is_dono)

        if not (is_dono or is_admin or is_aprovado or is_revisor_desta_pratica or is_potencial_revisor):
            return Response({'erro': 'Acesso negado. Esta produção é privada ou ainda está em avaliação.'}, status=403)
        
        arquivo_url = request.build_absolute_uri(p.arquivo.url) if p.arquivo else None

        avaliacoes = p.avaliacoes.all().order_by('data_avaliacao')
        avaliacoes_detalhadas = []
        
        for i, aval in enumerate(avaliacoes):
            raw_feedback = aval.feedback_revisao or ""
            pontos_fortes = ""
            pontos_melhoria = ""
            
            if "SUGESTÕES DE MELHORIA:" in raw_feedback:
                parts = raw_feedback.split("SUGESTÕES DE MELHORIA:")
                pontos_fortes = parts[0].replace("PONTOS FORTES:", "").strip()
                pontos_melhoria = parts[1].strip()
            else:
                pontos_fortes = raw_feedback
                
            avaliacoes_detalhadas.append({
                'ordem': i + 1,
                'revisor_id': aval.revisor.id,
                'aprovado': aval.aprovado,
                'pontos_fortes': pontos_fortes,
                'pontos_melhoria': pontos_melhoria,
                'data': aval.data_avaliacao.strftime('%d/%m/%Y') if aval.data_avaliacao else '',
                'notas': {
                    'coerencia': aval.nota_coerencia,
                    'qualidade': aval.nota_qualidade,
                    'metodologia': aval.nota_metodologia,
                    'avaliacao': aval.nota_avaliacao,
                    'inclusao': aval.nota_inclusao,
                    'inovacao': aval.nota_inovacao
                }
            })

        ultima_avaliacao = avaliacoes.last()
        feedback_texto = ultima_avaliacao.feedback_revisao if ultima_avaliacao else None

        lista_recursos = [r.strip() for r in p.recursos.split(',')] if p.recursos else []

        dados_referencia = None
        if p.producao_base:
            autor_exibicao_original = (p.producao_base.user.get_full_name() or p.producao_base.user.username) if p.producao_base.exibir_autor else None
            
            dados_referencia = {
                'id': p.producao_base.id,
                'titulo': p.producao_base.titulo,
                'autor': autor_exibicao_original
            }

        total_aprovacoes = avaliacoes.filter(aprovado=True).count()

        avaliacoes_filtradas = []
        if is_dono or is_admin:
            avaliacoes_filtradas = avaliacoes_detalhadas
        elif is_revisor_desta_pratica:
            avaliacoes_filtradas = [a for a in avaliacoes_detalhadas if a['revisor_id'] == request.user.id]

        notas = avaliacoes_filtradas[-1]['notas'] if avaliacoes_filtradas else None

        # Só envia o nome do autor se a prática estiver APROVADA e exibir_autor for True
        mostrar_autor = bool(p.exibir_autor and is_aprovado)
        nome_autor_final = (p.user.get_full_name() or p.user.first_name or p.user.username) if mostrar_autor else None

        data = {
            'id': p.id,
            'titulo': p.titulo,
            'disciplina': p.disciplina,
            'nivel': p.nivel,
            'modelo_ia': p.modelo_ia,
            'prompts_ia': p.prompts_ia,
            'categoria': p.categoria,
            'bncc': p.bncc,
            'bncc_computacao': p.bncc_computacao,
            'metodologia': p.metodologia,
            'duracao': p.duracao,
            'recursos': lista_recursos,
            'experiencia': p.experiencia,
            'resultados': p.resultados,
            'arquivo': arquivo_url,
            'link_material': p.link_material,
            'data': p.data_criacao.strftime('%d/%m/%Y'),
            'status': p.status,
            
            # --- LÓGICA DE AUTORIA ESTRITA ---
            'autor': nome_autor_final,
            'exibir_autor': mostrar_autor,
            'anonimo': not mostrar_autor,
            
            'is_dono': is_dono,
            'is_admin': is_admin,
            'is_revisor': is_revisor_desta_pratica,

            'revisao_realizada': len(avaliacoes_filtradas) > 0,
            'avaliacoes_detalhadas': avaliacoes_filtradas,
            'feedback_texto': feedback_texto if (is_dono or is_admin) else None,
            'notas': notas,
            'total_avaliacoes': avaliacoes.count(),
            'total_aprovacoes': total_aprovacoes,

            'is_aprovado': is_aprovado,
            'producao_base': dados_referencia
        }
        return Response(data)
        
    except Producao.DoesNotExist:
        return Response({'erro': 'Produção não encontrada'}, status=404)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def api_update_production(request, pk):
    try:
        p = Producao.objects.get(id=pk, user=request.user)
        
        if p.status not in ['Correção solicitada', 'Rascunho']:
            return Response({'erro': 'Esta produção não pode ser editada no momento.'}, status=403)

        data = request.data
        p.titulo = data.get('titulo', p.titulo)
        p.disciplina = data.get('disciplina', p.disciplina)
        p.nivel = data.get('nivel_ensino', p.nivel)
        p.modelo_ia = data.get('modelo_ia', p.modelo_ia)
        p.prompts_ia = data.get('prompts_ia', p.prompts_ia)
        p.categoria = data.get('categoria', p.categoria)
        p.bncc = data.get('bncc', p.bncc)
        p.bncc_computacao = data.get('bncc_computacao', p.bncc_computacao)
        p.metodologia = data.get('metodologia', p.metodologia)
        p.duracao = data.get('duracao', p.duracao)
        p.experiencia = data.get('experiencia', p.experiencia)
        p.resultados = data.get('resultados', p.resultados)
        p.link_material = data.get('link_material', p.link_material)

        if 'anonimo' in data:
            anonimo_val = data.get('anonimo')
            is_anonimo = str(anonimo_val).strip().lower() in ['true', '1', 't', 'y', 'yes']
            p.exibir_autor = not is_anonimo
        elif 'exibir_autor' in data:
            exibir_autor_val = data.get('exibir_autor')
            p.exibir_autor = str(exibir_autor_val).strip().lower() in ['true', '1', 't', 'y', 'yes']

        recursos_input = data.getlist('recursos') if hasattr(data, 'getlist') else data.get('recursos')
        if recursos_input:
            p.recursos = ", ".join(recursos_input) if isinstance(recursos_input, list) else str(recursos_input)

        novo_arquivo = request.FILES.get('arquivo')
        if novo_arquivo:
            # Validar upload de arquivo (MIME type, magic bytes, tamanho)
            is_valid, error = validate_file_upload(novo_arquivo, 'arquivo')
            if not is_valid:
                return Response({'erro': error}, status=400)
            p.arquivo = novo_arquivo

        is_draft_val = data.get('is_draft')
        is_draft = str(is_draft_val).strip().lower() in ['true', '1', 't', 'y', 'yes']
        
        if is_draft:
            p.status = 'Rascunho'
        else:
            p.status = 'Em revisão'
            p.avaliacoes.all().delete()
            
        p.save()
        
        return Response({'mensagem': 'Produção atualizada com sucesso!'})

    except Producao.DoesNotExist:
        return Response({'erro': 'Produção não encontrada.'}, status=404)
    except Exception as e:
        return Response({'erro': 'Erro interno ao atualizar.'}, status=500)


# ============================================================================
# CONTROLE DE VISIBILIDADE DO AUTOR (LIGA/DESLIGA)
# ============================================================================
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def api_toggle_author_visibility(request, pk):
    """Permite que apenas o dono da prática ligue/desligue seu nome após aprovada"""
    try:
        p = Producao.objects.get(id=pk, user=request.user)
        p.exibir_autor = not p.exibir_autor
        p.save()
        
        status_msg = "visível" if p.exibir_autor else "oculto"
        nome_autor = (p.user.get_full_name() or p.user.first_name or p.user.username) if p.exibir_autor else None
        
        return Response({
            'mensagem': f'Seu nome agora está {status_msg} na comunidade.',
            'exibir_autor': p.exibir_autor,
            'anonimo': not p.exibir_autor,
            'autor': nome_autor
        })
    except Producao.DoesNotExist:
        return Response({'erro': 'Acesso negado ou prática não encontrada.'}, status=404)


# ============================================================================
# SISTEMA DE REVISÃO E GAMIFICAÇÃO DO SISTEMA
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_review_queue(request):
    user = request.user
    
    try:
        minha_disciplina = user.profile.disciplina
    except:
        minha_disciplina = 'Outra'

    producoes_para_revisar = Producao.objects.filter(
        disciplina=minha_disciplina,
        status='Em revisão'
    ).exclude(user=user).exclude(avaliacoes__revisor=user).order_by('data_criacao')

    lista = []
    for p in producoes_para_revisar:
        lista.append({
            'id': p.id,
            'titulo': p.titulo,
            'disciplina': p.disciplina,
            'nivel': p.nivel,
            'data': p.data_criacao.strftime('%d/%m/%Y'),
            'modelo_ia': p.modelo_ia
        })
    
    return Response(lista)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_submit_review(request, pk):
    try:
        p = Producao.objects.get(id=pk)
        
        if p.user == request.user:
            return Response({'erro': 'Não pode avaliar a sua própria produção.'}, status=403)
            
        if p.status != 'Em revisão':
            return Response({'erro': 'Esta produção não está disponível para avaliação.'}, status=400)
            
        if Avaliacao.objects.filter(producao=p, revisor=request.user).exists():
            return Response({'erro': 'Você já avaliou esta produção.'}, status=400)
        
        data = request.data
        
        aprovado_raw = data.get('aprovado')
        if isinstance(aprovado_raw, str):
            aprovado = aprovado_raw.lower() in ['true', '1', 't', 'y', 'yes']
        else:
            aprovado = bool(aprovado_raw)
            
        pontos_fortes = data.get('pontos_fortes', '')
        pontos_melhoria = data.get('pontos_melhoria', '')
        
        feedback_texto = f"PONTOS FORTES:\n{pontos_fortes}\n\nSUGESTÕES DE MELHORIA:\n{pontos_melhoria}"
        
        Avaliacao.objects.create(
            producao=p,
            revisor=request.user,
            aprovado=aprovado,
            feedback_revisao=feedback_texto,
            nota_coerencia=int(data.get('nota_coerencia', 0)),
            nota_qualidade=int(data.get('nota_qualidade', 0)),
            nota_metodologia=int(data.get('nota_metodologia', 0)),
            nota_avaliacao=int(data.get('nota_avaliacao', 0)),
            nota_inclusao=int(data.get('nota_inclusao', 0)),
            nota_inovacao=int(data.get('nota_inovacao', 0))
        )

        config_xp, _ = ConfiguracaoXP.objects.get_or_create(pk=1)

        perfil_revisor = request.user.profile
        adicionar_xp(perfil_revisor, config_xp.xp_revisao, f"Revisão da produção: {p.titulo}")

        if not aprovado:
            p.status = 'Correção solicitada'
            msg_response = f'Sua avaliação foi registrada. Você ganhou +{config_xp.xp_revisao} XP! A produção foi devolvida ao autor para correção.'
            
            try:
                autor_email = p.user.email
                if autor_email:
                    assunto = f"Ação Necessária: Sua produção '{p.titulo}' precisa de atenção"
                    nome_autor = p.user.first_name.split()[0].title() if p.user.first_name else "Professor(a)"
                    mensagem_texto = f"Olá, {nome_autor}. Sua produção '{p.titulo}' precisa de ajustes. Acesse o sistema."
                    send_mail(assunto, mensagem_texto, settings.DEFAULT_FROM_EMAIL, [autor_email], fail_silently=True)
            except Exception:
                pass
        else:
            total_aprovacoes = p.avaliacoes.filter(aprovado=True).count()
            
            # Alterado para >= 1 para aprovar logo com a primeira validação
            if total_aprovacoes >= 1:
                p.status = 'Aprovado'
                msg_response = f'Revisão registrada! Você ganhou +{config_xp.xp_revisao} XP. A produção foi aprovada e publicada na comunidade.'
                
                perfil_autor = p.user.profile
                adicionar_xp(perfil_autor, config_xp.xp_aprovacao, f"Produção aprovada pela comunidade: {p.titulo}")
            else:
                p.status = 'Em revisão'
                msg_response = f'Revisão registrada! Você ganhou +{config_xp.xp_revisao} XP.'

        p.save()
        return Response({'mensagem': msg_response, 'xp_ganho': config_xp.xp_revisao})
        
    except Producao.DoesNotExist:
        return Response({'erro': 'Produção não encontrada'}, status=404)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_review_history(request):
    user = request.user
    avaliacoes = Avaliacao.objects.filter(revisor=user).select_related('producao').order_by('-data_avaliacao')
    
    lista = []
    for a in avaliacoes:
        veredito_final = "APROVADO" if a.aprovado else "REJEITADO"
        lista.append({
            'id': a.producao.id,
            'titulo': a.producao.titulo,
            'disciplina': a.producao.disciplina,
            'data_revisao': a.data_avaliacao.strftime('%d/%m/%Y') if a.data_avaliacao else 'Data n/d',
            'meu_veredito': veredito_final,
            'autor_anonimo': f"Prof. de {a.producao.disciplina}"
        })
    
    return Response(lista)


# ============================================================================
# FEED DA COMUNIDADE (ATUALIZADO FASE 1)
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_public_feed(request):
    producoes = Producao.objects.filter(status='Aprovado').select_related('producao_base').order_by('-data_criacao')
    
    busca = request.GET.get('search', '')
    
    if busca:
        producoes = producoes.filter(
            Q(titulo__icontains=busca) |
            Q(disciplina__icontains=busca) |
            Q(categoria__icontains=busca) |
            Q(experiencia__icontains=busca)
        )
    
    lista = []
    for p in producoes:
        # Só retorna o nome no Feed se o autor assinou explicitamente (senão retorna None e o card oculta)
        autor_exibicao = (p.user.get_full_name() or p.user.first_name or p.user.username) if p.exibir_autor else None

        base_info = None
        if p.producao_base:
            base_info = {
                'id': p.producao_base.id,
                'titulo': p.producao_base.titulo
            }

        lista.append({
            'id': p.id,
            'titulo': p.titulo,
            'disciplina': p.disciplina,
            'nivel': p.nivel,
            'modelo_ia': p.modelo_ia,
            'categoria': p.categoria,
            'autor': autor_exibicao,
            'exibir_autor': p.exibir_autor,
            'producao_base': base_info,
            'resumo': p.experiencia[:150] + '...' if p.experiencia else '',
            'likes': 0
        })
    
    return Response(lista)


# Painel de recuperação de senha
@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRequestThrottle])
def api_password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'erro': 'E-mail é obrigatório.'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'mensagem': 'Se o e-mail existir, um link foi enviado.'})

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    # Usar FRONTEND_URL do settings para o link de reset
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

    # Armazenar token no cache para uso único
    store_password_reset_token(user, token)

    subject = "Redefinição de Senha - T.E.I.A"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [email]

    try:
        logo_url = request.build_absolute_uri(settings.STATIC_URL + 'assets/unb.png')
        
        nome_usuario = user.first_name if user.first_name else user.username
        context = {
            'nome': nome_usuario.split()[0].title(),
            'link': reset_link,
            'logo_url': logo_url
        }

        html_content = render_to_string('emails/password_reset_email.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        return Response({'mensagem': 'E-mail enviado com sucesso!'})
        
    except Exception as e:
        print(f"ERRO AO ENVIAR E-MAIL: {e}")
        return Response({'erro': 'Erro ao enviar e-mail. Verifique o console.'}, status=500)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetConfirmThrottle])
def api_password_reset_confirm(request, uidb64, token):
    new_password = request.data.get('password')

    if not new_password:
        return Response({'erro': 'Nova senha é obrigatória.'}, status=400)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'erro': 'Link inválido.'}, status=400)

    # Verificar e consumir token do cache (single-use)
    if not consume_password_reset_token(user, token):
        return Response({'erro': 'Link expirado ou inválido.'}, status=400)

    if default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({'mensagem': 'Senha alterada com sucesso!'})
    else:
        return Response({'erro': 'Link expirado ou inválido.'}, status=400)


# Painel de aprovação de contas
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_pending_users(request):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    profiles = Profile.objects.filter(status_conta='Em análise').select_related('user')
    lista = []
    for p in profiles:
        nome_completo = p.user.get_full_name() or p.user.first_name or p.user.username
        lista.append({
            'id': p.user.id,
            'nome': nome_completo,
            'username': p.user.username,
            'email': p.user.email,
            'escola': p.escola or 'Não informada',
            'disciplina': p.disciplina or 'Não informada',
            'data_cadastro': p.user.date_joined.strftime('%d/%m/%Y')
        })
    return Response(lista)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_approve_reject_user(request, user_id):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    acao = request.data.get('acao')
    if acao not in ['Aprovado', 'Rejeitado']:
        return Response({'erro': 'Ação inválida'}, status=400)
        
    try:
        user_target = User.objects.get(id=user_id)
        profile = user_target.profile
        profile.status_conta = acao
        profile.save()
        
        mensagem = f"Usuário {user_target.username} foi {acao.lower()} com sucesso."
        return Response({'mensagem': mensagem})
    except User.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado'}, status=404)


# Views para o fórum do sistema
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_forum_detalhe_comentarios(request, pk):
    try:
        topico = Topico.objects.get(id=pk)
    except Topico.DoesNotExist:
        return Response({'erro': 'Tópico não encontrado'}, status=404)

    config_xp, _ = ConfiguracaoXP.objects.get_or_create(pk=1)

    if request.method == 'GET':
        comentarios_db = topico.comentarios.all().order_by('data_criacao')
        lista_comentarios = []
        for c in comentarios_db:
            lista_comentarios.append({
                'id': c.id,
                'autor': c.autor.first_name or c.autor.username,
                'is_autor_topico': c.autor == topico.autor,
                'conteudo': c.conteudo,
                'data': timezone.localtime(c.data_criacao).strftime('%d/%m/%Y %H:%M')
            })

        arquivo_url = request.build_absolute_uri(topico.arquivo.url) if topico.arquivo else None
        
        dados_base = None
        if topico.producao_base:
            autor_base = (topico.producao_base.user.get_full_name() or topico.producao_base.user.username) if topico.producao_base.exibir_autor else None
            dados_base = {
                'id': topico.producao_base.id,
                'titulo': topico.producao_base.titulo,
                'disciplina': topico.producao_base.disciplina,
                'autor': autor_base
            }

        dados_topico = {
            'id': topico.id,
            'titulo': topico.titulo,
            'conteudo': topico.conteudo,
            'categoria': topico.categoria,
            'resolvido': topico.resolvido,
            'autor': topico.autor.first_name or topico.autor.username,
            'is_dono_topico': topico.autor == request.user,
            'data': timezone.localtime(topico.data_criacao).strftime('%d/%m/%Y %H:%M'),
            'arquivo': arquivo_url,
            'producao_base': dados_base,
            'comentarios': lista_comentarios
        }
        return Response(dados_topico)

    elif request.method == 'POST':
        if topico.resolvido:
            return Response({'erro': 'Este tópico já está resolvido e fechado.'}, status=400)
            
        conteudo = request.data.get('conteudo')
        if not conteudo:
            return Response({'erro': 'O comentário não pode ser vazio.'}, status=400)
            
        Comentario.objects.create(
            topico=topico,
            autor=request.user,
            conteudo=conteudo
        )

        perfil_comentarista = request.user.profile
        adicionar_xp(perfil_comentarista, config_xp.xp_comentario, f"Comentário no tópico: {topico.titulo}")

        return Response({
            'mensagem': f'Comentário adicionado com sucesso! Você ganhou +{config_xp.xp_comentario} XP.',
            'xp_ganho': config_xp.xp_comentario
        })

    elif request.method == 'PUT':
        if topico.autor != request.user:
            return Response({'erro': 'Apenas o autor pode fechar o tópico.'}, status=403)
            
        topico.resolvido = True
        topico.save()
        return Response({'mensagem': 'Tópico marcado como resolvido!'})

    elif request.method == 'DELETE':
        if topico.autor != request.user and not request.user.is_superuser:
            return Response({'erro': 'Você não tem permissão para excluir este tópico.'}, status=403)
        
        topico.delete()
        return Response({'mensagem': 'Tópico excluído com sucesso!'}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_forum_topicos(request):
    if request.method == 'GET':
        topicos = Topico.objects.all().order_by('-data_criacao')
        
        lista = []
        for t in topicos:
            disciplina = t.autor.profile.disciplina if hasattr(t.autor, 'profile') else 'Geral'
            
            lista.append({
                'id': t.id,
                'titulo': t.titulo,
                'categoria': t.categoria,
                'autor': t.autor.first_name or t.autor.username,
                'disciplina_autor': disciplina,
                'data': timezone.localtime(t.data_criacao).strftime('%d/%m/%Y %H:%M'),
                'resolvido': t.resolvido,
                'total_comentarios': t.comentarios.count()
            })

        return Response(lista)

    elif request.method == 'POST':
        titulo = request.data.get('titulo')
        conteudo = request.data.get('conteudo')
        categoria = request.data.get('categoria', 'Geral')
        producao_base_id = request.data.get('producao_base_id')

        arquivo_enviado = request.FILES.get('arquivo')

        if not titulo or not conteudo:
            return Response({'erro': 'Título e conteúdo são obrigatórios.'}, status=400)

        # Validar upload de arquivo (MIME type, magic bytes, tamanho)
        if arquivo_enviado:
            is_valid, error = validate_file_upload(arquivo_enviado, 'arquivo')
            if not is_valid:
                return Response({'erro': error}, status=400)

        producao_base = None
        if producao_base_id:
            try:
                producao_base = Producao.objects.get(id=producao_base_id, status='Aprovado')
            except Producao.DoesNotExist:
                pass

        Topico.objects.create(
            titulo=titulo,
            conteudo=conteudo,
            categoria=categoria,
            autor=request.user,
            arquivo=arquivo_enviado,
            producao_base=producao_base
        )

        config_xp, _ = ConfiguracaoXP.objects.get_or_create(pk=1)
        perfil_autor = request.user.profile
        adicionar_xp(perfil_autor, config_xp.xp_topico, f"Novo tópico aberto: {titulo}")

        return Response({
            'mensagem': f'Tópico criado com sucesso! Você ganhou +{config_xp.xp_topico} XP.',
            'xp_ganho': config_xp.xp_topico
        }, status=201)


# Views para o painel de administração
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_list_users(request):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    users = User.objects.all().select_related('profile').order_by('-date_joined')
    lista = []
    for u in users:
        disciplina = u.profile.disciplina if hasattr(u, 'profile') else 'Não informada'
        escola = u.profile.escola if hasattr(u, 'profile') else 'Não informada'
        nome_completo = u.get_full_name() or u.first_name or u.username
        
        lista.append({
            'id': u.id,
            'nome': nome_completo,
            'username': u.username,
            'email': u.email,
            'escola': escola,
            'disciplina': disciplina,
            'is_superuser': u.is_superuser
        })
    return Response(lista)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_delete_user(request, pk):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    if request.user.id == pk:
        return Response({'erro': 'Você não pode excluir a si mesmo.'}, status=400)
        
    user_to_delete = get_object_or_404(User, id=pk)
    user_to_delete.delete()
    return Response({'mensagem': 'Usuário excluído com sucesso.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_list_productions(request):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    prods = Producao.objects.all().order_by('-data_criacao')
    lista = [{
        'id': p.id,
        'titulo': p.titulo,
        'autor': p.user.username,
        'status': p.status,
        'data': timezone.localtime(p.data_criacao).strftime('%d/%m/%Y')
    } for p in prods]
    
    return Response(lista)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_delete_production(request, pk):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    prod = get_object_or_404(Producao, id=pk)
    prod.delete()
    return Response({'mensagem': 'Produção excluída com sucesso.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_list_forum(request):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    topicos = Topico.objects.all().order_by('-data_criacao')
    lista = [{
        'id': t.id,
        'titulo': t.titulo,
        'autor': t.autor.username,
        'categoria': t.categoria
    } for t in topicos]
    
    return Response(lista)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_delete_forum(request, pk):
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    topico = get_object_or_404(Topico, id=pk)
    topico.delete()
    return Response({'mensagem': 'Tópico excluído com sucesso.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def api_listar_ciclos(request):
    return Response([])


# SISTEMA DE RANKING
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_ranking_gamificacao(request):
    top_xp_users = Profile.objects.select_related('user').order_by('-pontos')[:10]
    top_xp = [{
        'id': p.user.id,
        'nome': p.user.first_name or p.user.username,
        'disciplina': p.disciplina,
        'pontos': p.pontos,
        'nivel': p.get_nivel(),
    } for p in top_xp_users if p.pontos > 0]

    revisores_qs = User.objects.annotate(
        total_revisoes=Count('revisoes_feitas', distinct=True)
    ).order_by('-total_revisoes')[:10]
    
    top_revisores = [{
        'id': u.id,
        'nome': u.first_name or u.username,
        'disciplina': u.profile.disciplina if hasattr(u, 'profile') else 'Geral',
        'total': u.total_revisoes,
        'nivel': u.profile.get_nivel() if hasattr(u, 'profile') else ''
    } for u in revisores_qs if u.total_revisoes > 0]

    forum_qs = User.objects.annotate(
        total_forum=Count('topicos_forum', distinct=True) + Count('comentarios_usuario', distinct=True)
    ).order_by('-total_forum')[:10]
    
    top_forum = [{
        'id': u.id,
        'nome': u.first_name or u.username,
        'disciplina': u.profile.disciplina if hasattr(u, 'profile') else 'Geral',
        'total': u.total_forum,
        'nivel': u.profile.get_nivel() if hasattr(u, 'profile') else ''
    } for u in forum_qs if u.total_forum > 0]

    return Response({
        'top_xp': top_xp,
        'top_revisores': top_revisores,
        'top_forum': top_forum
    })

# ============================================================================
# GESTÃO DE GAMIFICAÇÃO (ADMIN)
# ============================================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_admin_gamificacao(request):
    """View para o Administrador gerenciar conquistas e auditar o histórico de XP"""
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)

    if request.method == 'GET':
        conquistas = Conquista.objects.all()
        lista_conquistas = [{
            'id': c.id,
            'nome': c.nome,
            'descricao': c.descricao,
            'icone': c.icone,
            'xp_bonus': c.xp_bonus
        } for c in conquistas]

        historico_recente = RegistroXP.objects.select_related('perfil__user').order_by('-data')[:20]
        lista_historico = [{
            'usuario': h.perfil.user.username,
            'quantidade': h.quantidade,
            'descricao': h.descricao,
            'data': h.data.strftime('%d/%m/%Y %H:%M')
        } for h in historico_recente]

        return Response({
            'conquistas_disponiveis': lista_conquistas,
            'auditoria_xp': lista_historico
        })

    elif request.method == 'POST':
        data = request.data
        try:
            Conquista.objects.create(
                nome=data.get('nome'),
                descricao=data.get('descricao'),
                icone=data.get('icone', 'award'),
                xp_bonus=int(data.get('xp_bonus', 0))
            )
            return Response({'mensagem': 'Conquista criada com sucesso!'}, status=201)
        except Exception as e:
            return Response({'erro': 'Erro ao criar conquista.'}, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_delete_badge(request, pk):
    """Exclui uma badge cadastrada no sistema"""
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    conquista = get_object_or_404(Conquista, id=pk)
    conquista.delete()
    return Response({'mensagem': 'Badge excluída com sucesso.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_atribuir_badge(request):
    """Atribui manualmente uma medalha a um usuário e concede o XP"""
    if not request.user.is_superuser:
        return Response({'erro': 'Acesso negado'}, status=403)
        
    user_id = request.data.get('usuario_id')
    conquista_id = request.data.get('conquista_id')
    
    try:
        perfil = Profile.objects.get(user__id=user_id)
        conquista = Conquista.objects.get(id=conquista_id)
        
        if ConquistaUsuario.objects.filter(perfil=perfil, conquista=conquista).exists():
            return Response({'erro': 'O usuário já possui esta medalha.'}, status=400)
            
        ConquistaUsuario.objects.create(perfil=perfil, conquista=conquista)
        adicionar_xp(perfil, conquista.xp_bonus, f"Medalha Atribuída: {conquista.nome}")
        
        return Response({'mensagem': 'Medalha atribuída com sucesso!'})
    except Exception as e:
        return Response({'erro': 'Erro ao atribuir medalha.'}, status=400)


# ============================================================================
# DIÁRIO DE OPERAÇÕES (CRM INTERNO)
# ============================================================================
class DiarioOperacaoView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = DiarioOperacao.objects.all().select_related('docente')
        dados = []

        for log in logs:
            log_data = {
                'id': log.id,
                'titulo': log.titulo,
                'tipo': log.tipo,
                'status': log.status,
                'contato': log.contato or (log.docente.first_name if log.docente else 'Não informado'),
                'docente_id': log.docente.id if log.docente else None,
                'data_evento': log.data_evento.strftime('%Y-%m-%d') if log.data_evento else None,
                'descricao': log.descricao,
                'proximos_passos': log.proximos_passos,
                'tags': log.tags,
                'participantes': log.participantes,
                'foto': request.build_absolute_uri(log.foto.url) if log.foto else None,
            }
            # Sanitizar PII para não-superusers
            log_data = sanitize_crm_data(log_data, request.user)
            dados.append(log_data)
        return Response(dados)

    def post(self, request):
        titulo = request.data.get('titulo')
        tipo = request.data.get('tipo')
        status_registro = request.data.get('status', 'Resolvido')
        docente_id = request.data.get('docente_id')
        contato = request.data.get('contato')
        data_evento = request.data.get('data_evento')
        descricao = request.data.get('descricao')
        proximos_passos = request.data.get('proximos_passos')
        tags = request.data.get('tags')
        participantes = request.data.get('participantes', 1)

        foto = request.FILES.get('foto')

        if not all([titulo, tipo, data_evento, descricao]):
            return Response({'erro': 'Campos obrigatórios faltando.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar upload de foto
        if foto:
            is_valid, error = validate_file_upload(foto, 'foto')
            if not is_valid:
                return Response({'erro': error}, status=400)

        docente = None
        if docente_id:
            try:
                docente = User.objects.get(id=docente_id)
            except User.DoesNotExist:
                pass

        novo_log = DiarioOperacao.objects.create(
            titulo=titulo,
            tipo=tipo,
            status=status_registro,
            docente=docente,
            contato=contato,
            data_evento=data_evento,
            descricao=descricao,
            proximos_passos=proximos_passos,
            tags=tags,
            participantes=participantes,
            foto=foto
        )

        response_data = {
            'id': novo_log.id,
            'titulo': novo_log.titulo,
            'tipo': novo_log.tipo,
            'status': novo_log.status,
            'contato': novo_log.contato or (novo_log.docente.first_name if novo_log.docente else 'Não informado'),
            'docente_id': novo_log.docente.id if novo_log.docente else None,
            'data_evento': data_evento,
            'descricao': novo_log.descricao,
            'proximos_passos': novo_log.proximos_passos,
            'tags': novo_log.tags,
            'participantes': novo_log.participantes,
            'foto': request.build_absolute_uri(novo_log.foto.url) if novo_log.foto else None,
        }
        # Sanitizar PII na resposta
        response_data = sanitize_crm_data(response_data, request.user)
        return Response(response_data, status=status.HTTP_201_CREATED)

class DiarioOperacaoDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            log = DiarioOperacao.objects.get(pk=pk)
            log.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DiarioOperacao.DoesNotExist:
            return Response({'erro': 'Registro não encontrado'}, status=status.HTTP_404_NOT_FOUND)

class DiarioNotaView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            diario = DiarioOperacao.objects.get(pk=pk)
        except DiarioOperacao.DoesNotExist:
            return Response({'erro': 'Registro não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        notas = diario.notas.all()
        lista_notas = [{
            'id': n.id,
            'autor': n.autor.first_name or n.autor.username if n.autor else 'Sistema',
            'texto': n.texto,
            'criado_em': timezone.localtime(n.criado_em).strftime('%d/%m/%Y %H:%M')
        } for n in notas]

        dados_diario = {
            'id': diario.id,
            'titulo': diario.titulo,
            'tipo': diario.tipo,
            'status': diario.status,
            'contato': diario.contato or (diario.docente.first_name if diario.docente else 'Não informado'),
            'data_evento': diario.data_evento.strftime('%Y-%m-%d') if diario.data_evento else None,
            'descricao': diario.descricao,
            'proximos_passos': diario.proximos_passos,
            'tags': diario.tags,
            'participantes': diario.participantes,
            'foto': request.build_absolute_uri(diario.foto.url) if diario.foto else None,
        }
        # Sanitizar PII para não-superusers
        dados_diario = sanitize_crm_data(dados_diario, request.user)

        return Response({'diario': dados_diario, 'notas': lista_notas})

    def post(self, request, pk):
        try:
            diario = DiarioOperacao.objects.get(pk=pk)
        except DiarioOperacao.DoesNotExist:
            return Response({'erro': 'Registro não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        texto = request.data.get('texto')
        novo_status = request.data.get('status')

        if novo_status and novo_status != diario.status:
            diario.status = novo_status
            diario.save()

        if texto:
            NotaDiario.objects.create(
                diario=diario,
                autor=request.user,
                texto=texto
            )
        
        return Response({'mensagem': 'Ticket atualizado com sucesso!'})

# ============================================================================
# CONFIGURAÇÕES GERAIS (XP, Escolas e Disciplinas)
# ============================================================================
class ConfiguracoesGeraisView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        config_xp, _ = ConfiguracaoXP.objects.get_or_create(pk=1)
        escolas = Escola.objects.all().values('id', 'nome').order_by('nome')
        disciplinas = Disciplina.objects.all().values('id', 'nome').order_by('nome')

        return Response({
            'xp': {
                'xp_revisao': config_xp.xp_revisao,
                'xp_aprovacao': config_xp.xp_aprovacao,
                'xp_topico': config_xp.xp_topico,
                'xp_comentario': config_xp.xp_comentario
            },
            'escolas': list(escolas),
            'disciplinas': list(disciplinas)
        })

    def post(self, request):
        acao = request.data.get('acao')

        if acao == 'atualizar_xp':
            config_xp, _ = ConfiguracaoXP.objects.get_or_create(pk=1)
            config_xp.xp_revisao = request.data.get('xp_revisao', config_xp.xp_revisao)
            config_xp.xp_aprovacao = request.data.get('xp_aprovacao', config_xp.xp_aprovacao)
            config_xp.xp_topico = request.data.get('xp_topico', config_xp.xp_topico)
            config_xp.xp_comentario = request.data.get('xp_comentario', config_xp.xp_comentario)
            config_xp.save()
            return Response({'mensagem': 'Economia de XP atualizada!'})

        elif acao == 'adicionar_escola':
            nome = request.data.get('nome')
            if nome:
                Escola.objects.get_or_create(nome=nome)
                return Response({'mensagem': 'Escola adicionada com sucesso!'})
            return Response({'erro': 'Nome inválido'}, status=400)

        elif acao == 'remover_escola':
            escola_id = request.data.get('id')
            Escola.objects.filter(id=escola_id).delete()
            return Response({'mensagem': 'Escola removida!'})

        elif acao == 'adicionar_disciplina':
            nome = request.data.get('nome')
            if nome:
                Disciplina.objects.get_or_create(nome=nome)
                return Response({'mensagem': 'Disciplina adicionada com sucesso!'})
            return Response({'erro': 'Nome inválido'}, status=400)

        elif acao == 'remover_disciplina':
            disciplina_id = request.data.get('id')
            Disciplina.objects.filter(id=disciplina_id).delete()
            return Response({'mensagem': 'Disciplina removida!'})

        return Response({'erro': 'Ação desconhecida'}, status=400)

# ============================================================================
# SISTEMA DE NOTIFICAÇÕES (GET e POST)
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_notifications(request):
    """Retorna as 20 notificações mais recentes do usuário."""
    notificacoes = request.user.notificacoes.all()[:20]
    lista = [{
        'id': n.id,
        'titulo': n.titulo,
        'mensagem': n.mensagem,
        'tipo': n.tipo,
        'lida': n.lida,
        'data': timezone.localtime(n.data_criacao).strftime('%d/%m %H:%M')
    } for n in notificacoes]
    
    return Response(lista)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_mark_notifications_read(request):
    """Marca todas as notificações não lidas como lidas."""
    request.user.notificacoes.filter(lida=False).update(lida=True)
    return Response({'mensagem': 'Notificações marcadas como lidas.'})


# ============================================================================
# INTEGRAÇÃO COM IA PARA CATALOGAÇÃO AUTOMÁTICA
# ============================================================================
class AutoCatalogAIView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AICatalogThrottle]

    def post(self, request):
        raw_text = request.data.get('texto', '') or request.data.get('raw_text', '')
        
        if not raw_text or not str(raw_text).strip():
            return Response(
                {'erro': 'Por favor, informe um rascunho ou descrição da aula.'},
                status=400
            )

        try:
            provider = get_llm_provider()
            cataloged_data = provider.catalog_production(str(raw_text))
            return Response(cataloged_data, status=200)
            
        except Exception as e:
            print("\n❌ ERRO NA AUTO-CATALOGAÇÃO COM IA:")
            traceback.print_exc()
            print("=" * 50 + "\n")
            
            return Response(
                {'erro': f'Falha no processamento da IA: {str(e)}'},
                status=500
            )


# ============================================================================
# GERAÇÃO DE PLANO DE AULA COM BNCC E AGENTES (HÍBRIDO HITL)
# ============================================================================
# ============================================================================
# GERAÇÃO DE PLANO DE AULA COM BNCC E AGENTES (HÍBRIDO HITL)
# ============================================================================
import json
import re
import requests
import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

def extrair_bloco_markdown(etapa: str, materia: str, termo_busca: str) -> str:
    """
    Lê o arquivo Markdown fatiado e retorna apenas a seção relevante para economizar tokens.
    """
    if not etapa or not materia:
        return ""

    caminho = os.path.join(settings.BASE_DIR, 'bncc_fatiada', str(etapa).lower(), f"{str(materia).lower()}.md")

    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()
    except FileNotFoundError:
        return ""

    secoes = re.split(r'(?=\n#{2,4} )', conteudo)
    termo = str(termo_busca).upper() if termo_busca else ""

    blocos_relevantes = [secao for secao in secoes if termo in secao.upper()]

    if blocos_relevantes:
        return "".join(blocos_relevantes)[:4000]

    return conteudo[:4000]


def gerar_plano_aula_ia(prompt_livre: str, contexto_bncc: str = "") -> dict:
    """
    Gera plano de aula usando o provedor LLM configurado (Local/UnB/Gemini).
    Retorna JSON estruturado validado (backend-driven UI).

    Novo contrato de saída:
    {
        "titulo": str,
        "nivel": str,
        "categoria": str,
        "bncc": [{"codigo": str, "descricao": str}],
        "bncc_computacao": [{"codigo": str, "descricao": str}],
        "metodologia": str,
        "duracao": str,
        "recursos": [str],
        "passo_a_passo": [str],      # Substitui relato_experiencia
        "avaliacao": str,
        "prompts_ia": str
    }
    """
    try:
        provider = get_llm_provider()
        return provider.catalog_production(prompt_livre, contexto_bncc)
    except Exception as e:
        print(f"\n❌ Erro no provedor LLM ({type(provider).__name__}): {e}")
        # Fallback gracioso - estrutura esperada pelo frontend
        return {
            "titulo": "Plano de Aula (Erro na IA)",
            "nivel": "Fundamental 2",
            "categoria": "Plano de Aula",
            "bncc": [],
            "bncc_computacao": [],
            "metodologia": "A definir pelo professor",
            "duracao": "1 aula de 50 min",
            "recursos": [],
            "passo_a_passo": [
                "A IA não pôde gerar o plano completo.",
                "Revise o tema e tente novamente.",
                "Estruture manualmente sua aula."
            ],
            "avaliacao": "A definir pelo professor",
            "prompts_ia": prompt_livre,
            "modelo_ia": "IA DA UNB",
            "_error": str(e)
        }


class GeradorPlanoAulaView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIPlannerThrottle]

    def post(self, request):
        prompt_livre = request.data.get('prompt', '')
        etapa_ui = request.data.get('etapa')
        materia_ui = request.data.get('materia')
        ano_ui = request.data.get('ano')

        if not prompt_livre:
            return Response({'erro': 'O prompt de busca não pode estar vazio.'}, status=400)

        # 1. Filtros UI assumem precedência
        if etapa_ui and materia_ui and ano_ui:
            etapa_final, materia_final, ano_final = etapa_ui, materia_ui, ano_ui

        # 2. Agente Classificador (Roteamento) - usa modelo do settings
        else:
            system_classificador = (
                "Você é um roteador educacional. Analise o tema e devolva APENAS "
                "um JSON válido com a etapa, materia e ano escolar mais adequados segundo a BNCC. "
                "Exemplo: {\"etapa\": \"fundamental\", \"materia\": \"historia\", \"ano\": \"6º ANO\"}"
            )

            # Usa o provedor LLM configurado para classificação também
            try:
                from .services.llm import get_llm_provider
                provider = get_llm_provider()
                # Chamada simples para classificação
                response = provider.client.chat.completions.create(
                    model=provider.model_name,
                    messages=[
                        {"role": "system", "content": system_classificador},
                        {"role": "user", "content": prompt_livre}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                conteudo_json = response.choices[0].message.content
                conteudo_json = re.sub(r'```json|```', '', conteudo_json).strip()
                classificacao = json.loads(conteudo_json)

                etapa_final = classificacao.get('etapa', 'fundamental')
                materia_final = classificacao.get('materia', 'geral')
                ano_final = classificacao.get('ano', '')
            except Exception as e:
                print(f"❌ Erro no Agente Classificador: {e}")
                etapa_final, materia_final, ano_final = "fundamental", "geral", ""

        # 3. Extração do contexto específico baseado na Rota
        contexto_bncc = extrair_bloco_markdown(etapa_final, materia_final, ano_final)

        # 4. Aciona o Agente Gerador Principal (usa provedor configurado)
        plano_aula_dit = gerar_plano_aula_ia(prompt_livre, contexto_bncc)

        return Response({
            'plano_aula': plano_aula_dit,
            'filtros_utilizados': {
                'etapa': etapa_final,
                'materia': materia_final,
                'ano': ano_final
            }
        }, status=200)


# ============================================================================
# SISTEMA DE EXPORTAÇÃO DE PRODUÇÕES PARA PDF (IFB / MEC)
# ============================================================================
class ExportProducaoPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            producao = Producao.objects.get(pk=pk)
        except Producao.DoesNotExist:
            return HttpResponse("Produção não encontrada.", status=404)

        try:
            docente_param = request.GET.get('docente', '').strip()
            
            autor_nome = docente_param or getattr(producao, 'autor', None)
            if not autor_nome and hasattr(producao, 'user') and producao.user:
                autor_nome = producao.user.first_name or producao.user.username
            
            recursos_raw = getattr(producao, 'recursos', '-')
            recursos_str = (
                ", ".join(recursos_raw)
                if isinstance(recursos_raw, list)
                else str(recursos_raw or '-')
            )

            context = {
                'producao': producao,
                'docente': autor_nome or 'Não informado',
                'nivel_ensino': getattr(producao, 'nivel_ensino', None) or getattr(producao, 'nivel', '-'),
                'relato': getattr(producao, 'experiencia', None) or getattr(producao, 'relato', 'Não informado.'),
                'recursos_str': recursos_str,
            }

            html_string = render_to_string('relatorio_gdf.html', context)

            pdf_bytes = HTML(
                string=html_string,
                base_url=None  # SSRF protection: não resolver URLs relativas
            ).write_pdf()

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="plano_de_aula_{pk}_IFB.pdf"'
            return response

        except Exception as e:
            print("\n❌ ERRO NA GERAÇÃO DO PDF:")
            traceback.print_exc()
            return HttpResponse(f"Erro ao gerar PDF: {str(e)}", status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_health_check(request):
    """
    Health check endpoint para Docker/load balancer.
    Não requer autenticação.
    """
    from django.db import connection
    from django.core.cache import cache

    health = {
        'status': 'healthy',
        'database': 'ok',
        'cache': 'ok',
    }

    # Verificar banco de dados
    try:
        connection.ensure_connection()
    except Exception:
        health['database'] = 'error'
        health['status'] = 'unhealthy'

    # Verificar cache
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') != 'ok':
            health['cache'] = 'error'
            health['status'] = 'unhealthy'
    except Exception:
        health['cache'] = 'error'
        health['status'] = 'unhealthy'

    status_code = 200 if health['status'] == 'healthy' else 503
    return Response(health, status=status_code)

