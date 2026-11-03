import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import { ArrowLeft, Search, GitMerge } from "lucide-react"

const BuscarBase = () => {
  const navigate = useNavigate()
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!busca.trim()) {
      setResultados([])
      return
    }
    setLoading(true)
    const delayBusca = setTimeout(async () => {
      try {
        const url = `api/public/feed/?search=${busca}`
        const response = await api.get(url)
        setResultados(response.data.results || response.data)
      } catch (error) {
        console.error("Erro na busca automática", error)
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(delayBusca)
  }, [busca])

  const handleSelect = (prod) => {
    Swal.fire({
      title: "Usar como base?",
      text: `Você vai criar uma nova prática baseada em "${prod.titulo}".`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, usar esta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1565C0",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/dashboard/catalogar/manual", {
          state: { baseData: prod },
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center pt-12 md:pt-20 transition-colors duration-200">
      
      <div className="w-full max-w-3xl flex flex-col items-center">
        
        {/* Voltar */}
        <div className="w-full mb-8">
          <button 
            onClick={() => navigate("/dashboard/catalogar")}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>

        {/* Título */}
        <div className="text-center max-w-xl mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Buscar Prática Base
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Digite palavras-chave para encontrar a prática que servirá de inspiração para a sua releitura.
          </p>
        </div>

        {/* Barra de Pesquisa Grande */}
        <div className="w-full max-w-2xl relative mb-10 group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1565C0] dark:group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por título, disciplina, modelo de IA..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-24 py-4 text-base focus:border-[#1565C0] dark:focus:border-blue-500 shadow-sm outline-none transition-all dark:text-white placeholder-slate-400"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1565C0] dark:text-blue-400 uppercase tracking-wider animate-pulse">
              Buscando...
            </div>
          )}
        </div>

        {/* Lista de Resultados */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
          
          {resultados.map((prod) => (
            <div 
              key={prod.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {prod.titulo}
                </h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{prod.disciplina}</span>
                  • {prod.nivel}
                </p>
              </div>
              <button
                onClick={() => handleSelect(prod)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-[#1565C0] dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shrink-0"
              >
                <GitMerge size={16} /> Selecionar
              </button>
            </div>
          ))}

          {!busca.trim() && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
              Comece a digitar para ver as produções disponíveis.
            </div>
          )}

          {resultados.length === 0 && !loading && busca.trim() !== "" && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-lg mb-1">Nenhuma prática encontrada.</p>
              <p className="text-sm">Tente usar outros termos de busca.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default BuscarBase