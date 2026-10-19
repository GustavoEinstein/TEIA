"""Módulo de URLs de kipo_playground"""

from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import AutoCatalogAIView, ExportProducaoPDFView

urlpatterns = [
    
    # ============================================================================
    # 1. AUTENTICAÇÃO E REGISTRO
    # ============================================================================
    path('api/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.api_register_user, name='register_user'),

    # ============================================================================
    # 2. PERFIL DO USUÁRIO, GAMIFICAÇÃO E NOTIFICAÇÕES
    # ============================================================================
    path('api/user/me/', views.api_user_profile, name='user_profile'),
    path('api/password_reset/', views.api_password_reset_request, name='password_reset_request'),
    path('api/password_reset_confirm/<uidb64>/<token>/', views.api_password_reset_confirm, name='password_reset_confirm'),
    path('api/notificacoes/', views.api_list_notifications, name='list_notifications'),
    path('api/notificacoes/ler/', views.api_mark_notifications_read, name='mark_notifications_read'),

    # ============================================================================
    # 3. PRODUÇÕES DIDÁTICAS E IA (CRUD)
    # ============================================================================
    path('api/production/create/', views.api_create_production, name='create_production'),
    path('api/production/list/', views.api_list_my_productions, name='list_my_productions'),
    path('api/production/<int:pk>/', views.api_get_production_details, name='get_production_details'),
    path('api/production/<int:pk>/update/', views.api_update_production, name='update_production'),
    path('api/production/<int:pk>/toggle-author/', views.api_toggle_author_visibility, name='toggle_author'),

    # --- (IA E EXPORTAÇÃO EM PDF) ---
    path('api/production/auto-catalog-ai/', AutoCatalogAIView.as_view(), name='auto_catalog_ai'),
    path('api/production/<int:pk>/export-pdf/', ExportProducaoPDFView.as_view(), name='export_production_pdf'),

    # ============================================================================
    # 4. SISTEMA DE REVISÃO (DUPLO-CEGO E XP)
    # ============================================================================
    path('api/production/review-list/', views.api_list_review_queue, name='list_review_queue'),
    path('api/production/<int:pk>/review/', views.api_submit_review, name='submit_review'),
    path('api/production/history/', views.api_review_history, name='review_history'),

    # ============================================================================
    # 5. FEED PÚBLICO E RANKING GLOBAL
    # ============================================================================
    path('api/public/feed/', views.api_list_public_feed, name='public_feed'),
    path('api/ranking/', views.api_ranking_gamificacao, name='api_ranking'),

    # ============================================================================
    # 6. FÓRUM DE RASCUNHOS
    # ============================================================================
    path('api/forum/topicos/', views.api_forum_topicos, name='forum_topicos'),
    path('api/forum/topicos/<int:pk>/', views.api_forum_detalhe_comentarios, name='forum_detalhes'),

    # ============================================================================
    # 7. CENTRAL DE ADMINISTRAÇÃO E CONFIGURAÇÕES
    # ============================================================================
    path('api/admin/pending-users/', views.api_list_pending_users, name='pending_users'),
    path('api/admin/approve-user/<int:user_id>/', views.api_approve_reject_user, name='approve_user'),
    path('api/admin/users/', views.api_admin_list_users, name='api_admin_list_users'),
    path('api/admin/users/<int:pk>/delete/', views.api_admin_delete_user, name='api_admin_delete_user'),
    path('api/admin/productions/', views.api_admin_list_productions, name='api_admin_list_productions'),
    path('api/admin/productions/<int:pk>/delete/', views.api_admin_delete_production, name='api_admin_delete_production'),
    path('api/admin/forum/', views.api_admin_list_forum, name='api_admin_list_forum'),
    path('api/admin/forum/<int:pk>/delete/', views.api_admin_delete_forum, name='api_admin_delete_forum'),
    path('api/admin/gamificacao/', views.api_admin_gamificacao, name='admin_gamificacao'),
    path('api/admin/gamificacao/<int:pk>/delete/', views.api_admin_delete_badge, name='admin_delete_badge'),
    path('api/admin/gamificacao/atribuir/', views.api_admin_atribuir_badge, name='admin_atribuir_badge'),
    path('api/admin/diario/', views.DiarioOperacaoView.as_view(), name='diario-list-create'),
    path('api/admin/diario/<int:pk>/delete/', views.DiarioOperacaoDeleteView.as_view(), name='diario-delete'),
    path('api/admin/diario/<int:pk>/notas/', views.DiarioNotaView.as_view(), name='diario-notas'),
    path('api/admin/configuracoes/', views.ConfiguracoesGeraisView.as_view(), name='admin_configuracoes'),
    path('api/register-options/', views.api_get_register_options, name='register_options'),
    path('api/ontology/cycles/', views.api_listar_ciclos, name='list_cycles'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)