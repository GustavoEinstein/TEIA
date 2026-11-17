import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Cookie, X, Check, ChevronDown, ChevronUp, Shield, Database, Megaphone, Loader2 } from "lucide-react";

/**
 * Banner de Consentimento de Cookies - LGPD Compliant
 *
 * Regras de exibição (conforme LGPD Art. 8º e guia ANPD):
 * 1. Primeira visita: mostra IMEDIATAMENTE em QUALQUER página
 * 2. Se ACEITOU (qualquer opção): NUNCA mais exibe (salvo mudança de versão)
 * 3. Se NÃO interagiu: re-exibe a cada 180 dias (6 meses)
 * 4. Usuários logados: sincroniza com backend (fonte da verdade)
 * 5. Sempre permite retirada de consentimento (Art. 8º §5º LGPD)
 * 6. Consentimento deve ser LIVRE, INFORMADO e INEQUÍVOCO
 * 7. Opção "Rejeitar não essenciais" deve ter mesmo destaque de "Aceitar todos"
 */
const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Categorias de cookies - linguagem simples e acolhedora
  const cookieCategories = [
    {
      id: 'essential',
      name: 'Essenciais',
      description: 'Necessários para o site funcionar: mantêm você logado, protegem sua segurança (CSRF, sessão). Não podem ser desativados.',
      required: true,
      cookies: [
        { name: 'refresh_token', purpose: 'Sessão JWT (7 dias), HttpOnly, Secure, SameSite=Strict — proteção contra XSS' },
        { name: 'access_token', purpose: 'Token JWT (30 min), apenas em memória — não é cookie' },
        { name: 'csrftoken', purpose: 'Proteção CSRF em formulários stateful' },
        { name: 'sessionid', purpose: 'Sessão Django admin (se aplicável)' },
      ],
    },
    {
      id: 'analytics',
      name: 'Análise e Desempenho',
      description: 'Nos ajudam a entender como a plataforma é usada para melhorar a experiência (páginas visitadas, tempo, erros). Dados anonimizados.',
      required: false,
      cookies: [
        { name: '_ga, _gid', purpose: 'Google Analytics (futuro) — métricas anônimas de uso' },
        { name: 'teia_analytics', purpose: 'Analytics próprio (futuro) — sem dados pessoais' },
      ],
    },
    {
      id: 'marketing',
      name: 'Comunicação e Novidades',
      description: 'Permitem avisar você sobre novidades da comunidade T.E.I.A e personalizar sua experiência.',
      required: false,
      cookies: [
        { name: 'teia_prefs', purpose: 'Preferências de UI (tema, layout) — futuro' },
        { name: 'teia_notifs', purpose: 'Permissão para notificações push — futuro' },
      ],
    },
  ];

  // Constantes de controle
  const REPROMPT_DAYS = 180; // Re-perguntar a cada 180 dias se não interagiu
  const STORAGE_KEY = "teia_cookie_consent";
  const CURRENT_CONSENT_VERSION = "1.1"; // Versão do consentimento (incrementar se categorias mudarem)

  // Verificar se deve exibir o banner
  const shouldShowBanner = useCallback(() => {
    // 1. Se já aceitou (localStorage ou backend), NUNCA mais mostra (salvo mudança de versão)
    if (isAuthenticated && user) {
      // Para usuários logados, o backend é a fonte da verdade
      // O check é feito via API no useEffect abaixo
      return false;
    }

    // 2. Usuários não logados: verificar localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { accepted, version, timestamp } = JSON.parse(stored);
        if (accepted && version === CURRENT_CONSENT_VERSION) {
          // Aceitou versão atual - NUNCA mais mostra
          return false;
        }
        // Não aceitou OU versão antiga - verificar se passou o período de re-prompt
        const lastPrompt = new Date(timestamp);
        const daysSincePrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSincePrompt >= REPROMPT_DAYS;
      } catch {
        // localStorage corrompido - mostrar banner
        return true;
      }
    }

    // 3. Primeira visita - mostrar
    return true;
  }, [isAuthenticated, user]);

  // Verificar consentimento salvo (backend para logados, localStorage para anônimos)
  useEffect(() => {
    const checkConsent = async () => {
      if (isAuthenticated) {
        try {
          const response = await api.get("api/user/consent/");
          const {
            cookies_accepted_at,
            cookies_consent
          } = response.data;

          // Se já deu consentimento (essenciais) no backend, nunca mais mostra banner
          // Mas ainda permite gerenciar preferências via página de configurações
          if (cookies_accepted_at && cookies_consent) {
            setShowBanner(false);
            return;
          }

          // Se não aceitou, mostra banner
          setShowBanner(true);
        } catch {
          // Erro na API - mostra banner por segurança
          setShowBanner(true);
        }
      } else {
        // Usuário não logado - usar localStorage
        setShowBanner(shouldShowBanner());
      }
    };

    checkConsent();
  }, [isAuthenticated, user, shouldShowBanner]);

  // Sincronizar localStorage → backend ao logar
  useEffect(() => {
    if (isAuthenticated && user) {
      const localConsent = localStorage.getItem(STORAGE_KEY);
      if (localConsent) {
        try {
          const { accepted, analytics_consent, marketing_consent } = JSON.parse(localConsent);
          if (accepted) {
            api.patch("api/user/consent/", {
              cookies_consent: true,
              analytics_consent: !!analytics_consent,
              marketing_consent: !!marketing_consent,
            })
              .then(() => localStorage.removeItem(STORAGE_KEY))
              .catch(() => {});
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [isAuthenticated, user]);

  const saveConsent = async (consentData) => {
    setSaving(true);
    try {
      if (isAuthenticated) {
        await api.patch("api/user/consent/", consentData);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...consentData,
          accepted: true,
          version: CURRENT_CONSENT_VERSION,
          timestamp: new Date().toISOString(),
        }));
      }
      setShowBanner(false);
      setShowDetails(false);
    } catch (_) {
      console.error("Erro ao salvar consentimento:", _);
    } finally {
      setSaving(false);
    }
  };

  const acceptAll = () => saveConsent({
    cookies_consent: true,
    analytics_consent: true,
    marketing_consent: true
  });

  const rejectNonEssential = () => saveConsent({
    cookies_consent: true, // Essenciais SEMPRE true
    analytics_consent: false,
    marketing_consent: false
  });

  const goToSettings = () => {
    setShowBanner(false);
    if (isAuthenticated) {
      navigate("/perfil?tab=conta");
    } else {
      navigate("/login");
    }
  };

  // Não renderiza se não deve mostrar
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-slide-up" role="dialog" aria-label="Consentimento de cookies" aria-describedby="cookie-banner-desc">
      <div className="w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden" tabIndex={-1}>
          {/* Header compacto */}
          <div className="flex items-start justify-between p-3 md:p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg" aria-hidden="true">
                <Cookie size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 id="cookie-banner-desc" className="font-bold text-slate-900 dark:text-white text-sm">
                  Cookies & Privacidade
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Usamos cookies essenciais. Opcionais nos ajudam a melhorar.
                  <a href="/privacidade#cookies" className="text-[#1565C0] underline hover:text-blue-700 ml-1">Saiba mais</a>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
              aria-label={showDetails ? "Fechar detalhes" : "Ver detalhes"}
              aria-expanded={showDetails}
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="text-[11px] font-medium hidden sm:inline">{showDetails ? "Menos" : "Detalhes"}</span>
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-3 md:p-4 max-h-[60vh] overflow-y-auto">
            {/* Categorias (sempre visíveis) */}
            <div className="space-y-2 mb-3" role="group" aria-labelledby="cookie-categories-label">
              <p id="cookie-categories-label" className="sr-only">Categorias de cookies</p>

              {cookieCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-start gap-2 p-2.5 rounded-lg transition-colors ${
                    cat.required
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50'
                  }`}
                >
                  <div className={`p-1.5 rounded shrink-0 ${
                    cat.required
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-blue-100 dark:bg-blue-900/40'
                  }`} aria-hidden="true">
                    {cat.required ? <Check size={14} className="text-green-600 dark:text-green-400" /> : <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold text-xs ${cat.required ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                        {cat.name} {cat.required && <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">Sempre ativo</span>}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{cat.description}</p>
                  </div>
                  {cat.required && <Check size={14} className="text-green-600 dark:text-green-400 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Detalhes expansíveis */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
                {cookieCategories.map((cat) => (
                  <details key={cat.id} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 list-none">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${
                          cat.required ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
                        }`}>
                          {cat.required ? <Shield size={14} className="text-green-600 dark:text-green-400" /> :
                           cat.id === 'analytics' ? <Database size={14} className="text-blue-600 dark:text-blue-400" /> :
                           <Megaphone size={14} className="text-purple-600 dark:text-purple-400" />}
                        </div>
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{cat.name}</span>
                        {cat.required && <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">Obrigatório</span>}
                      </div>
                      <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 ml-6 space-y-2">
                      <p className="text-[12px] text-slate-600 dark:text-slate-400">{cat.description}</p>
                      <div className="space-y-1.5">
                        {cat.cookies.map((cookie, j) => (
                          <div key={j} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono block mb-0.5">{cookie.name}</code>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">{cookie.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Botões de ação - LGPD: mesma prominência para Aceitar e Rejeitar */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700" role="group" aria-labelledby="cookie-actions-label">
              <p id="cookie-actions-label" className="sr-only">Ações de consentimento</p>
              <button
                onClick={acceptAll}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-lg transition-colors text-xs disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Aceitar todos
                  </>
                )}
              </button>
              <button
                onClick={rejectNonEssential}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-3 rounded-lg transition-colors text-xs disabled:opacity-50"
              >
                <X size={14} /> Rejeitar não essenciais
              </button>
            </div>

            {/* Botão personalizar (quando não está expandido) */}
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="w-full flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-medium py-2 px-3 rounded-lg transition-colors text-xs mt-2"
              >
                <ChevronDown size={14} /> Personalizar preferências
              </button>
            )}

            {/* Link para configurações */}
            <p className="text-[10px] text-slate-500 dark:text-slate-500 text-center mt-3">
              Pode alterar suas preferências a qualquer momento nas{' '}
              <button onClick={goToSettings} className="text-[#1565C0] underline hover:text-blue-700 font-medium">Configurações da Conta</button>
              {' '}ou consultar nossa{' '}
              <a href="/privacidade#cookies" className="text-[#1565C0] underline hover:text-blue-700">Política de Cookies</a>.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        button:focus-visible, a:focus-visible, summary:focus-visible {
          outline: 2px solid #1565C0;
          outline-offset: 2px;
        }
        .max-h-\\[60vh\\]::-webkit-scrollbar { width: 6px; }
        .max-h-\\[60vh\\]::-webkit-scrollbar-track { background: transparent; }
        .max-h-\\[60vh\\]::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
        .max-h-\\[60vh\\]::-webkit-scrollbar-thumb:hover { background: #64748b; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
};

export default CookieConsentBanner;