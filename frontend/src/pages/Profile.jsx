import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User, Mail, ArrowLeft, BookOpen, School,
  Trophy, Zap, Star, History, Award, Info, LogOut,
  Trash2, AlertTriangle, Shield, RotateCcw, Check, Download,
  ToggleLeft, ToggleRight, Cookie, Database, Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');
  const [userData, setUserData] = useState({
    username: '', email: '', disciplina: '', escola: '', avatar: null,
    pontos: 0, nivel: '', progresso: { porcentagem: 0, falta: 0, proximo_marco: 0, label: '' },
    conquistas: []
  });
  // Estados para consentimento granular
  const [consentData, setConsentData] = useState({
    terms_version: null,
    terms_accepted_at: null,
    privacy_version: null,
    privacy_accepted_at: null,
    cookies_accepted_at: null,
    cookies_consent: false,
    analytics_consent: false,
    marketing_consent: false,
    current_terms_version: '4.1',
    current_privacy_version: '1.1',
  });
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentSaving, setConsentSaving] = useState({ analytics: false, marketing: false });
  // Estados para exclusão de conta (2 etapas)
  const [deleteStep, setDeleteStep] = useState(0); // 0 = oculto, 1 = confirmação, 2 = digitando email
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    // Se não autenticado, redirecionar (Proteção extra - PrivateRoute já faz isso)
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchProfile();
    fetchConsent();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      // Usar api.get diretamente - o interceptor já adiciona o Authorization header
      const response = await api.get('api/user/me/');
      setUserData(response.data);
      updateLocalStorage(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      if (error.response && error.response.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchConsent = async () => {
    setConsentLoading(true);
    try {
      const response = await api.get('api/user/consent/');
      setConsentData(response.data);
    } catch (err) {
      console.error('Erro ao buscar consentimentos:', err);
    } finally {
      setConsentLoading(false);
    }
  };

  const updateConsent = async (field, value) => {
    setConsentSaving(prev => ({ ...prev, [field]: true }));
    try {
      await api.patch('api/user/consent/', { [field]: value });
      setConsentData(prev => ({ ...prev, [field]: value }));
    } catch (err) {
      console.error(`Erro ao atualizar ${field}:`, err);
      alert('Erro ao salvar preferência. Tente novamente.');
      // Reverter visualmente
      setConsentData(prev => ({ ...prev, [field]: !value }));
    } finally {
      setConsentSaving(prev => ({ ...prev, [field]: false }));
    }
  };

  const updateLocalStorage = (data) => {
    localStorage.setItem('user_name', data.username);
    localStorage.setItem('user_pontos', data.pontos);
    localStorage.setItem('user_nivel', data.nivel);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    // Apenas limpar dados locais de UI, o logout real é via AuthContext
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_pontos');
    localStorage.removeItem('user_nivel');
    navigate('/');
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // Usar api.get diretamente - o interceptor já adiciona o Authorization header
      const response = await api.get('api/user/export-data/');
      // Criar blob e fazer download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teia-dados-${userData.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== userData.email) {
      setDeleteError('O e-mail não confere. Digite exatamente seu e-mail cadastrado.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // Usar api.delete diretamente - o interceptor já adiciona o Authorization header
      await api.delete('api/user/delete-account/', {
        data: { confirm: true },
      });
      // Limpar apenas dados de UI, logout real será via window.location.href no AuthContext
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_pontos');
      localStorage.removeItem('user_nivel');
      setDeleteStep(2);
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      if (err.response?.data?.erro) {
        setDeleteError(err.response.data.erro);
      } else if (err.code === 'ERR_NETWORK') {
        setDeleteError('Erro de conexão. Verifique se o servidor está rodando.');
      } else {
        setDeleteError('Erro ao excluir conta. Tente novamente.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Render tab content based on activeTab
  const renderTabContent = () => {
    if (activeTab === 'dados') {
      return (
        <div className="flex flex-col gap-3">
          <InfoItem icon={<Mail size={18} />} label="E-mail" value={userData.email} />
          <InfoItem icon={<School size={18} />} label="Instituição" value={userData.escola} />
          <InfoItem icon={<BookOpen size={18} />} label="Área de Atuação" value={userData.disciplina} />
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Portabilidade de Dados (LGPD Art. 18)
            </p>
            <button
              onClick={handleExportData}
              disabled={exportLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {exportLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Preparando download...
                </>
              ) : (
                <>
                  <Download size={18} /> Baixar todos os meus dados (JSON)
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Inclui: perfil, produções, avaliações, fórum, XP, conquistas, notificações e consentimentos.
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === 'conquistas') {
      return (
        <div className="flex flex-col gap-3">
          {userData.conquistas && userData.conquistas.length > 0 ? (
            userData.conquistas.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <Trophy size={22} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px] mb-0.5 leading-tight">{item.nome}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mb-1.5">{item.descricao}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desbloqueado em: {item.data}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <History size={40} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm max-w-[250px]">
                Suas medalhas aparecerão aqui à medida que você participar da comunidade!
              </p>
            </div>
          )}
        </div>
      );
    }

    // activeTab === 'conta'
    return (
      <div className="flex flex-col gap-6">
        {/* Card: Preferências de Cookies e Consentimento (LGPD Art. 8º) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
              <Cookie size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Preferências de Privacidade</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Gerencie seus consentimentos. Cookies essenciais são necessários para o funcionamento do site e não podem ser desativados.
            Você pode alterar suas preferências a qualquer momento (Art. 8º §5º LGPD).
          </p>

          {consentLoading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-6 w-6 text-[#1565C0]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Essenciais */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg">
                    <Shield size={18} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-300">Cookies Essenciais</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Sessão, segurança (CSRF), autenticação</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Sempre ativo</span>
                  <ToggleRight size={20} className="text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                    <Database size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800 dark:text-blue-300">Análise e Desempenho</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Nos ajudam a melhorar a plataforma (dados anonimizados)</p>
                  </div>
                </div>
                <button
                  onClick={() => updateConsent('analytics_consent', !consentData.analytics_consent)}
                  disabled={consentSaving.analytics}
                  className={`relative w-12 h-7 rounded-full transition-colors flex items-center p-1 ${consentData.analytics_consent ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  role="switch"
                  aria-checked={consentData.analytics_consent}
                  aria-label={`Analytics ${consentData.analytics_consent ? 'ativado' : 'desativado'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${consentData.analytics_consent ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg">
                    <Megaphone size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-800 dark:text-purple-300">Comunicação e Novidades</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">Avisos sobre novidades da comunidade T.E.I.A</p>
                  </div>
                </div>
                <button
                  onClick={() => updateConsent('marketing_consent', !consentData.marketing_consent)}
                  disabled={consentSaving.marketing}
                  className={`relative w-12 h-7 rounded-full transition-colors flex items-center p-1 ${consentData.marketing_consent ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  role="switch"
                  aria-checked={consentData.marketing_consent}
                  aria-label={`Marketing ${consentData.marketing_consent ? 'ativado' : 'desativado'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${consentData.marketing_consent ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Histórico de consentimento */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Histórico de Consentimento</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="bg-white dark:bg-slate-800/50 p-2 rounded-lg">
                <p className="font-medium text-slate-800 dark:text-slate-200">Termos de Uso</p>
                <p>v{consentData.terms_version || '—'} • {consentData.terms_accepted_at ? new Date(consentData.terms_accepted_at).toLocaleDateString('pt-BR') : 'Não registrado'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-2 rounded-lg">
                <p className="font-medium text-slate-800 dark:text-slate-200">Política de Privacidade</p>
                <p>v{consentData.privacy_version || '—'} • {consentData.privacy_accepted_at ? new Date(consentData.privacy_accepted_at).toLocaleDateString('pt-BR') : 'Não registrado'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-2 rounded-lg">
                <p className="font-medium text-slate-800 dark:text-slate-200">Cookies</p>
                <p>{consentData.cookies_accepted_at ? new Date(consentData.cookies_accepted_at).toLocaleDateString('pt-BR') : 'Não registrado'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-2 rounded-lg">
                <p className="font-medium text-slate-800 dark:text-slate-200">Versões Atuais</p>
                <p>Termos v{consentData.current_terms_version} • Privacidade v{consentData.current_privacy_version}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Seus Direitos LGPD */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
              <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg">Seus Direitos (LGPD - Art. 18)</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Confirmação e acesso aos seus dados</li>
            <li className="flex items-start gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Correção de dados incompletos/desatualizados</li>
            <li className="flex items-start gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Anonimização, bloqueio ou eliminação</li>
            <li className="flex items-start gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Portabilidade dos dados</li>
            <li className="flex items-start gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Revogação do consentimento</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-3">
            Para exercer seus direitos: <a href="mailto:ishikawa@unb.br" className="underline font-semibold">ishikawa@unb.br</a> (DPO)
          </p>
        </div>

        {/* Card: Exclusão de Conta */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
              <Trash2 size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-red-800 dark:text-red-300 text-lg">Excluir minha conta permanentemente</h3>
          </div>

          {deleteStep === 0 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  <strong className="text-red-700 dark:text-red-400">Esta ação é irreversível.</strong> Ao excluir sua conta:
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 pl-4 list-disc">
                  <li>Seus dados pessoais (nome, e-mail) serão <strong>eliminados</strong>.</li>
                  <li>Suas produções públicas permanecerão no acervo, mas passarão por <strong>anonimização irreversível</strong> (Art. 12 LGPD) — seu nome e e-mail serão dissociados definitivamente.</li>
                  <li>Seu histórico de XP, conquistas, avaliações e participações no fórum serão anonimizados.</li>
                  <li>Você perderá acesso à plataforma e não poderá recuperar a conta.</li>
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Alternativa:</strong> Se quiser apenas sair temporariamente, use o botão <strong>"Sair da Conta"</strong> abaixo. Seus dados permanecerão salvos.
                </p>
              </div>
              <button
                onClick={() => setDeleteStep(1)}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                <AlertTriangle size={18} /> Entendi, quero excluir minha conta
              </button>
            </div>
          )}

          {deleteStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-red-300 dark:border-red-700">
                <p className="font-bold text-red-700 dark:text-red-400 text-sm mb-3">
                  Confirmação final — Digite seu e-mail para confirmar:
                </p>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder={userData.email}
                  className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-3 text-sm focus:border-red-500 focus:outline-none dark:text-white placeholder-slate-400"
                  autoFocus
                />
                {deleteError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> {deleteError}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteStep(0); setDeleteEmail(''); setDeleteError(''); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  <RotateCcw size={16} /> Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteEmail !== userData.email}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Confirmar exclusão definitiva
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-bold text-green-800 dark:text-green-300 text-lg mb-2">
                Conta excluída com sucesso
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400 mb-6">
                Seus dados pessoais foram eliminados e suas produções anonimizadas.<br />
                Obrigado por fazer parte da comunidade T.E.I.A.
              </p>
              <button
                onClick={handleLogout}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >
                Voltar à página inicial
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Zap size={32} className="text-[#1565C0] dark:text-blue-500 animate-pulse" />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Sincronizando seu progresso...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 relative">

        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={18} /> Painel Principal
        </button>

        {/* Cabeçalho do Perfil */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5 inline-block">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#1565C0] text-white flex items-center justify-center text-4xl font-black border-4 border-slate-100 dark:border-slate-800 shadow-md">
                {userData.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-amber-500 p-1.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
              <Star size={14} className="text-white fill-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-1">{userData.username}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{userData.disciplina} • {userData.escola}</p>
        </div>

        {/* XP Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-start mb-5">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Nível Atual</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">{userData.nivel}</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800/50">
              <Zap size={14} className="fill-current" />
              <span>{userData.pontos} XP</span>
            </div>
          </div>

          <div className="w-full">
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#1565C0] to-blue-400 dark:from-blue-600 dark:to-blue-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${userData.progresso?.porcentagem || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              <span>{userData.progresso?.label}</span>
              <span>Faltam {userData.progresso?.falta} XP</span>
            </div>
          </div>
        </div>

        {/* Tabs Modernas */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            onClick={() => { setActiveTab('dados'); setDeleteStep(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dados' ? 'bg-white dark:bg-slate-900 text-[#1565C0] dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <User size={16} /> Dados Pessoais
          </button>
          <button
            onClick={() => { setActiveTab('conquistas'); setDeleteStep(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'conquistas' ? 'bg-white dark:bg-slate-900 text-[#1565C0] dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Award size={16} /> Conquistas
          </button>
          <button
            onClick={() => { setActiveTab('conta'); setDeleteStep(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'conta' ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Shield size={16} /> Conta
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl border-2 border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 font-extrabold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <LogOut size={18} /> Sair da Conta
        </button>

      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/20">
    <div className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{value || "Não informado"}</p>
    </div>
  </div>
);

export default Profile;