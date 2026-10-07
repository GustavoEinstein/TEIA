import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  ArrowLeft, Trophy, History, Plus, TrendingUp, Award, User,
  Trash2, ShieldCheck, Loader2, Star, Zap, Crown, Flame, Target,
  Book, Lightbulb, Medal, ThumbsUp, Heart, Rocket, Shield,
} from "lucide-react"

const ICONS_DISPONIVEIS = [
  "award", "star", "zap", "crown", "flame", "target", "book",
  "lightbulb", "medal", "thumbsup", "heart", "rocket", "shield", "trophy",
]

const getIcon = (name, size = 18, colorClass = "text-amber-500") => {
  const props = { size, className: `shrink-0 ${colorClass}` }
  switch (name) {
    case "star": return <Star {...props} />
    case "zap": return <Zap {...props} />
    case "crown": return <Crown {...props} />
    case "flame": return <Flame {...props} />
    case "target": return <Target {...props} />
    case "book": return <Book {...props} />
    case "lightbulb": return <Lightbulb {...props} />
    case "medal": return <Medal {...props} />
    case "thumbsup": return <ThumbsUp {...props} />
    case "heart": return <Heart {...props} />
    case "rocket": return <Rocket {...props} />
    case "shield": return <Shield {...props} />
    case "trophy": return <Trophy {...props} />
    case "award":
    default: return <Award {...props} />
  }
}

