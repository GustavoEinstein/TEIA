import React, { useState } from "react"
import api from "./services/api" // Ajuste o caminho se necessário
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, User, Lock, Loader2 } from "lucide-react"

// Novo Ícone Exclusivo: Teia com a aranha descendo!
const SpiderWebIcon = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Teia principal */}
    <path d="M12 2v10" />
    <path d="M2 12h20" />
    <path d="M4.93 4.93l14.14 14.14" />
    <path d="M19.07 4.93L4.93 19.07" />
    <path d="M12 7 L15.53 8.47 L17 12 L15.53 15.53 L12 17 L8.47 15.53 L7 12 L8.47 8.47 Z" />
    <path d="M12 3 L18.36 5.64 L21 12 L18.36 18.36 L12 21 L5.64 18.36 L3 12 L5.64 5.64 Z" />
    {/* Fio da aranha caindo */}
    <path d="M12 12 v7" strokeDasharray="2 2" className="animate-pulse opacity-70" />
    {/* Aranhazinha */}
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    <path d="M10 18l1 1 M14 18l-1 1 M10 20l1-1 M14 20l-1-1" />
  </svg>
)

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const urlToken = "api/token/"
      const response = await api.post(urlToken, { username, password })
      const token = response.data.access
      localStorage.setItem("access_token", token)
      localStorage.setItem("refresh_token", response.data.refresh)

      const urlUser = "api/user/me/"
      const userResponse = await api.get(urlUser, {
        headers: { Authorization: `Bearer ${token}` },
      })

      localStorage.setItem("user_name", userResponse.data.username || "Admin")
      localStorage.setItem(
        "user_disciplina",
        userResponse.data.disciplina || "Geral",
      )
      if (userResponse.data.avatar)
        localStorage.setItem("user_avatar", userResponse.data.avatar)
      if (userResponse.data.is_superuser)
        localStorage.setItem("is_superuser", "true")
      else localStorage.removeItem("is_superuser")

      window.dispatchEvent(new Event("storage"))
      window.location.href = "/dashboard"
    } catch (err) {
      if (err.code === "ERR_NETWORK")
        setError("Erro de conexão. Verifique se o servidor está rodando.")
      else if (err.response && err.response.status === 429)
        setError("Muitas tentativas falhadas. Aguarde 1 minuto.")
      else if (err.response && err.response.status === 401) {
        const detailMessage = err.response.data.detail
        setError(detailMessage || "Usuário ou senha incorretos.")
      } else setError("Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Círculo de fundo decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 dark:bg-emerald-600/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[420px] z-10">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-semibold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/50">
              <SpiderWebIcon size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">T.E.I.A</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tecendo Educação com Inteligência Artificial</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Usuário
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white placeholder-slate-400"
                />
              </div>
              <div className="text-right mt-2">
                <Link to="/esqueceu-senha" className="text-xs font-semibold text-slate-500 hover:text-[#1565C0] dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Conectando...</> : "Entrar"}
            </button>

            <div className="text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="text-sm text-slate-500 dark:text-slate-400">Não tem conta? </span>
              <Link to="/register" className="text-sm font-bold text-[#1565C0] dark:text-blue-400 hover:underline">
                Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login