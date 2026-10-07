import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"
import { Clock, Bot, ArrowRight, Tag, BookOpen, Lock, Scale, CheckCircle2, AlertCircle, FileText } from "lucide-react"

const RevisaoDuploCego = () => {
  const navigate = useNavigate()
  const [producoes, setProducoes] = useState([])
  const [loading, setLoading] = useState(true)
  const userDisciplina = localStorage.getItem("user_disciplina") || "Geral"

  useEffect(() => {
    const fetchReviewQueue = async () => {
      try {
        const response = await api.get("api/production/review-list/")
        setProducoes(response.data)
      } catch (error) {
        console.error("Erro ao buscar fila de revisão:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReviewQueue()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold flex items-center gap-2">
        <Scale className="animate-pulse" /> Carregando fila de validação...
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-200 dark:border-indigo-800/50">
              <Lock size={12} /> Área Restrita
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Fila de Validação
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Exibindo produções de <strong className="text-slate-800 dark:text-slate-200">{userDisciplina}</strong> aguardando sua análise.
            </p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border border-amber-200 dark:border-amber-800/50">
            <Clock size={16} /> {producoes.length} Pendentes
          </div>
        </div>

        {/* Lista de Fila */}
        <div className="flex flex-col gap-5">
          {producoes.length > 0 ? (
            producoes.map((item) => (
              <ReviewCard key={item.id} data={item} onClick={() => navigate(`/dashboard/revisao/${item.id}`)} />
            ))
          ) : (
            <EmptyState disciplina={userDisciplina} />
          )}
        </div>

      </div>
    </div>
  )
}

const ReviewCard = ({ data, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 overflow-hidden"
    >
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
            {data.disciplina}
          </span>
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#1565C0] dark:text-blue-400 px-2.5 py-1 rounded-md text-[11px] font-bold border border-blue-100 dark:border-blue-900/50">
            <Bot size={14} /> {data.modelo_ia || "IA"}
          </div>
          <div className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
            <Clock size={14} /> Aguardando revisão
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {data.titulo}
        </h3>

        <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-300 dark:border-slate-700 py-2.5 px-4 mb-5 rounded-r-lg flex items-center gap-2">
          <FileText size={16} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Clique para ler os detalhes da prática e avaliar...</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><Tag size={14} /> {data.categoria || "Atividade Prática"}</div>
          <span>•</span>
          <div>{data.nivel || "Geral"}</div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/30 md:border-l border-t md:border-t-0 border-slate-100 dark:border-slate-800 p-6 md:p-8 flex items-center justify-center min-w-[240px]">
        <button className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 group-hover:scale-105">
          Avaliar Prática <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

const EmptyState = ({ disciplina }) => (
  <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center shadow-sm">
    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-full mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
      <CheckCircle2 size={40} className="text-emerald-500 dark:text-emerald-400" />
    </div>
    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Tudo em dia!</h3>
    <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm leading-relaxed">
      Não há novas produções de <strong className="text-slate-700 dark:text-slate-300">{disciplina}</strong> aguardando revisão no momento. Ótimo trabalho!
    </p>
  </div>
)

export default RevisaoDuploCego