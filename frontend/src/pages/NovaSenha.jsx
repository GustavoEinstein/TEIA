import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const NovaSenha = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirm) {
            setErrorMessage("As senhas não coincidem.");
            setStatus('error');
            return;
        }
        if (password.length < 8) {
            setErrorMessage("A senha deve ter no mínimo 8 caracteres.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            await api.post(`api/password_reset_confirm/${uid}/${token}/`, { password });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            const msg = error.response?.data?.erro || "O link é inválido ou expirou. Solicite novamente.";
            setErrorMessage(msg);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
            <div className="w-full max-w-[420px] mb-6">
                <button 
                  onClick={() => navigate("/login")} 
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-semibold text-sm transition-colors"
                >
                  <ArrowLeft size={16} /> Voltar ao Login
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-[420px] p-8 md:p-10 text-center">
                
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Definir Nova Senha</h2>

                {status === 'success' ? (
                    <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 p-6 rounded-xl flex flex-col items-center animate-in fade-in zoom-in">
                        <CheckCircle2 size={48} className="mb-4 text-emerald-500" />
                        <h3 className="text-xl font-bold mb-2">Senha Alterada!</h3>
                        <p className="text-sm leading-relaxed">
                            Sua senha foi atualizada com sucesso.<br/>
                            Redirecionando para o login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5 text-left">
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-2">Crie uma nova senha segura para sua conta.</p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Nova Senha</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="password" 
                                    required 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="Mínimo de 8 caracteres"
                                    disabled={status === 'loading'}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Confirmar Senha</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="password" 
                                    required 
                                    value={confirm} 
                                    onChange={e => setConfirm(e.target.value)} 
                                    placeholder="Repita a senha"
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
                            {status === 'loading' ? 'Salvando...' : 'Alterar Senha'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default NovaSenha;