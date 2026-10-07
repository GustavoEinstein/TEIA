import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const SpiderWebIcon = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v10" /> <path d="M2 12h20" /> <path d="M4.93 4.93l14.14 14.14" /> <path d="M19.07 4.93L4.93 19.07" />
    <path d="M12 7 L15.53 8.47 L17 12 L15.53 15.53 L12 17 L8.47 15.53 L7 12 L8.47 8.47 Z" />
    <path d="M12 3 L18.36 5.64 L21 12 L18.36 18.36 L12 21 L5.64 18.36 L3 12 L5.64 5.64 Z" />
    <path d="M12 12 v7" strokeDasharray="2 2" className="animate-pulse opacity-70" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    <path d="M10 18l1 1 M14 18l-1 1 M10 20l1-1 M14 20l-1-1" />
  </svg>
)

const EsqueceuSenha = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); 
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');
        
        try {
            await api.post('api/password_reset/', { email });
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage('Ocorreu um erro ao tentar enviar o e-mail. Tente novamente mais tarde.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-300">
            
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-[420px] z-10 mb-6">
                <button 
                  onClick={() => navigate('/login')} 
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-semibold text-sm transition-colors"
                >
                  <ArrowLeft size={16} /> Voltar ao Login
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-[420px] p-8 md:p-10">
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/50">
                        <SpiderWebIcon size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Recuperar Senha</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Informe seu e-mail cadastrado para receber as instruções de redefinição.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 p-6 rounded-xl flex flex-col items-center text-center animate-in fade-in zoom-in">
                        <CheckCircle2 size={40} className="mb-4 text-emerald-500" />
                        <h3 className="font-extrabold text-lg mb-2">E-mail Enviado!</h3>
                        <p className="text-sm leading-relaxed mb-4">
                            Se o e-mail <strong>{email}</strong> estiver em nossa base de dados, você receberá um link em instantes.
                        </p>
                        <p className="text-[11px] font-black uppercase tracking-widest opacity-80">
                            Não se esqueça da caixa de spam.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">E-mail Cadastrado</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ex: professor@escola.com"
                                    disabled={status === 'loading'}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {status === 'loading' ? 'Processando...' : 'Enviar Link de Recuperação'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EsqueceuSenha;