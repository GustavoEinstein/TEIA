import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"
import {
  Search, Bot, CheckCircle2, BookOpen, Tag, 
  Link as LinkIcon, Plus, FolderOpen, Trophy, 
  Scale, ArrowRight, Inbox
} from "lucide-react"

const MainContent = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [producoes, setProducoes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [headerInfo, setHeaderInfo] = useState({ 
    firstName: "Visitante", 
    disciplina: "",
    pontos: "0",
    nivel: "Iniciante"
  })

  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  })
  const dataFormatada = dataAtual.charAt(0).toUpperCase() + dataAtual.slice(1)

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
        disciplina: storedDisc === "Outra" ? "" : storedDisc,
        pontos: localStorage.getItem("user_pontos") || "0",
        nivel: localStorage.getItem("user_nivel") || "Prof. Conectado(a)",
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

  const filteredProducoes = producoes.filter((item) => {
    const matchSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.autor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = activeFilter === "Todos" || 
                        item.disciplina === activeFilter || 
                        item.nivel === activeFilter ||
                        item.categoria === activeFilter
    return matchSearch && matchFilter
  })

  return (
    <div className="w-full flex flex-col overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 pb-16">
      
      {/* 1. PAINEL DE BOAS-VINDAS */}
      <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[11px] font-extrabold text-[#1565C0] dark:text-blue-400 uppercase tracking-wider mb-1">
            {dataFormatada}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
            Olá, Professor(a) {headerInfo.firstName}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {headerInfo.disciplina
              ? `O que vamos tecer hoje para as aulas de ${headerInfo.disciplina}?`
              : "Pronto para inovar nas suas aulas hoje?"}
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <button 
            onClick={() => navigate('/dashboard/minhas-producoes')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm"
          >
            <FolderOpen size={16} /> <span className="hidden sm:inline">Meus Arquivos</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/catalogar')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5"
          >
            <Plus size={18} /> Nova Prática
          </button>
        </div>
      </div>

      {/* 2. LAYOUT DIVIDIDO (Esquerda: Acervo | Direita: Widgets) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        
        {/* COLUNA ESQUERDA (Acervo) */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                <BookOpen size={22} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white m-0">
                Acervo da Comunidade
              </h2>
            </div>
            <span className="bg-blue-50 dark:bg-blue-900/40 text-[#1565C0] dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/50">
              {filteredProducoes.length} materiais
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título ou disciplina..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-11 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none shadow-sm dark:text-white placeholder-slate-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full sm:w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none shadow-sm dark:text-white cursor-pointer transition-all appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option value="Todos">Todas as categorias</option>
              <option value="Fundamental 1">Fundamental 1</option>
              <option value="Ensino Médio">Ensino Médio</option>
              <option value="Computação">Computação</option>
              <option value="Plano de Aula">Plano de Aula</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400 font-medium animate-pulse bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Buscando na rede T.E.I.A...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducoes.length > 0 ? (
                filteredProducoes.map((item) => (
                  <Card key={item.id} data={item} navigate={navigate} />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <Inbox size={32} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Nada encontrado por aqui.</p>
                  <p className="text-sm text-slate-400 mb-6">Seja o primeiro a compartilhar uma prática com este tema!</p>
                  <button 
                    onClick={() => navigate('/dashboard/catalogar')}
                    className="text-[#1565C0] dark:text-blue-400 font-bold text-sm hover:underline"
                  >
                    + Criar nova produção
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA (Widgets) */}
        <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sua Jornada</p>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight mt-0.5">{headerInfo.nivel}</h3>
                </div>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
                {headerInfo.pontos} XP
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 mb-2 mt-5 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
              <div className="bg-amber-500 h-2 rounded-full w-[65%]"></div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-right">
              Continue avaliando para subir de nível
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Scale size={18} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Duplo-Cego</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              A comunidade precisa de você! Existem práticas de <strong>{headerInfo.disciplina || "sua área"}</strong> aguardando validação por pares.
            </p>
            <button 
              onClick={() => navigate('/dashboard/revisao')}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
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
  return (
    <div
      onClick={() => navigate(`/dashboard/producao/${data.id}`)}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#1565C0]/40 dark:hover:border-blue-500/40 flex flex-col transition-all duration-200 cursor-pointer h-full overflow-hidden"
    >
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4 gap-2">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider line-clamp-1">
            {data.disciplina}
          </span>
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 dark:border-blue-800/40 whitespace-nowrap">
            <Bot size={12} /> {data.modelo_ia || "IA"}
          </div>
        </div>

        <h3 className="text-slate-800 dark:text-white font-bold text-base mb-3 leading-snug line-clamp-2 group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">
          {data.titulo}
        </h3>

        {data.producao_base && (
          <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold mb-3 border border-dashed border-blue-200 dark:border-blue-700 w-fit">
            <LinkIcon size={11} /> Releitura
          </div>
        )}

        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mt-auto">
          {data.resumo}
        </p>
      </div>

      <div className="flex justify-between items-center px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Tag size={13} />
          <span className="text-[11px] font-semibold">{data.categoria || "Geral"}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
          <CheckCircle2 size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Validado</span>
        </div>
      </div>
    </div>
  )
}

export default MainContent