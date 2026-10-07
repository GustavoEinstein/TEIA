import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  TrendingUp, School, BookOpen, Save, Plus, Loader2,
  Settings, FileCheck, ChevronRight, Trophy, X, MessageSquare,
} from "lucide-react"

export default function ConfiguracoesGerais() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [loading, setLoading] = useState(true)
  const [savingXp, setSavingXp] = useState(false)
  const [activeTab, setActiveTab] = useState("economia")

  const [xpConfig, setXpConfig] = useState({
    xp_revisao: 15,
    xp_aprovacao: 50,
    xp_topico: 5,
    xp_comentario: 5,
  })
  const [escolas, setEscolas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [novaEscola, setNovaEscola] = useState("")
  const [novaDisciplina, setNovaDisciplina] = useState("")

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const carregarConfiguracoes = async () => {
    try {
      const response = await api.get("api/admin/configuracoes/")
      setXpConfig(response.data.xp)
      setEscolas(response.data.escolas)
      setDisciplinas(response.data.disciplinas)
    } catch (error) {
      if (error.response?.status === 403) navigate("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleXpChange = (e) =>
    setXpConfig({ ...xpConfig, [e.target.name]: parseInt(e.target.value) || 0 })

  const salvarXp = async (e) => {
    e.preventDefault()
    setSavingXp(true)
    try {
      await api.post("api/admin/configuracoes/", { acao: "atualizar_xp", ...xpConfig })
      Swal.fire({ icon: "success", title: "Sucesso!", text: "Economia de XP atualizada.", timer: 1500, showConfirmButton: false })
    } catch (error) {
      Swal.fire("Erro", "Não foi possível salvar.", "error")
    } finally {
      setSavingXp(false)
    }
  }

  const adicionarItem = async (tipo, nome, setInputFunc) => {
    if (!nome.trim()) return
    try {
      await api.post("api/admin/configuracoes/", { acao: `adicionar_${tipo}`, nome: nome })
      setInputFunc("")
      carregarConfiguracoes()
    } catch (error) {
      Swal.fire("Erro", `Não foi possível adicionar a ${tipo}.`, "error")
    }
  }

  const removerItem = async (tipo, id) => {
    try {
      await api.post("api/admin/configuracoes/", { acao: `remover_${tipo}`, id: id })
      carregarConfiguracoes()
    } catch (error) {
      Swal.fire("Erro", `Não foi possível remover.`, "error")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 className="animate-spin text-purple-600 mb-4" size={32} />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Carregando arquitetura do sistema...</p>
    </div>
  )

  const inputClass = "flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400"

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1000px] mx-auto">
        
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/50">
              <Settings size={28} className="text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configurações do Sistema</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ajuste a economia do jogo e os dados base da plataforma.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          <aside className="w-full md:w-[250px] shrink-0 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("economia")}
              className={`flex items-center justify-between w-full p-4 rounded-xl font-bold text-[15px] transition-all ${
                activeTab === "economia" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3"><TrendingUp size={18} /> Economia de XP</div>
              {activeTab === "economia" && <ChevronRight size={16} className="text-slate-400" />}
            </button>
            <button
              onClick={() => setActiveTab("escolas")}
              className={`flex items-center justify-between w-full p-4 rounded-xl font-bold text-[15px] transition-all ${
                activeTab === "escolas" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3"><School size={18} /> Escolas</div>
              {activeTab === "escolas" && <ChevronRight size={16} className="text-slate-400" />}
            </button>
            <button
              onClick={() => setActiveTab("disciplinas")}
              className={`flex items-center justify-between w-full p-4 rounded-xl font-bold text-[15px] transition-all ${
                activeTab === "disciplinas" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3"><BookOpen size={18} /> Disciplinas</div>
              {activeTab === "disciplinas" && <ChevronRight size={16} className="text-slate-400" />}
            </button>
          </aside>

          <main className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            
            {activeTab === "economia" && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50">
                    <TrendingUp size={24} className="text-[#1565C0] dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Pesos de Gamificação</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Determine quantos pontos de experiência (XP) cada ação gera para os professores.</p>
                  </div>
                </div>

                <form onSubmit={salvarXp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"><FileCheck size={16} /> Revisar prática de colega</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[#1565C0] transition-colors">
                      <input type="number" name="xp_revisao" value={xpConfig.xp_revisao} onChange={handleXpChange} className={inputClass} />
                      <span className="px-4 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black h-full flex items-center">XP</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"><Trophy size={16} /> Ter produção Aprovada</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[#1565C0] transition-colors">
                      <input type="number" name="xp_aprovacao" value={xpConfig.xp_aprovacao} onChange={handleXpChange} className={inputClass} />
                      <span className="px-4 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black h-full flex items-center">XP</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"><MessageSquare size={16} /> Criar Tópico no Fórum</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[#1565C0] transition-colors">
                      <input type="number" name="xp_topico" value={xpConfig.xp_topico} onChange={handleXpChange} className={inputClass} />
                      <span className="px-4 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black h-full flex items-center">XP</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"><MessageSquare size={16} /> Responder no Fórum</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[#1565C0] transition-colors">
                      <input type="number" name="xp_comentario" value={xpConfig.xp_comentario} onChange={handleXpChange} className={inputClass} />
                      <span className="px-4 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black h-full flex items-center">XP</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button type="submit" disabled={savingXp} className="flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md shadow-blue-500/20 w-full md:w-auto">
                      {savingXp ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Regras de XP
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "escolas" && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                    <School size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Instituições de Ensino</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Estas opções aparecerão para os usuários no momento de criar uma conta.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                  <input
                    type="text" placeholder="Digite o nome de uma nova escola..." value={novaEscola}
                    onChange={(e) => setNovaEscola(e.target.value)} onKeyPress={(e) => e.key === "Enter" && adicionarItem("escola", novaEscola, setNovaEscola)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none text-sm dark:text-white"
                  />
                  <button onClick={() => adicionarItem("escola", novaEscola, setNovaEscola)} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">
                    <Plus size={18} /> Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {escolas.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{e.nome}</span>
                      <button onClick={() => removerItem("escola", e.id)} className="p-1 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-full transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  {escolas.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Nenhuma escola cadastrada.</p>}
                </div>
              </div>
            )}

            {activeTab === "disciplinas" && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
                    <BookOpen size={24} className="text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Disciplinas e Áreas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cadastre novas áreas de atuação para categorizar os professores.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                  <input
                    type="text" placeholder="Digite o nome de uma nova disciplina..." value={novaDisciplina}
                    onChange={(e) => setNovaDisciplina(e.target.value)} onKeyPress={(e) => e.key === "Enter" && adicionarItem("disciplina", novaDisciplina, setNovaDisciplina)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none text-sm dark:text-white"
                  />
                  <button onClick={() => adicionarItem("disciplina", novaDisciplina, setNovaDisciplina)} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">
                    <Plus size={18} /> Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {disciplinas.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-full">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{d.nome}</span>
                      <button onClick={() => removerItem("disciplina", d.id)} className="p-1 text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-full transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  {disciplinas.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Nenhuma disciplina cadastrada.</p>}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}