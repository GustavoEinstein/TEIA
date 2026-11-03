import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import {
  Trophy, Medal, Star, MessageSquare, ShieldCheck, 
  Award, Loader2, ArrowLeft, Crown
} from "lucide-react"

export default function Ranking() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("xp")

  const [rankingData, setRankingData] = useState({
    top_xp: [], top_revisores: [], top_forum: [],
  })

  useEffect(() => {
    const carregarRanking = async () => {
      try {
        const response = await api.get("api/ranking/")
        setRankingData({
          top_xp: response.data.top_xp || [],
          top_revisores: response.data.top_revisores || [],
          top_forum: response.data.top_forum || [],
        })
      } catch (error) {
        console.error("Erro ao carregar ranking", error)
      } finally {
        setLoading(false)
      }
    }
    carregarRanking()
  }, [])

  const getCurrentList = () => {
    if (activeTab === "xp") return rankingData.top_xp
    if (activeTab === "revisores") return rankingData.top_revisores
    if (activeTab === "forum") return rankingData.top_forum
    return []
  }

  const currentList = getCurrentList()
  const podium = currentList.slice(0, 3)
  const restOfList = currentList.slice(3)

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold flex items-center gap-2">
        <Loader2 className="animate-spin" size={24} /> Carregando Hall da Fama...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* CABEÇALHO */}
        <header className="mb-10">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors mb-6">
            <ArrowLeft size={18} /> Voltar
          </button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Hall da Fama T.E.I.A
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Os professores que mais impactam a nossa comunidade educativa.
              </p>
            </div>
          </div>
        </header>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-10 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("xp")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "xp" ? "bg-[#1565C0] text-white shadow-md" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <Star size={18} /> Mestres em XP
          </button>
          <button
            onClick={() => setActiveTab("revisores")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "revisores" ? "bg-[#1565C0] text-white shadow-md" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <ShieldCheck size={18} /> Top Revisores
          </button>
          <button
            onClick={() => setActiveTab("forum")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "forum" ? "bg-[#1565C0] text-white shadow-md" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <MessageSquare size={18} /> Vozes do Fórum
          </button>
        </div>

        {/* CONTEÚDO DO RANKING */}
        <div>
          {currentList.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center">
              <Award size={56} className="text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">O pódio ainda está vazio!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma pontuação registrada nesta categoria até o momento.</p>
            </div>
          ) : (
            <>
              {/* PÓDIO (TOP 3) */}
              <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 md:gap-6 mb-10">
                
                {/* 2º LUGAR */}
                {podium[1] && (
                  <div className="flex-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative md:mt-10 hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-600 flex items-center justify-center mb-4 z-10 shadow-sm">
                      <Medal size={28} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1.5">2º Lugar</div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 leading-tight">{podium[1].nome}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">{podium[1].disciplina}</p>
                    <div className="mt-auto bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full text-sm font-black border border-slate-200 dark:border-slate-700">
                      {activeTab === "xp" ? `${podium[1].pontos} XP` : `${podium[1].total} Interações`}
                    </div>
                  </div>
                )}

                {/* 1º LUGAR */}
                {podium[0] && (
                  <div className="flex-1 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 p-6 md:p-8 rounded-2xl border-2 border-amber-300 dark:border-amber-700/50 shadow-lg flex flex-col items-center text-center relative md:-mt-4 hover:-translate-y-1 transition-transform z-10 scale-100 md:scale-105">
                    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 border-4 border-amber-400 dark:border-amber-600 flex items-center justify-center mb-4 z-10 shadow-md">
                      <Crown size={36} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-xs font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest mb-1.5">1º Lugar</div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 leading-tight">{podium[0].nome}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">{podium[0].disciplina}</p>
                    <div className="mt-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-5 py-2 rounded-full text-sm font-black border border-amber-200 dark:border-amber-800/50">
                      {activeTab === "xp" ? `${podium[0].pontos} XP` : `${podium[0].total} Interações`}
                    </div>
                  </div>
                )}

                {/* 3º LUGAR */}
                {podium[2] && (
                  <div className="flex-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative md:mt-14 hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 border-4 border-orange-300 dark:border-orange-800/50 flex items-center justify-center mb-4 z-10 shadow-sm">
                      <Medal size={28} className="text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="text-xs font-black uppercase text-orange-500/80 tracking-widest mb-1.5">3º Lugar</div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 leading-tight">{podium[2].nome}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">{podium[2].disciplina}</p>
                    <div className="mt-auto bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full text-sm font-black border border-slate-200 dark:border-slate-700">
                      {activeTab === "xp" ? `${podium[2].pontos} XP` : `${podium[2].total} Interações`}
                    </div>
                  </div>
                )}
              </div>

              {/* LISTA RESTANTE (4 AO 10) */}
              {restOfList.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col gap-2 shadow-sm">
                  {restOfList.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                        {index + 4}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight mb-0.5 truncate">{user.nome}</h4>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate block">
                          {user.disciplina} • {user.nivel}
                        </span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-black border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {activeTab === "xp" ? `${user.pontos} XP` : `${user.total} Pts`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}