export default function GamificacaoAdmin() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const [dados, setDados] = useState({ conquistas_disponiveis: [], auditoria_xp: [] })
  const [usuarios, setUsuarios] = useState([])
  const [novaConquista, setNovaConquista] = useState({ nome: "", descricao: "", xp_bonus: 50, icone: "award" })
  const [atribuicao, setAtribuicao] = useState({ usuario_id: "", conquista_id: "" })

  useEffect(() => {
    fetchDados()
    fetchUsuarios()
  }, [])

  const fetchDados = async () => {
    try {
      const response = await api.get("api/admin/gamificacao/")
      setDados(response.data)
    } catch (err) {
      console.error("Erro", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsuarios = async () => {
    try {
      const response = await api.get("api/admin/users/")
      setUsuarios(response.data.filter((u) => !u.is_superuser))
    } catch (err) {
      console.error("Erro", err)
    }
  }

  const handleCreateBadge = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post("api/admin/gamificacao/", novaConquista)
      Swal.fire({ icon: "success", title: "Badge Criada!", timer: 1500, showConfirmButton: false })
      fetchDados()
      setNovaConquista({ nome: "", descricao: "", xp_bonus: 50, icone: "award" })
    } catch (err) {
      Swal.fire("Erro", "Erro ao criar badge.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAtribuirBadge = async (e) => {
    e.preventDefault()
    if (!atribuicao.usuario_id || !atribuicao.conquista_id) return Swal.fire("Atenção", "Selecione usuário e medalha.", "warning")
    setIsAssigning(true)
    try {
      await api.post("api/admin/gamificacao/atribuir/", atribuicao)
      Swal.fire({ icon: "success", title: "Atribuída!", text: "Concedido ao professor.", timer: 2000, showConfirmButton: false })
      fetchDados()
      setAtribuicao({ usuario_id: "", conquista_id: "" })
    } catch (err) {
      Swal.fire("Ops!", err.response?.data?.erro || "Erro", "error")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDeleteBadge = async (id) => {
    const confirm = await Swal.fire({
      title: "Deletar Badge?", text: "Isso removerá a medalha do sistema.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#DC2626"
    })
    if (!confirm.isConfirmed) return
    try {
      await api.delete(`api/admin/gamificacao/${id}/delete/`)
      fetchDados()
    } catch (err) {
      Swal.fire("Erro", "Erro ao excluir.", "error")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Carregando Hall da Fama...</p>
    </div>
  )

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 mt-4 uppercase tracking-wide"

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto">
        
        <header className="mb-8">
          <button onClick={() => navigate("/dashboard/central-admin")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Voltar à Central
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
              <Trophy size={28} className="text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão do Hall da Fama</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a economia de XP e distribua medalhas.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><Trophy className="text-amber-500" size={24}/></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Badges</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{dados.conquistas_disponiveis.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30"><TrendingUp className="text-emerald-600 dark:text-emerald-500" size={24}/></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Movimentações de XP</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{dados.auditoria_xp.length}</h3>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="flex-1 w-full flex flex-col gap-8">
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck size={20} className="text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Conceder Medalha e XP</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Reconheça professores manualmente concedendo uma badge específica e seu respectivo bônus de XP.</p>

              <form onSubmit={handleAtribuirBadge} className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Professor</label>
                  <select value={atribuicao.usuario_id} onChange={(e) => setAtribuicao({ ...atribuicao, usuario_id: e.target.value })} required className={`${inputClass} bg-white dark:bg-slate-900 cursor-pointer`}>
                    <option value="">Selecione o professor...</option>
                    {usuarios.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.disciplina})</option>)}
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Medalha</label>
                  <select value={atribuicao.conquista_id} onChange={(e) => setAtribuicao({ ...atribuicao, conquista_id: e.target.value })} required className={`${inputClass} bg-white dark:bg-slate-900 cursor-pointer`}>
                    <option value="">Selecione a medalha...</option>
                    {dados.conquistas_disponiveis.map((c) => <option key={c.id} value={c.id}>{c.nome} (+{c.xp_bonus} XP)</option>)}
                  </select>
                </div>
                <button type="submit" disabled={isAssigning} className="w-full md:w-auto h-[46px] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 rounded-lg font-bold text-sm transition-colors shadow-md shadow-amber-500/20">
                  {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />} Atribuir
                </button>
              </form>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center gap-3 p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <History size={20} className="text-[#1565C0] dark:text-blue-400" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Auditoria de XP</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Professor</th>
                      <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Ação</th>
                      <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Valor</th>
                      <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.auditoria_xp.map((log, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><User size={14} className="text-slate-400"/> {log.usuario}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{log.descricao}</td>
                        <td className="p-4 text-sm font-black text-emerald-600 dark:text-emerald-400">+{log.quantidade}</td>
                        <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-500">{log.data}</td>
                      </tr>
                    ))}
                    {dados.auditoria_xp.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-slate-500 text-sm">Nenhuma movimentação registrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Plus size={18} className="text-[#1565C0] dark:text-blue-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Nova Badge</h2>
              </div>
              <form onSubmit={handleCreateBadge} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Nome da Medalha</label>
                  <input type="text" value={novaConquista.nome} onChange={(e) => setNovaConquista({ ...novaConquista, nome: e.target.value })} required placeholder="Ex: Curador Mestre" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Descrição</label>
                  <textarea value={novaConquista.descricao} onChange={(e) => setNovaConquista({ ...novaConquista, descricao: e.target.value })} required rows="2" placeholder="Para que serve?" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Escolha o Ícone</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {ICONS_DISPONIVEIS.map((iconName) => {
                      const isSelected = novaConquista.icone === iconName
                      return (
                        <button
                          type="button" key={iconName} onClick={() => setNovaConquista({ ...novaConquista, icone: iconName })}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {getIcon(iconName, 18, isSelected ? "text-amber-600 dark:text-amber-500" : "text-slate-400")}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">XP Bônus</label>
                  <input type="number" value={novaConquista.xp_bonus} onChange={(e) => setNovaConquista({ ...novaConquista, xp_bonus: e.target.value })} className={inputClass} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-blue-500/20">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar Badge
                </button>
              </form>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Badges Ativas</h3>
              <div className="flex flex-col gap-3">
                {dados.conquistas_disponiveis.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      {getIcon(c.icone, 20, "text-amber-500")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{c.nome}</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">+{c.xp_bonus} XP</p>
                    </div>
                    <button onClick={() => handleDeleteBadge(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {dados.conquistas_disponiveis.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Nenhuma badge criada.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}