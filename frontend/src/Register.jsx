import React, { useState, useEffect } from "react"
import api from "../src/services/api"
import { useNavigate, Link } from "react-router-dom"
import {
  User, Mail, Lock, AtSign, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, BookOpen, School, ArrowLeft,
} from "lucide-react"

const DISCIPLINAS_BASE = [
  "História", "Matemática", "Geografia", "Português", "Ciências", 
  "Física", "Química", "Biologia", "Inglês", "Artes", 
  "Educação Física", "Filosofia", "Sociologia", "Pedagogia", 
  "Projeto de vida", "Computação",
]
const ESCOLAS_BASE = ["Universidade de Brasília", "CEMI-Gama"]

const Register = () => {
  const [formData, setFormData] = useState({
    name: "", username: "", email: "", password: "",
    confirmPassword: "", disciplina: "", escola: "",
  })
  const [disciplinas, setDisciplinas] = useState(DISCIPLINAS_BASE)
  const [escolas, setEscolas] = useState(ESCOLAS_BASE)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [aceitouTermos, setAceitouTermos] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get("api/register-options/")
        let combinedEscolas = Array.from(new Set([...ESCOLAS_BASE, ...response.data.escolas]))
        let combinedDisciplinas = Array.from(new Set([...DISCIPLINAS_BASE, ...response.data.disciplinas]))
        combinedDisciplinas = combinedDisciplinas.filter((disc) => disc !== "Outra")
        combinedEscolas.sort((a, b) => a.localeCompare(b))
        combinedDisciplinas.sort((a, b) => a.localeCompare(b))
        setEscolas(combinedEscolas)
        setDisciplinas(combinedDisciplinas)
      } catch (err) {
        console.error("Erro ao buscar opções do banco, usando apenas as fixas:", err)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    const pwd = formData.password
    if (pwd.length < 8) return setError("A senha precisa ter no mínimo 8 caracteres.")
    if (!/[A-Z]/.test(pwd)) return setError("A senha precisa ter pelo menos uma letra maiúscula.")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return setError("A senha precisa ter pelo menos um símbolo especial (ex: !@#$%^&*).")
    if (pwd !== formData.confirmPassword) return setError("As senhas não coincidem.")
    if (!formData.escola) return setError("Por favor, selecione sua escola.")
    if (!formData.disciplina) return setError("Por favor, selecione sua área de atuação.")
    if (!aceitouTermos) return setError("Você precisa ler e concordar com os Termos de Uso e a Política de Privacidade.")

    setIsLoading(true)
    try {
      await api.post("api/register/", { ...formData })
      alert("Conta criada com sucesso! Aguarde a aprovação do administrador.")
      navigate("/login")
    } catch (err) {
      if (err.response && err.response.data.erro) setError(err.response.data.erro)
      else if (err.code === "ERR_NETWORK") setError("Erro de conexão. Verifique se o servidor Django está rodando.")
      else setError("Ocorreu um erro ao criar a conta. Verifique os dados.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide"

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 md:py-12 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        <button 
          onClick={() => navigate("/login")} 
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors bg-transparent border-none"
        >
          <ArrowLeft size={16} /> Voltar ao Login
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-8 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Criar Conta</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Preencha seus dados para entrar na comunidade T.E.I.A.</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            
            <div>
              <label className={labelClass}>Nome Completo</label>
              <div className="relative group">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  placeholder="Como quer ser chamado?"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Usuário</label>
                <div className="relative group">
                  <AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <input
                    type="text" name="username" value={formData.username} onChange={handleChange} required
                    placeholder="user123"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>E-mail</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    placeholder="prof@escola.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Sua Escola</label>
                <div className="relative group">
                  <School size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <select
                    name="escola" value={formData.escola} onChange={handleChange} required disabled={isLoadingOptions}
                    className={`${inputClass} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>{isLoadingOptions ? "Carregando..." : "Selecione a escola"}</option>
                    {escolas.map((escola, i) => <option key={i} value={escola}>{escola}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Disciplina / Área</label>
                <div className="relative group">
                  <BookOpen size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <select
                    name="disciplina" value={formData.disciplina} onChange={handleChange} required disabled={isLoadingOptions}
                    className={`${inputClass} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>{isLoadingOptions ? "Carregando..." : "Selecione a área"}</option>
                    {disciplinas.map((disc, i) => <option key={i} value={disc}>{disc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Senha</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required
                    placeholder="8+ caracteres"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirmar Senha</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                    placeholder="Repita a senha"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end -mt-3">
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1565C0] dark:text-slate-400 transition-colors bg-transparent border-none">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
              </button>
            </div>

            <div className="flex items-start gap-3 mt-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox" id="termos" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
              />
              <label htmlFor="termos" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none m-0">
                Li e concordo com os <Link to="/termos" target="_blank" className="text-[#1565C0] dark:text-blue-400 font-bold hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="text-[#1565C0] dark:text-blue-400 font-bold hover:underline">Política de Privacidade</Link>.
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 font-bold">
                <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={isLoading || isLoadingOptions}
              className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-colors border-none disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : <>Cadastrar <ArrowRight size={18} /></>}
            </button>

            <div className="text-center mt-2 border-t border-slate-200 dark:border-slate-800 pt-6">
              <span className="text-sm text-slate-500 dark:text-slate-400">Já tem uma conta? </span>
              <Link to="/login" className="text-sm font-bold text-[#1565C0] dark:text-blue-400 hover:underline">
                Fazer Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register