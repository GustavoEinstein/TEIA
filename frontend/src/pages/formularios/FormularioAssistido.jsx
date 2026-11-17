import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Bot,
  BookOpen,
  Edit3,
  Loader2,
  GraduationCap,
  BookA,
  AlertTriangle,
  Target,
  ClipboardList,
  Layers,
  BookMarked,
  RotateCcw,
  Wrench,
  XCircle,
} from "lucide-react"
import api from "../../services/api"

const CatalogarAssistido = () => {
  const navigate = useNavigate()

  // Estados para o prompt livre
  const [promptTexto, setPromptTexto] = useState("")

  // Estados para os filtros
  const [etapa, setEtapa] = useState("")
  const [materia, setMateria] = useState("")
  const [ano, setAno] = useState("")

  // Estados de controle e resposta
  const [loading, setLoading] = useState(false)
  const [planoGerado, setPlanoGerado] = useState(null)
  const [filtrosUsados, setFiltrosUsados] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Opções para os botões intuitivos
  const opcoesEtapa = [
    { id: "fundamental", label: "Fundamental" },
    { id: "medio", label: "Ensino Médio" },
  ]

  // Disciplinas por etapa - ajuda a IA a acertar a BNCC
  const disciplinasPorEtapa = {
    fundamental: [
      { id: "lingua_portuguesa", label: "Língua Portuguesa" },
      { id: "matematica", label: "Matemática" },
      { id: "ciencias", label: "Ciências" },
      { id: "historia", label: "História" },
      { id: "geografia", label: "Geografia" },
      { id: "arte", label: "Arte" },
      { id: "educacao_fisica", label: "Educação Física" },
      { id: "ingles", label: "Língua Inglesa" },
      { id: "computacao", label: "Computação" },
    ],
    medio: [
      { id: "lingua_portuguesa", label: "Língua Portuguesa" },
      { id: "matematica", label: "Matemática" },
      { id: "fisica", label: "Física" },
      { id: "quimica", label: "Química" },
      { id: "biologia", label: "Biologia" },
      { id: "historia", label: "História" },
      { id: "geografia", label: "Geografia" },
      { id: "filosofia", label: "Filosofia" },
      { id: "sociologia", label: "Sociologia" },
      { id: "arte", label: "Arte" },
      { id: "educacao_fisica", label: "Educação Física" },
      { id: "ingles", label: "Língua Inglesa" },
      { id: "espanhol", label: "Língua Espanhola" },
      { id: "computacao", label: "Computação" },
    ],
  }

  // Anos/séries por etapa
  const anosPorEtapa = {
    fundamental: [
      { id: "1", label: "1º Ano" },
      { id: "2", label: "2º Ano" },
      { id: "3", label: "3º Ano" },
      { id: "4", label: "4º Ano" },
      { id: "5", label: "5º Ano" },
      { id: "6", label: "6º Ano" },
      { id: "7", label: "7º Ano" },
      { id: "8", label: "8º Ano" },
      { id: "9", label: "9º Ano" },
    ],
    medio: [
      { id: "1", label: "1ª Série" },
      { id: "2", label: "2ª Série" },
      { id: "3", label: "3ª Série" },
    ],
  }

  // Opções dinâmicas baseadas na etapa selecionada
  const opcoesDisciplina = etapa ? disciplinasPorEtapa[etapa] || [] : []
  const opcoesAno = etapa ? anosPorEtapa[etapa] || [] : []

  // Resetar ano e matéria quando etapa mudar
  useEffect(() => {
    setAno("")
    setMateria("")
  }, [etapa])

  // Animação de progresso
  useEffect(() => {
    let interval
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90
          const increment = Math.floor(Math.random() * 7) + 2
          return Math.min(prev + increment, 90)
        })
      }, 800)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleProcessAI = async () => {
    if (!promptTexto.trim()) {
      setError("Por favor, descreva no Passo 3 o que você deseja ensinar.")
      return
    }

    setLoading(true)
    setProgress(0)
    setPlanoGerado(null)
    setFiltrosUsados(null)
    setError(null)

    try {
      const response = await api.post("api/production/gerar-plano-qwen/", {
        prompt: promptTexto,
        etapa: etapa || null,
        materia: materia || null,
        ano: ano || null,
      })

      setPlanoGerado(response.data.plano_aula)
      setFiltrosUsados(response.data.filtros_utilizados)
      setProgress(100)

      setTimeout(() => {
        setLoading(false)
      }, 400)
    } catch (err) {
      console.error("Erro ao gerar plano:", err)
      setLoading(false)
      setProgress(0)
      setError(err.response?.data?.detail || "O assistente não conseguiu processar o pedido. Tente novamente.")
    }
  }

  const handleRetry = () => {
    setError(null)
    handleProcessAI()
  }

  const handleApplyToForm = () => {
    if (!planoGerado) return

    // O backend já retorna estrutura pronta para o formulário manual
    const catalogedData = {
      titulo: planoGerado.titulo || `Plano de Aula: ${filtrosUsados?.materia || "Geral"}`,
      disciplina: filtrosUsados?.materia || "Geral",
      categoria: planoGerado.categoria || "Plano de Aula",
      modelo_ia: "LLM-UnB",
      bncc: planoGerado.bncc?.map((b) => `${b.codigo} - ${b.descricao}`).join("\n\n") || "",
      bncc_computacao: planoGerado.bncc_computacao?.map((b) => `${b.codigo} - ${b.descricao}`).join("\n\n") || "",
      metodologia: planoGerado.metodologia || "",
      duracao: planoGerado.duracao || "",
      recursos: planoGerado.recursos || [],
      experiencia: planoGerado.passo_a_passo?.join("\n\n") || "",
      resultados: planoGerado.avaliacao || "",
      avaliacao: planoGerado.avaliacao || "",
      prompts_ia: planoGerado.prompts_ia || promptTexto,
    }

    navigate("/dashboard/catalogar/manual", {
      state: { initialData: catalogedData },
    })
  }

  // Componente para badge BNCC com tooltip
  const BnccBadge = ({ codigo, descricao }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const tooltipRef = useRef(null)

    return (
      <div className="relative group" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 cursor-help transition-all hover:bg-blue-100 dark:hover:bg-blue-900/60">
          <Target size={12} className="flex-shrink-0" />
          <span className="font-mono">{codigo}</span>
        </span>
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg shadow-lg whitespace-normal max-w-xs animate-fade-in"
            role="tooltip"
          >
            <p className="font-medium mb-1">{codigo}</p>
            <p>{descricao}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
          </div>
        )}
      </div>
    )
  }

  // Componente para card Metodologia/Avaliação
  const InfoCard = ({ title, icon: Icon, children, color = "blue" }) => {
    const colors = {
      blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
      green: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
      purple: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200",
      orange: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200",
    }

    return (
      <div className={`p-4 rounded-xl border ${colors[color]}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={18} className="flex-shrink-0" />
          <h5 className="font-bold text-sm uppercase tracking-wider m-0">{title}</h5>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-line">{children}</div>
      </div>
    )
  }

  // Componente para timeline do passo a passo
  const PassoTimeline = ({ passos }) => {
    if (!passos || passos.length === 0) return null

    return (
      <div className="space-y-4">
        {passos.map((passo, index) => (
          <div key={index} className="relative pl-8 pb-4 last:pb-0">
            <div className="absolute left-0 top-1 flex-shrink-0">
              <div className="relative z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
              </div>
              {index < passos.length - 1 && (
                <div className="absolute left-2 top-8 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed m-0">{passo}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1300px] mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button
            onClick={() => navigate("/dashboard/catalogar")}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-bold text-sm transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar para seleção
          </button>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              <Sparkles size={20} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
              Assistente de Planejamento (IA)
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
          <p className="text-base text-slate-600 dark:text-slate-400 mb-8 max-w-3xl leading-relaxed">
            Siga os passos abaixo. A inteligência artificial vai conectar o seu
            tema com as habilidades corretas da
            <strong> BNCC</strong> e criar a estrutura inicial do seu plano de
            aula.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* --- ESQUERDA: Formulário Guiado --- */}
            <div className="lg:col-span-6 flex flex-col">
              {/* Bloco Conversacional de Filtros */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
                {/* Passo 1 */}
                <div className="mb-6">
                  <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-blue-600 dark:text-blue-400" />
                    1. Para qual turma você dá aula?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {opcoesEtapa.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setEtapa(etapa === op.id ? "" : op.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                          etapa === op.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>

                  {etapa && (
                    <div className="space-y-3">
                      {/* Dropdown Ano/Série */}
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        {etapa === "fundamental" ? "Ano:" : "Série:"}
                      </label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full sm:w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none dark:text-white appearance-none bg-no-repeat bg-right pr-10"
                        style={{
                          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                          backgroundPosition: "right 0.5rem center",
                          backgroundSize: "1.5em 1.5em",
                        }}
                      >
                        <option value="" disabled>
                          {etapa === "fundamental" ? "Selecione o ano (1º a 9º)" : "Selecione a série (1ª a 3ª)"}
                        </option>
                        {opcoesAno.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Dropdown Disciplina */}
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        Disciplina:
                      </label>
                      <select
                        value={materia}
                        onChange={(e) => setMateria(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none dark:text-white appearance-none bg-no-repeat bg-right pr-10"
                        style={{
                          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                          backgroundPosition: "right 0.5rem center",
                          backgroundSize: "1.5em 1.5em",
                        }}
                      >
                        <option value="" disabled>
                          Selecione a disciplina
                        </option>
                        {opcoesDisciplina.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!etapa && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      Selecione a etapa acima para escolher ano/série e disciplina
                    </p>
                  )}
                </div>
              </div>

              {/* Passo 2 */}
              <label className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <Bot size={20} className="text-purple-600 dark:text-purple-400" />
                2. O que você quer ensinar hoje?
              </label>
              <textarea
                value={promptTexto}
                onChange={(e) => setPromptTexto(e.target.value)}
                placeholder="Ex: Quero dar uma aula sobre a Revolução Industrial com foco no impacto social..."
                rows="6"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base focus:border-purple-600 dark:focus:border-purple-400 outline-none transition-all dark:text-white placeholder-slate-400 font-sans leading-relaxed resize-y shadow-inner"
              />

              {/* Error Inline */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-slide-down">
                  <XCircle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw size={14} /> Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleProcessAI}
                disabled={loading}
                className={`relative mt-6 w-full h-[56px] rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden border-none cursor-pointer ${
                  loading
                    ? "bg-purple-200 dark:bg-purple-900/50 cursor-wait"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {loading && (
                  <div
                    className="absolute left-0 top-0 h-full bg-purple-500 dark:bg-purple-400 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center gap-2 text-lg font-extrabold tracking-wide ${loading ? "text-white" : ""}`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Consultando BNCC e gerando... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} /> Gerar Plano de Aula
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* --- DIREITA: Plano Gerado (Rich UI) --- */}
            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
              {/* Loader Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-purple-700 dark:text-purple-400 transition-all duration-500">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl mb-4">
                    <Loader2 size={36} className="animate-spin" />
                  </div>
                  <p className="font-bold text-base tracking-wide animate-pulse bg-white/80 dark:bg-slate-800/80 px-4 py-1 rounded-full">
                    O Assistente está conectando as habilidades...
                  </p>
                </div>
              )}

              {/* Corpo do Resultado */}
              <div>
                <h3 className="text-base font-extrabold text-[#1565C0] dark:text-blue-400 flex items-center gap-2 mb-6 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-3">
                  <CheckCircle2 size={20} /> Resultado da IA
                </h3>

                {planoGerado ? (
                  <div className="space-y-5 max-h-[550px] overflow-y-auto pr-2">
                    {/* Tags de Identificação */}
                    {filtrosUsados && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                          {filtrosUsados.etapa.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">
                          {filtrosUsados.materia.toUpperCase()}
                        </span>
                        {filtrosUsados.ano && (
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-800">
                            {filtrosUsados.ano}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800">
                          {planoGerado.nivel || "Nível não definido"}
                        </span>
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                          {planoGerado.categoria || "Plano de Aula"}
                        </span>
                      </div>
                    )}

                    {/* Título */}
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h4 className="font-black text-lg text-slate-800 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                        {planoGerado.titulo}
                      </h4>

                      {/* BNCC Section - Badges com Tooltip */}
                      {(planoGerado.bncc?.length > 0 || planoGerado.bncc_computacao?.length > 0) && (
                        <div className="mb-5">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Target size={16} className="text-blue-500" />
                            Habilidades BNCC
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {planoGerado.bncc?.map((item, i) => (
                              <BnccBadge key={i} codigo={item.codigo} descricao={item.descricao} />
                            ))}
                            {planoGerado.bncc_computacao?.map((item, i) => (
                              <div key={"comp-" + i} className="relative group" onMouseEnter={() => {}} onMouseLeave={() => {}}>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800 cursor-help transition-all hover:bg-purple-100 dark:hover:bg-purple-900/60">
                                  <Layers size={12} className="flex-shrink-0" />
                                  <span className="font-mono">{item.codigo}</span>
                                  <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-1 rounded">Comp.</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metodologia + Avaliação - Cards lado a lado */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {planoGerado.metodologia && (
                          <InfoCard
                            title="Metodologia"
                            icon={BookMarked}
                            color="blue"
                            children={planoGerado.metodologia}
                          />
                        )}
                        {planoGerado.avaliacao && (
                          <InfoCard
                            title="Avaliação"
                            icon={ClipboardList}
                            color="green"
                            children={planoGerado.avaliacao}
                          />
                        )}
                      </div>

                      {/* Passo a Passo - Timeline Vertical */}
                      {planoGerado.passo_a_passo?.length > 0 && (
                        <div className="mb-5">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <ClipboardList size={16} className="text-indigo-500" />
                            Passo a Passo
                          </h5>
                          <PassoTimeline passos={planoGerado.passo_a_passo} />
                        </div>
                      )}

                      {/* Recursos - Chip Grid */}
                      {planoGerado.recursos?.length > 0 && (
                        <div>
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Wrench size={16} className="text-amber-500" />
                            Recursos Sugeridos
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {planoGerado.recursos.map((r, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Duração */}
                      {planoGerado.duracao && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <BookOpen size={16} className="text-slate-400" />
                          <span className="font-medium">{planoGerado.duracao}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <BookOpen size={56} className={`mb-4 opacity-30 ${loading ? "animate-bounce text-purple-500" : ""}`} />
                    <p className="text-base font-medium max-w-xs leading-relaxed">
                      Seu rascunho estruturado no formato oficial aparecerá
                      aqui.
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé: Botão de Ação + DISCLAIMER DA IA */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                {planoGerado && !loading && (
                  <button
                    onClick={handleApplyToForm}
                    className="w-full bg-[#1565C0] hover:bg-blue-700 text-white font-extrabold text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-none mb-5"
                  >
                    <Edit3 size={20} />
                    Transformar em Prática
                  </button>
                )}

                {/* Aviso Ético Permanente (HITL) */}
                <div className="flex items-start gap-2 px-1">
                  <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 text-justify">
                    O <strong>LLM-UnB</strong> é uma Inteligência Artificial e
                    pode cometer erros ou apresentar imprecisões. A IA funciona
                    como uma ferramenta para otimizar o seu tempo de
                    planejamento, mas a revisão, a adequação à realidade da
                    turma e a responsabilidade pedagógica sobre o conteúdo
                    continuam sendo inteiramente do docente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CatalogarAssistido