import React, { useState, useEffect } from "react"
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  ArrowLeft, CheckCircle, Clock, Save, Trash2, Loader2, Users,
  Tag, ListChecks, MapPin, MessageCircle, BookOpen, FileText, Send, Paperclip, Eye
} from "lucide-react"

export default function DiarioDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [notas, setNotas] = useState([])
  const [novaNota, setNovaNota] = useState("")
  const [novoStatus, setNovoStatus] = useState("")

  useEffect(() => {
    carregarDetalhes()
  }, [id])

  const carregarDetalhes = async () => {
    try {
      const response = await api.get(`api/admin/diario/${id}/notas/`)
      setTicket(response.data.diario)
      setNotas(response.data.notas)
      setNovoStatus(response.data.diario.status)
    } catch (error) {
      Swal.fire("Erro", "Não foi possível carregar os detalhes do registro.", "error")
      navigate("/dashboard/admin/diario")
    } finally {
      setLoading(false)
    }
  }

  const handleAtualizarTicket = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post(`api/admin/diario/${id}/notas/`, { texto: novaNota, status: novoStatus })
      setNovaNota("")
      carregarDetalhes()
      Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2000 }).fire({ icon: "success", title: "Atendimento atualizado!" })
    } catch (error) {
      Swal.fire("Erro", "Falha ao adicionar evolução ao chamado.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: "Excluir permanentemente?", text: "Isso apagará o registro e todo o histórico.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#DC2626",
    })
    if (confirm.isConfirmed) {
      try {
        await api.delete(`api/admin/diario/${id}/delete/`)
        Swal.fire("Excluído!", "O registro foi removido.", "success")
        navigate("/dashboard/admin/diario")
      } catch (error) {
        Swal.fire("Erro", "Não foi possível excluir o registro.", "error")
      }
    }
  }

  const getTipoMeta = (tipo) => {
    switch (tipo) {
      case "Treinamento": return { bg: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", cor: "text-emerald-700 dark:text-emerald-400", icone: <BookOpen size={14} /> }
      case "Reunião": return { bg: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800", cor: "text-blue-700 dark:text-blue-400", icone: <Users size={14} /> }
      case "Visita Escolar": return { bg: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800", cor: "text-purple-700 dark:text-purple-400", icone: <MapPin size={14} /> }
      case "Suporte": return { bg: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", cor: "text-amber-700 dark:text-amber-400", icone: <MessageCircle size={14} /> }
      default: return { bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700", cor: "text-slate-700 dark:text-slate-300", icone: <FileText size={14} /> }
    }
  }

  if (loading || !ticket) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 size={32} className="animate-spin text-amber-600 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Carregando histórico do atendimento...</p>
    </div>
  )

  const meta = getTipoMeta(ticket.tipo)

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto">
        
        <button onClick={() => navigate("/dashboard/admin/diario")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar para o Diário
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${meta.bg} ${meta.cor}`}>
              {meta.icone} {ticket.tipo}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
              ticket.status === 'Resolvido' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
              ticket.status === 'Pendente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}>
              {ticket.status}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 ml-auto">
              <Clock size={14} /> {ticket.data_evento}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-3">{ticket.titulo}</h1>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Users size={16} /> Com quem: <strong className="text-slate-700 dark:text-slate-200">{ticket.contato}</strong>
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* COLUNA ESQUERDA (Principal) */}
          <div className="flex-[2] w-full flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <FileText className="text-[#1565C0] dark:text-blue-400" size={20} /> Relato Original
              </h3>
              <div className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.descricao}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white mb-6">
                <MessageCircle className="text-[#1565C0] dark:text-blue-400" size={20} /> Evolução do Atendimento
              </h3>
              
              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-6 pb-4">
                {notas.map((nota) => (
                  <div key={nota.id} className="relative mb-8 last:mb-0">
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#1565C0] dark:text-blue-400 flex items-center justify-center font-black text-xs border-2 border-white dark:border-slate-900 shadow-sm">
                      {nota.autor.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{nota.autor}</span>
                        <span className="text-xs font-medium text-slate-400">{nota.criado_em}</span>
                      </div>
                      <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap m-0">{nota.texto}</p>
                    </div>
                  </div>
                ))}
                {notas.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-6">Nenhuma evolução registrada neste atendimento.</p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={handleAtualizarTicket}>
                  <textarea
                    value={novaNota} onChange={(e) => setNovaNota(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-[#1565C0] outline-none transition-all dark:text-white placeholder-slate-400 min-h-[100px] resize-y mb-4"
                    placeholder="Adicionar anotação, evolução ou resolução do caso..."
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Status:</span>
                      <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer">
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Resolvido">Resolvido</option>
                      </select>
                    </div>
                    <button type="submit" disabled={isSubmitting || (!novaNota.trim() && novoStatus === ticket.status)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Atualizar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (Sidebar) */}
          <div className="flex-[1] w-full min-w-[280px] flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Propriedades</h3>
              
              <div className="mb-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1"><Users size={14}/> Participantes</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ticket.participantes} {ticket.participantes > 1 ? "pessoas" : "pessoa"}</p>
              </div>
              
              {ticket.tags && (
                <div className="mb-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2"><Tag size={14}/> Tags / Assuntos</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.split(",").map((t, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.proximos_passos && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500 uppercase mb-2"><ListChecks size={14}/> Próximos Passos</p>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-3 rounded-r-lg text-sm text-amber-800 dark:text-amber-400 font-medium">
                    {ticket.proximos_passos}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Evidência / Anexo</h3>
              {ticket.foto ? (
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={ticket.foto} alt="Evidência" className="w-full h-auto block object-cover" />
                  <a href={ticket.foto} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm text-sm font-bold gap-2">
                    <Eye size={24} /> Ver Arquivo
                  </a>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center text-center">
                  <Paperclip size={24} className="text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Nenhum anexo salvo.</p>
                </div>
              )}
            </div>

            <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm">
              <Trash2 size={16} /> Excluir Registro
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}