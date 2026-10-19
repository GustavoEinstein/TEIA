import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"
import {
  Search, Bot, CheckCircle2, BookOpen, Tag, User,
  Link as LinkIcon, Plus, FolderOpen, Trophy, 
  Scale, ArrowRight
} from "lucide-react"

const MainContent = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [producoes, setProducoes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [headerInfo, setHeaderInfo] = useState({ 
    firstName: "Visitante", 
    disciplina: "Geral",
    pontos: "0",
    nivel: "🌱 Prof. Conectado(a)"
  })

  useEffect(() => {
    const updateHeaderInfo = () => {
      const storedName = localStorage.getItem("user_name") || ""
      const storedDisc = localStorage.getItem("user_disciplina") || ""
      let formattedName = "Visitante"
      if (storedName) {
        const first = storedName.split(" ")[0]
        formattedName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
      }
      setHeaderInfo({
        firstName: formattedName,
        disciplina: !storedDisc || storedDisc === "Outra" ? "Geral" : storedDisc,
        pontos: localStorage.getItem("user_pontos") || "0",
        nivel: localStorage.getItem("user_nivel") || "🌱 Prof. Conectado(a)",
      })
    }

    const fetchData = async () => {
      try {
        const response = await api.get("api/public/feed/")
        setProducoes(response.data)
      } catch (error) {
        console.error("Erro ao carregar feed:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    updateHeaderInfo()
    fetchData()
  }, [])

  const filteredProducoes = producoes.filter(
    (item) =>
      item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.disciplina?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo_ia?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full flex flex-col overflow-x-hidden min-h-screen bg-[#F4F7FE] dark:bg-slate-950 transition-colors duration-200 pb-16">
      
      {/* 1. BANNER AZUL ORIGINAL */}
      <div className="w-full bg-[#1565C0] dark:bg-gradient-to-r dark:from-slate-900 dark:to-[#1E3A8A] text-white px-5 py-8 md:py-10 rounded-b-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.15)] mb-6">
        <div className="max-w-[700px] w-full mx-auto text-center">
          <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight mb-2.5">
            Olá, Professor(a) {headerInfo.firstName}!
          </h1>
          <p className="text-sm md:text-base text-white/90 font-normal mb-7">
            {headerInfo.disciplina
              ? `Pronto para inovar nas aulas de ${headerInfo.disciplina}?`
              : "Explore produções validadas pela comunidade."}
          </p>

          <div className="relative w-full max-w-[600px] mx-auto">
            <input
              type="text"
              placeholder="Pesquise por disciplina, tema ou IA..."
              className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 rounded-full py-3.5 pl-5 pr-12 text-[15px] font-medium border border-slate-200 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.1)] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1565C0] dark:text-blue-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO: CENTRAL DA COMUNIDADE + 3 GADGETS LATERAIS */}
      <div className="w-full max-w-[1650px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ESQUERDA: Card Original "Central da Comunidade" */}
        <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 md:p-7">
          
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <BookOpen size={22} className="text-[#1565C0] dark:text-blue-400" />
              <h2 className="text-lg md:text-[22px] font-extrabold text-slate-900 dark:text-white m-0">
                Central da Comunidade
              </h2>
            </div>
            <span className="bg-blue-50 dark:bg-blue-900/40 text-[#1565C0] dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
              {filteredProducoes.length}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Carregando materiais...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredProducoes.length > 0 ? (
                filteredProducoes.map((item) => (
                  <Card key={item.id} data={item} navigate={navigate} />
                ))
              ) : (
                <div className="col-span-full text-center text-slate-400 py-8">
                  Nenhuma produção encontrada.
                </div>
              )}
            </div>
          )}
        </div>

        {/* DIREITA: Os 3 Gadgets Solicitados */}
        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
          
          {/* 1. Botões: Meus Arquivos + Nova Prática */}
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => navigate('/dashboard/minhas-producoes')}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <FolderOpen size={16} /> Meus Arquivos
            </button>
            <button 
              onClick={() => navigate('/dashboard/catalogar')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer border-none"
            >
              <Plus size={18} /> Nova Prática
            </button>
          </div>

          {/* 2. Card: Sua Jornada (XP) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/40 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider m-0">
                    Sua Jornada
                  </p>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight mt-0.5 m-0">
                    {headerInfo.nivel}
                  </h3>
                </div>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-extrabold border border-slate-200 dark:border-slate-700">
                {headerInfo.pontos} XP
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 mt-5 overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full w-[60%]"></div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-right m-0">
              Continue avaliando para subir de nível
            </p>
          </div>

          {/* 3. Card: Duplo-Cego */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Scale size={18} />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base m-0">
                Duplo-Cego
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              A comunidade precisa de você! Existem práticas de <strong>{headerInfo.disciplina || "Geral"}</strong> aguardando validação por pares.
            </p>
            <button 
              onClick={() => navigate('/dashboard/revisao')}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Revisar Práticas <ArrowRight size={16} className="text-slate-400" />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

const Card = ({ data, navigate }) => {
  const isAnonymous = data.autor === "Professor(a) Anônimo(a)"

  return (
    <div
      onClick={() => navigate(`/dashboard/producao/${data.id}`)}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-[#1565C0] dark:hover:border-blue-500 flex flex-col transition-all duration-300 cursor-pointer h-full p-5"
    >
      <div className="flex justify-between items-center mb-3 gap-2">
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider truncate">
          {data.disciplina}
        </span>
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
          <Bot size={14} /> {data.modelo_ia}
        </div>
      </div>

      <div className="flex-1 mb-4">
        <h3 className="text-slate-900 dark:text-white font-bold text-[17px] mb-1.5 leading-snug break-words">
          {data.titulo}
        </h3>

        {data.autor && (
          <div className={`flex items-center gap-1 text-xs font-semibold mb-2.5 ${isAnonymous ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
            <User size={12} /> {data.autor}
          </div>
        )}

        {data.producao_base && (
          <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-2 py-0.5 rounded text-[11px] font-bold mb-3 border border-dashed border-[#1565C0] dark:border-blue-500">
            <LinkIcon size={12} /> Releitura
          </div>
        )}

        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 m-0">
          {data.resumo}
        </p>
      </div>

      <div className="flex justify-between items-center pt-3.5 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Tag size={16} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {data.categoria || "Geral"}
          </span>
        </div>
        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  )
}

export default MainContent