import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../services/api"
import {
  ArrowLeft, Download, CheckCircle, Trash2, Loader2, Send, Link2, CheckCircle2, User, MessageSquare
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import Swal from "sweetalert2"

export default function TopicoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [topico, setTopico] = useState(null)
  const [novoComentario, setNovoComentario] = useState("")
  const [loading, setLoading] = useState(true)
  const [pausarPolling, setPausarPolling] = useState(false)

  useEffect(() => {
    carregarDetalhes()
    const intervalo = setInterval(() => {
      if (!pausarPolling) carregarDetalhes()
    }, 5000)
    return () => clearInterval(intervalo)
  }, [id, pausarPolling])

  const carregarDetalhes = async () => {
    try {
      const response = await api.get(`api/forum/topicos/${id}/`)
      setTopico(response.data)
    } catch (error) {
      navigate("/dashboard/forum")
    } finally {
      setLoading(false)
    }
  }

  const handleComentar = async (e) => {
    e.preventDefault()
    if (!novoComentario.trim()) return
    try {
      await api.post(`api/forum/topicos/${id}/`, { conteudo: novoComentario })
      window.dispatchEvent(new Event("perfilAtualizado"))
      setNovoComentario("")
      carregarDetalhes()
    } catch (error) {
      Swal.fire({ icon: "error", title: "Ops...", text: "Erro ao enviar comentário.", confirmButtonColor: "#1565C0" })
    }
  }

  const handleResolver = async (e) => {
    e.preventDefault()
    const result = await Swal.fire({
      title: "Marcar como resolvido?",
      text: "Deseja marcar esta discussão como resolvida? Isso impedirá novos comentários.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "Sim, marcar como resolvido!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await api.put(`api/forum/topicos/${id}/`)
        carregarDetalhes()
        Swal.fire({ icon: "success", title: "Resolvido!", text: "O tópico foi marcado como resolvido.", confirmButtonColor: "#1565C0", timer: 2000 })
      } catch (error) {
        Swal.fire("Erro!", "Erro ao fechar o tópico.", "error")
      }
    }
  }

  const handleExcluir = async (e) => {
    e.preventDefault()
    setPausarPolling(true)

    const result = await Swal.fire({
      title: "Você tem certeza?",
      text: "Esta ação excluirá permanentemente o tópico e todos os comentários. Não é possível desfazer!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`api/forum/topicos/${id}/`)
        await Swal.fire({ icon: "success", title: "Excluído!", text: "O tópico foi apagado com sucesso.", confirmButtonColor: "#1565C0", timer: 2000 })
        navigate("/dashboard/forum")
      } catch (error) {
        Swal.fire("Erro!", "Erro ao excluir tópico.", "error")
        setPausarPolling(false)
      }
    } else {
      setPausarPolling(false)
    }
  }

  const calcularTempoAtras = (dataString) => {
    if (!dataString) return ""
    try {
      const [data, hora] = dataString.split(" ")
      const [dia, mes, ano] = data.split("/")
      const [h, m] = hora.split(":")
      const dataObj = new Date(ano, mes - 1, dia, h, m)
      const agora = new Date()
      const diffSegundos = Math.floor((agora - dataObj) / 1000)

      if (diffSegundos < 60) return "agora mesmo"
      if (diffSegundos < 3600) return `há ${Math.floor(diffSegundos / 60)} min`
      if (diffSegundos < 86400) return `há ${Math.floor(diffSegundos / 3600)}h`
      if (diffSegundos < 604800) return `há ${Math.floor(diffSegundos / 86400)} dias`
      return dataString
    } catch (e) {
      return dataString
    }
  }

  const getCategoriaClass = (cat) => {
    switch(cat) {
      case "Dúvida BNCC": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      case "Metodologia": return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      case "Uso de IA": return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800"
      case "Sugestão": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    }
  }

  if (loading && !topico) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 size={32} className="animate-spin text-[#1565C0] dark:text-blue-500 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Carregando discussão...</p>
    </div>
  )

  if (!topico) return null

  const authorInitial = topico.autor ? topico.autor.charAt(0).toUpperCase() : "P"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-24">
      <div className="max-w-[900px] mx-auto">
        
        {/* Voltar */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={18} /> Voltar para o Fórum
        </button>

        {/* --- TÓPICO PRINCIPAL --- */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 mb-10">
          
          {/* Header do Tópico */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoriaClass(topico.categoria)}`}>
                  {topico.categoria}
                </span>
                {topico.resolvido && (
                  <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle size={14} /> Resolvido
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                {topico.titulo}
              </h1>

              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-xs shrink-0">
                  {authorInitial}
                </div>
                <span>
                  Por <strong className="text-slate-800 dark:text-slate-200">Prof. {topico.autor}</strong> • {calcularTempoAtras(topico.data)}
                </span>
              </div>
            </div>

            {/* Ações do Dono */}
            {topico.is_dono_topico && (
              <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
                {!topico.resolvido && (
                  <button onClick={handleResolver} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                    <CheckCircle size={16} /> Resolver
                  </button>
                )}
                <button onClick={handleExcluir} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            )}
          </div>

          {/* Prática Base Vinculada */}
          {topico.producao_base && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-5 rounded-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                <Link2 size={20} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#1565C0] dark:text-blue-400 uppercase tracking-widest mb-1">Prática de Referência</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">
                  {topico.producao_base.titulo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {topico.producao_base.disciplina} • Por {topico.producao_base.autor}
                </p>
              </div>
            </div>
          )}

          {/* Corpo do Tópico (Markdown) */}
          <div className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold">
            <ReactMarkdown>{topico.conteudo}</ReactMarkdown>
          </div>

          {/* Anexo */}
          {topico.arquivo && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <a href={topico.arquivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                <Download size={18} /> Baixar Material Anexo
              </a>
            </div>
          )}
        </div>

        {/* --- SESSÃO DE COMENTÁRIOS --- */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white mb-6">
            <MessageSquare size={20} className="text-[#1565C0] dark:text-blue-400" />
            Discussão ({topico.comentarios.length})
          </h3>

          <div className="flex flex-col gap-5 mb-10">
            {topico.comentarios.map((comentario) => {
              const isAutor = comentario.is_autor_topico
              return (
                <div 
                  key={comentario.id} 
                  className={`p-6 rounded-2xl border transition-colors ${
                    isAutor 
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isAutor ? "bg-[#1565C0] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      {comentario.autor ? comentario.autor.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{comentario.autor}</span>
                    {isAutor && (
                      <span className="bg-[#1565C0]/10 dark:bg-blue-500/20 text-[#1565C0] dark:text-blue-400 border border-[#1565C0]/20 dark:border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Autor</span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-auto">
                      {calcularTempoAtras(comentario.data)}
                    </span>
                  </div>
                  <div className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{comentario.conteudo}</ReactMarkdown>
                  </div>
                </div>
              )
            })}
          </div>

          {/* --- FORMULÁRIO DE RESPOSTA --- */}
          {topico.resolvido ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 p-8 rounded-2xl text-center flex flex-col items-center shadow-sm">
              <CheckCircle2 size={36} className="mb-4 text-emerald-500" />
              <p className="font-bold text-lg mb-1">Tópico Resolvido</p>
              <p className="text-sm">Esta discussão foi encerrada pelo autor e não recebe mais comentários.</p>
            </div>
          ) : (
            <form onSubmit={handleComentar} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-extrabold text-slate-800 dark:text-white mb-4">Adicionar um comentário</h4>
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva sua sugestão, dúvida ou resposta..."
                required
                rows="4"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-[15px] focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400 mb-4 resize-y"
              />
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-md shadow-blue-500/20">
                  <Send size={16} /> Enviar Comentário
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}