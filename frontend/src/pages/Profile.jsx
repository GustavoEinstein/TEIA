import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  User, Mail, ArrowLeft, BookOpen, School, 
  Trophy, Zap, Star, History, Award, Info, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');
  const [userData, setUserData] = useState({
    username: '', email: '', disciplina: '', escola: '', avatar: null,
    pontos: 0, nivel: '', progresso: { porcentagem: 0, falta: 0, proximo_marco: 0, label: '' },
    conquistas: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await api.get('api/user/me/', { headers: { Authorization: `Bearer ${token}` } });
      setUserData(response.data);
      updateLocalStorage(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      if (error.response && error.response.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (data) => {
    localStorage.setItem('user_name', data.username);
    localStorage.setItem('user_pontos', data.pontos);
    localStorage.setItem('user_nivel', data.nivel);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
            onClick={() => setActiveTab('dados')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dados' ? 'bg-white dark:bg-slate-900 text-[#1565C0] dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <User size={16} /> Dados Pessoais
          </button>
          <button 
            onClick={() => setActiveTab('conquistas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'conquistas' ? 'bg-white dark:bg-slate-900 text-[#1565C0] dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Award size={16} /> Conquistas
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'dados' ? (
            <div className="flex flex-col gap-3">
              <InfoItem icon={<Mail size={18}/>} label="E-mail" value={userData.email} />
              <InfoItem icon={<School size={18}/>} label="Instituição" value={userData.escola} />
              <InfoItem icon={<BookOpen size={18}/>} label="Área de Atuação" value={userData.disciplina} />
            </div>
          ) : (
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
          )}
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