import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../../services/api"
import Swal from "sweetalert2"
import {
  MessageSquare, PlusCircle, Paperclip, CheckCircle, Filter, 
  Search, ChevronDown, Loader2, MessagesSquare, Link2, X
} from "lucide-react"

export default function Forum() {
  const [topicos, setTopicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState("Todas")
  const [busca, setBusca] = useState("")
  
  const categoriasDisponiveis = ["Todas", "Dúvida BNCC", "Metodologia", "Uso de IA", "Sugestão", "Geral"]

  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [categoria, setCategoria] = useState("Geral")
  const [arquivo, setArquivo] = useState(null)

  const [buscaBase, setBuscaBase] = useState("")
  const [resultadosBase, setResultadosBase] = useState([])
  const [loadingBusca, setLoadingBusca] = useState(false)
  const [producaoSelecionada, setProducaoSelecionada] = useState(null)

  useEffect(() => {
    carregarTopicos()
  }, [])

  const carregarTopicos = async () => {
    try {
      const response = await api.get("/api/forum/topicos/")
      setTopicos(response.data)
    } catch (error) {
      console.error("Erro ao buscar tópicos", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!buscaBase.trim()) {
      setResultadosBase([])
      return
    }
    setLoadingBusca(true)
    const delayBusca = setTimeout(async () => {
      try {
        const response = await api.get(`api/public/feed/?search=${buscaBase}`)
        setResultadosBase(response.data.results || response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingBusca(false)
      }
    }, 500)
    return () => clearTimeout(delayBusca)
  }, [buscaBase])

  const handleCriarTopico = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("titulo", titulo)
    formData.append("conteudo", conteudo)
    formData.append("categoria", categoria)
    
    if (arquivo) {
        formData.append("arquivo", arquivo)
    }
    
    if (producaoSelecionada) {
        formData.append("producao_base_id", producaoSelecionada.id)
    }

    try {
      await api.post("api/forum/topicos/", formData)
      
      window.dispatchEvent(new Event("perfilAtualizado"))
      setShowModal(false)
      setTitulo(""); setConteudo(""); setCategoria("Geral"); setArquivo(null); setBuscaBase(""); setResultadosBase([]); setProducaoSelecionada(null);
      carregarTopicos()
      Swal.fire({ icon: 'success', title: 'Tópico Criado!', confirmButtonColor: '#1565C0' })
    } catch (error) {
      const msg = error.response?.data?.erro || "Ocorreu um problema ao criar o tópico."
      Swal.fire("Erro!", msg, "error")
    }
  }

  const calcularTempoAtras = (dataString) => {
    if (!dataString) return ""
    try {
      const [data, hora] = dataString.split(" ")
      const [dia, mes, ano] = data.split("/")
      const [h, m] = hora.split(":")
      const dataObj = new Date(ano, mes - 1, dia, h, m)
      const diffSegundos = Math.floor((new Date() - dataObj) / 1000)
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

  const topicosFiltrados = topicos.filter(
    (t) => (filtroCategoria === "Todas" || t.categoria === filtroCategoria) && t.titulo.toLowerCase().includes(busca.toLowerCase())
  )

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-200 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Fórum de Discussões
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Debata ideias, tire dúvidas e colabore com outros professores.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <PlusCircle size={18} /> Novo Tópico
          </button>
        </div>

        {/* Toolbar de Busca e Filtro */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Buscar discussão..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>
          <div className="relative w-full sm:w-[220px]">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
              className={`${inputClass} pl-11 appearance-none cursor-pointer`}
            >
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>{cat === "Todas" ? "Todas as Categorias" : cat}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Lista de Tópicos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-4 text-[#1565C0]" />
            <p className="font-bold">Carregando discussões...</p>
          </div>
        ) : topicosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <MessagesSquare size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">Nenhum tópico encontrado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Tente mudar os filtros de busca ou inicie uma nova discussão!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topicosFiltrados.map((topico) => (
              <Link to={`/dashboard/forum/${topico.id}`} key={topico.id} className="block group">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm hover:shadow-md hover:border-[#1565C0]/50 dark:hover:border-blue-500/50 transition-all">
                  
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoriaClass(topico.categoria)}`}>
                      {topico.categoria}
                    </span>
                    {topico.resolvido && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle size={12} /> Resolvido
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {topico.titulo}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                        {topico.autor ? topico.autor.charAt(0).toUpperCase() : "P"}
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Por <strong className="text-slate-700 dark:text-slate-300">Prof. {topico.autor}</strong> • {calcularTempoAtras(topico.data)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <MessageSquare size={14} /> {topico.total_comentarios} Respostas
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

      </div>

      {/* MODAL: CRIAR TÓPICO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Novo Tópico</h2>
            
            <div className="overflow-y-auto pr-2 scrollbar-thin flex-1">
              <form onSubmit={handleCriarTopico} className="flex flex-col gap-5">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                    {categoriasDisponiveis.filter((c) => c !== "Todas").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex: Como avaliar competências com a BNCC?" className={inputClass} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-xl">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Link2 size={16} className="text-[#1565C0] dark:text-blue-400" /> Vincular Prática Base (Opcional)
                  </label>
                  
                  {producaoSelecionada ? (
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-3 rounded-xl">
                      <div>
                        <div className="text-sm font-bold text-[#1565C0] dark:text-blue-400 mb-0.5">{producaoSelecionada.titulo}</div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-300/70">{producaoSelecionada.disciplina}</div>
                      </div>
                      <button type="button" onClick={() => setProducaoSelecionada(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors"><X size={16}/></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text" placeholder="Busque por título ou disciplina para vincular..." value={buscaBase} onChange={(e) => setBuscaBase(e.target.value)}
                        className={`${inputClass} pl-10 bg-white dark:bg-slate-900`}
                      />
                      {loadingBusca && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1565C0] uppercase tracking-widest animate-pulse">Buscando...</span>}
                      {resultadosBase.length > 0 && buscaBase.trim() !== "" && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                          {resultadosBase.map((prod) => (
                            <div key={prod.id} onClick={() => { setProducaoSelecionada(prod); setBuscaBase(""); setResultadosBase([]); }} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                              <div className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">{prod.titulo}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{prod.disciplina}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Sua dúvida ou contexto</label>
                  <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} required rows="5" placeholder="Explique os detalhes para a comunidade..." className={inputClass} />
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors w-fit">
                    <Paperclip size={16} className="text-[#1565C0] dark:text-blue-400" /> Anexar Arquivo (Opcional)
                    <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.png" 
                        onChange={(e) => setArquivo(e.target.files[0])} 
                        className="hidden" 
                    />
                  </label>
                  {arquivo && <span className="ml-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{arquivo.name}</span>}
                </div>

              </form>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleCriarTopico} className="px-6 py-2.5 rounded-lg font-bold text-white bg-[#1565C0] hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">Publicar Tópico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}