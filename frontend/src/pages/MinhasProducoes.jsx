import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useNavigate, useOutletContext } from "react-router-dom"
import { Alert } from "../utils/alerts"
import {
  FileText, ClipboardCheck, Clock, CheckCircle2, XCircle,
  AlertCircle, Eye, Calendar, Plus, User, Wrench, Edit3, Link as LinkIcon
} from "lucide-react"

const MinhasProducoes = () => {
  const navigate = useNavigate()
  const { isMobile } = useOutletContext() || { isMobile: false }
  const [producoes, setProducoes] = useState([])
  const [revisoes, setRevisoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("enviadas")

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const resProd = await api.get("api/production/list/")
        setProducoes(resProd.data)
        try {
          const resRev = await api.get("api/production/history/")
          setRevisoes(resRev.data)
        } catch (e) {
          setRevisoes([])
        }
      } catch (error) {
        Alert.erro("Erro de Conexão", "Não foi possível carregar a sua lista de produções.")
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold flex items-center gap-2">
        <Clock className="animate-spin" /> Carregando seu acervo...
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Minhas Atividades
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acompanhe o status das suas submissões e seu histórico de revisões.
            </p>
          </div>
          <button 
            onClick={() => navigate("/dashboard/catalogar")}
            className="flex items-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Produção
          </button>
        </div>

        {/* Abas (Tabs) Modernas */}
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("enviadas")}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "enviadas" 
              ? "border-[#1565C0] text-[#1565C0] dark:border-blue-400 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <FileText size={18} /> Minhas Produções <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">{producoes.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("revisadas")}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "revisadas" 
              ? "border-[#1565C0] text-[#1565C0] dark:border-blue-400 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ClipboardCheck size={18} /> Histórico de Revisões <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">{revisoes.length}</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div>
          {activeTab === "enviadas" && (
            <div className="flex flex-col gap-4">
              {producoes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <FileText size={32} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Nenhuma produção encontrada.</p>
                  <p className="text-sm text-slate-400">Você ainda não salvou ou enviou nenhum material.</p>
                </div>
              ) : (
                producoes.map((item) => <CardProducao key={item.id} data={item} navigate={navigate} />)
              )}
            </div>
          )}

          {activeTab === "revisadas" && (
            <div className="flex flex-col gap-4">
              {revisoes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <ClipboardCheck size={32} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Nenhuma revisão realizada.</p>
                  <p className="text-sm text-slate-400">Quando você avaliar práticas de colegas, elas aparecerão aqui.</p>
                </div>
              ) : (
                revisoes.map((item) => <CardHistorico key={item.id} data={item} navigate={navigate} />)
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const CardProducao = ({ data, navigate }) => {
  const getStatusConfig = (status) => {
    const s = status ? status.toLowerCase() : ""
    if (s.includes("aprovado") || s.includes("publicado")) return { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 size={16} />, label: "Aprovado" }
    if (s.includes("rejeitado") || s.includes("correção")) return { color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", icon: <XCircle size={16} />, label: "Ajustes Necessários" }
    if (s.includes("rascunho")) return { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-700", icon: <Edit3 size={16} />, label: "Rascunho Salvo" }
    return { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", icon: <Clock size={16} />, label: "Aguardando Revisão" }
  }

  const config = getStatusConfig(data.status)
  const isRejected = config.label === "Ajustes Necessários"
  const isDraft = config.label === "Rascunho Salvo"

  const rejectionMessage = (() => {
    const raw = data.feedback_revisor || ""
    if (!raw) return null
    if (raw.includes("SUGESTÕES DE MELHORIA:")) return raw.split("SUGESTÕES DE MELHORIA:")[1].trim()
    if (raw.includes("PONTOS FORTES:")) return null
    return raw
  })()

  return (
    <div 
      onClick={() => navigate(isDraft ? `/dashboard/editar-producao/${data.id}` : `/dashboard/minha-producao/${data.id}`)}
      className={`group flex flex-col md:flex-row gap-6 p-5 md:p-6 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isDraft ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{data.disciplina || "Geral"}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium"><Calendar size={14}/> Salvo em: {data.data || "Hoje"}</span>
        </div>
        <h3 className={`text-lg font-extrabold mb-3 leading-snug line-clamp-2 transition-colors ${isDraft ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-[#1565C0] dark:group-hover:text-blue-400'}`}>
          {data.titulo || "(Rascunho sem título)"}
        </h3>
        
        {data.producao_base && (
          <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-[#1565C0] dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold mb-2 border border-dashed border-blue-200 dark:border-blue-800 w-fit">
            <LinkIcon size={11} /> Baseado em Releitura
          </div>
        )}

        {isRejected && rejectionMessage && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 p-3.5 rounded-lg flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest"><AlertCircle size={14}/> Motivo da Rejeição:</div>
            <p className="text-sm text-red-700 dark:text-red-300 italic">"{rejectionMessage}"</p>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center items-start md:items-end gap-3 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 min-w-[180px]">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.color} ${config.border}`}>
          {config.icon} {config.label}
        </div>
        
        <div className="w-full mt-2">
          {isRejected && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/editar-producao/${data.id}`); }} className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-colors">
              <Wrench size={14}/> Editar e Reenviar
            </button>
          )}
          {isDraft && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/editar-producao/${data.id}`); }} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 py-2 px-4 rounded-lg text-xs font-bold transition-colors">
              <Edit3 size={14}/> Continuar Editando
            </button>
          )}
          {!isRejected && !isDraft && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/minha-producao/${data.id}`); }} className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-lg text-sm font-bold transition-colors">
              <Eye size={16}/> Visualizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const CardHistorico = ({ data, navigate }) => {
  const aprovou = data.meu_veredito && data.meu_veredito.toUpperCase().includes("APROVADO")

  return (
    <div 
      onClick={() => navigate(`/dashboard/producao/${data.id}`, { state: { fromHistory: true } })}
      className="group flex flex-col md:flex-row gap-6 p-5 md:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">{data.disciplina}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Revisado em: {data.data_revisao}</span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">{data.titulo}</h3>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <User size={14}/> Autor: {data.autor_anonimo || "Anônimo"}
        </div>
      </div>

      <div className="flex flex-col justify-center items-start md:items-end gap-1 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 min-w-[180px]">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seu Parecer</span>
        <div className={`flex items-center gap-1.5 text-sm font-black mb-3 ${aprovou ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {aprovou ? <CheckCircle2 size={18}/> : <XCircle size={18}/>} {aprovou ? "FAVORÁVEL" : "DESFAVORÁVEL"}
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-lg text-sm font-bold transition-colors">
          <Eye size={16}/> Ver Detalhes
        </button>
      </div>
    </div>
  )
}

export default MinhasProducoes