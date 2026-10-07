import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  ArrowLeft, BookOpen, Calendar, Users, FileText, Save, Plus,
  Trash2, Loader2, MapPin, MessageCircle, Camera, CheckCircle2,
  Eye, Search, Tag, Filter, Check, ListChecks,
} from "lucide-react"

const TAGS_DISPONIVEIS = [
  "Dúvida com Login",
  "Criação de Prompts",
  "Problema no Fórum",
  "Apresentação da Plataforma",
  "Feedback Positivo",
  "Erro no Sistema",
  "Engajamento",
]

export default function DiarioOperacoes() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logs, setLogs] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [buscaUsuario, setBuscaUsuario] = useState("")
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false)
  const [buscaTimeline, setBuscaTimeline] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "Reunião",
    status: "Resolvido",
    docente_id: "",
    contato: "",
    data_evento: new Date().toISOString().split("T")[0],
    descricao: "",
    proximos_passos: "",
    tags: [],
    participantes: 1,
  })
  const [foto, setFoto] = useState(null)

  useEffect(() => {
    verificarAcesso()
  }, [])

  const verificarAcesso = async () => {
    try {
      const perfilRes = await api.get("api/user/me/")
      if (!perfilRes.data.is_superuser) {
        Swal.fire({
          icon: "error", title: "Acesso Negado", text: "Você não tem permissão de administrador.",
          confirmButtonColor: "#1565C0"
        })
        navigate("/dashboard")
        return
      }
      await carregarDiario()
      await carregarUsuarios()
    } catch (error) {
      navigate("/dashboard")
    }
  }

  const carregarDiario = async () => {
    try {
      const response = await api.get("api/admin/diario/")
      setLogs(response.data)
    } catch (error) {
      Swal.fire("Erro de Conexão", "Não foi possível carregar os registros.", "error")
    } finally {
      setLoading(false)
    }
  }

  const carregarUsuarios = async () => {
    try {
      const response = await api.get("api/admin/users/")
      setUsuarios(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const toggleTag = (tag) => {
    const novasTags = formData.tags.includes(tag)
      ? formData.tags.filter((t) => t !== tag)
      : [...formData.tags, tag]
    setFormData({ ...formData, tags: novasTags })
  }
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) setFoto(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.titulo || !formData.descricao || !formData.contato)
      return Swal.fire("Campos Incompletos", "Preencha título, contato e descrição.", "warning")

    setIsSubmitting(true)
    try {
      const dataToSend = new FormData()
      Object.keys(formData).forEach((key) => {
        if (key === "tags") {
          if (formData.tags.length > 0) dataToSend.append("tags", formData.tags.join(", "))
        } else {
          dataToSend.append(key, formData[key])
        }
      })
      if (foto) dataToSend.append("foto", foto)

      const response = await api.post("api/admin/diario/", dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setLogs([response.data, ...logs])
      Swal.fire({ icon: "success", title: "Registrado!", text: "Atividade salva com sucesso.", timer: 2000, showConfirmButton: false })
      setFormData({
        titulo: "", tipo: "Reunião", status: "Resolvido", docente_id: "", contato: "",
        data_evento: new Date().toISOString().split("T")[0], descricao: "", proximos_passos: "", tags: [], participantes: 1,
      })
      setBuscaUsuario("")
      setFoto(null)
    } catch (error) {
      Swal.fire("Erro", "Não foi possível salvar o registro no servidor.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Excluir registro?", text: "Essa ação apagará os dados permanentemente.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#DC2626",
    })
    if (!confirm.isConfirmed) return
    try {
      await api.delete(`api/admin/diario/${id}/delete/`)
      setLogs(logs.filter((log) => log.id !== id))
      Swal.fire("Excluído!", "O registro foi removido.", "success")
    } catch (error) {
      Swal.fire("Erro", "Não foi possível excluir o registro.", "error")
    }
  }

  const getTipoMeta = (tipo) => {
    switch (tipo) {
      case "Treinamento": return { classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icone: <BookOpen size={14} /> }
      case "Reunião": return { classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800", icone: <Users size={14} /> }
      case "Visita Escolar": return { classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800", icone: <MapPin size={14} /> }
      case "Suporte": return { classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", icone: <MessageCircle size={14} /> }
      default: return { classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icone: <FileText size={14} /> }
    }
  }

  const getStatusMeta = (status) => {
    switch (status) {
      case "Pendente": return { classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", label: "Pendente" }
      case "Em andamento": return { classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", label: "Em andamento" }
      default: return { classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", label: "Resolvido" }
    }
  }

  const usuariosFiltrados = usuarios
    .filter((u) => u.username.toLowerCase().includes(buscaUsuario.toLowerCase()) || u.email.toLowerCase().includes(buscaUsuario.toLowerCase()))
    .slice(0, 5)

  const logsFiltrados = logs.filter((log) => {
    const matchBusca = (log.titulo || "").toLowerCase().includes(buscaTimeline.toLowerCase()) || (log.contato || "").toLowerCase().includes(buscaTimeline.toLowerCase())
    const matchStatus = filtroStatus === "Todos" || log.status === filtroStatus
    return matchBusca && matchStatus
  })

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 size={32} className="animate-spin text-amber-500 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Conectando ao CRM...</p>
    </div>
  )

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide"

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1300px] mx-auto">
        
        <header className="mb-8">
          <button onClick={() => navigate("/dashboard/central-admin")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Voltar à Central
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
              <FileText size={28} className="text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">CRM & Diário de Operações</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Documente treinamentos, suporte e relacionamentos com os docentes.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* COLUNA ESQUERDA (FORMULÁRIO) */}
          <div className="flex-[1.2] w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Plus size={20} className="text-amber-500" /> Novo Registro de Atendimento
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-[2]">
                    <label className={labelClass}>Título da Interação</label>
                    <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ex: Oficina sobre Prompts Básicos" className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                      <option value="Resolvido">Resolvido ✅</option>
                      <option value="Em andamento">Em andamento ⏳</option>
                      <option value="Pendente">Pendente 🚨</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className={labelClass}>Tipo de Evento</label>
                    <select name="tipo" value={formData.tipo} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                      <option value="Reunião">Reunião</option>
                      <option value="Treinamento">Treinamento</option>
                      <option value="Visita Escolar">Visita Escolar</option>
                      <option value="Suporte">Suporte</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Data</label>
                    <input type="date" name="data_evento" value={formData.data_evento} onChange={handleChange} required className={inputClass} />
                  </div>
                  {(formData.tipo === "Treinamento" || formData.tipo === "Visita Escolar") && (
                    <div className="w-24 shrink-0">
                      <label className={labelClass}>Pessoas</label>
                      <input type="number" name="participantes" min="1" value={formData.participantes} onChange={handleChange} className={inputClass} />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className={labelClass}>Professor(a) ou Contato Livre</label>
                  <div className={`relative flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 focus-within:border-amber-500 transition-colors`}>
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                      type="text" value={buscaUsuario}
                      onChange={(e) => {
                        setBuscaUsuario(e.target.value)
                        setFormData({ ...formData, contato: e.target.value, docente_id: "" })
                        setMostrarAutocomplete(true)
                      }}
                      onFocus={() => setMostrarAutocomplete(true)}
                      onBlur={() => setTimeout(() => setMostrarAutocomplete(false), 200)}
                      placeholder="Busque um usuário ou digite livremente..."
                      required
                      className="w-full bg-transparent py-3 text-sm outline-none dark:text-white placeholder-slate-400"
                    />
                  </div>
                  
                  {mostrarAutocomplete && buscaUsuario && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                      {usuariosFiltrados.length > 0 ? (
                        usuariosFiltrados.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 transition-colors"
                            onClick={() => {
                              setBuscaUsuario(u.username)
                              setFormData({ ...formData, contato: u.username, docente_id: u.id })
                              setMostrarAutocomplete(false)
                            }}
                          >
                            <strong>{u.username}</strong> <span className="text-slate-400 text-xs">- {u.disciplina}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-500 text-center">Nenhum usuário encontrado. Será salvo como contato livre.</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}><Tag size={14} className="inline mr-1"/> Tags de Categorização</label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS_DISPONIVEIS.map((tag) => {
                      const isSelected = formData.tags.includes(tag)
                      return (
                        <div
                          key={tag} onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 select-none ${
                            isSelected 
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700" 
                            : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {isSelected && <Check size={12} />} {tag}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Relato da Interação</label>
                  <textarea name="descricao" value={formData.descricao} onChange={handleChange} required rows="4" placeholder="Descreva qual foi a dúvida, o que foi discutido no treinamento ou a dor apontada..." className={inputClass} />
                </div>

                {formData.status !== "Resolvido" && (
                  <div>
                    <label className={`${labelClass} !text-amber-600 dark:!text-amber-500`}><ListChecks size={14} className="inline mr-1"/> Próximos Passos / Pendências</label>
                    <textarea name="proximos_passos" value={formData.proximos_passos} onChange={handleChange} rows="2" placeholder="Ex: Ligar na próxima semana para verificar se conseguiu o acesso." className={`${inputClass} border-amber-300 dark:border-amber-700/50 focus:border-amber-500`} />
                  </div>
                )}

                <div>
                  <label className={labelClass}>Foto / Anexo (Opcional)</label>
                  <input type="file" id="foto-diario" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="foto-diario" className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {foto ? (
                      <><CheckCircle2 size={18} className="text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">{foto.name}</span></>
                    ) : (
                      <><Camera size={18} /> Anexar Evidência / Print</>
                    )}
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-blue-500/20 mt-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {isSubmitting ? "Salvando..." : "Salvar Registro"}
                </button>
              </form>
            </div>
          </div>

          {/* COLUNA DIREITA (TIMELINE) */}
          <div className="flex-[1.5] w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 h-full">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white m-0">
                  <Calendar size={20} className="text-[#1565C0] dark:text-blue-400" /> Histórico de Atendimentos
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={buscaTimeline} onChange={(e) => setBuscaTimeline(e.target.value)} placeholder="Buscar assunto ou docente..." className={`${inputClass} pl-10`} />
                </div>
                <div className="relative shrink-0 w-full sm:w-[180px]">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={`${inputClass} pl-10 cursor-pointer appearance-none`}>
                    <option value="Todos">Todos os Status</option>
                    <option value="Pendente">Pendentes</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Resolvido">Resolvidos</option>
                  </select>
                </div>
              </div>

              {logsFiltrados.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Nenhum registro encontrado com estes filtros.</p>
              ) : (
                <div className="relative ml-4 mt-6 border-l-2 border-slate-200 dark:border-slate-700">
                  {logsFiltrados.map((log) => {
                    const meta = getTipoMeta(log.tipo)
                    const statusMeta = getStatusMeta(log.status)
                    const isLongText = log.descricao && log.descricao.length > 120
                    const descResumo = isLongText ? log.descricao.substring(0, 120) + "..." : log.descricao

                    return (
                      <div key={log.id} className="relative pl-6 pb-8 last:pb-0">
                        <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-[3px] border-white dark:border-slate-900 ${meta.classes} shadow-sm`}>
                          {meta.icone}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${meta.classes}`}>
                                  {log.tipo}
                                </span>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${statusMeta.classes}`}>
                                  {statusMeta.label}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">{log.data_evento}</span>
                              </div>
                              <h4 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight mb-2">{log.titulo}</h4>
                              
                              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                                <div className="flex items-center gap-1.5"><Users size={12} /> {log.contato} {log.docente_id ? "(Cadastrado)" : ""}</div>
                                {log.participantes > 1 && (
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500"><Users size={12} /> {log.participantes} Participantes</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => navigate(`/dashboard/admin/diario/${log.id}`, { state: { logData: log } })} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors" title="Ver Detalhes">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => handleDelete(log.id)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors" title="Excluir">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap m-0">{descResumo}</p>

                          {log.tags && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {log.tags.split(",").map((t, idx) => (
                                <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                                  #{t.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {log.proximos_passos && log.status !== "Resolvido" && (
                            <div className="mt-4 bg-amber-100/50 dark:bg-amber-900/20 p-3 rounded-lg border-l-4 border-amber-400 text-[12px] text-amber-800 dark:text-amber-400">
                              <strong className="block mb-1">Próximos Passos:</strong>
                              {log.proximos_passos}
                            </div>
                          )}

                          {log.foto && (
                            <div 
                              onClick={() => navigate(`/dashboard/admin/diario/${log.id}`, { state: { logData: log } })}
                              className="mt-4 relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 inline-block"
                            >
                              <img src={log.foto} alt="Anexo" className="block max-w-full h-auto max-h-[120px] object-cover opacity-90 transition-opacity" />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                <Eye size={20} />
                                <span className="text-[11px] font-bold mt-1">Ver Anexo</span>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}