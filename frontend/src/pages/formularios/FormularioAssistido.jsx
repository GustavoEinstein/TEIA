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
  AlertTriangle,
  Target,
  ClipboardList,
  Layers,
  BookMarked,
  RotateCcw,
  Wrench,
  XCircle,
  FileText,
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

  const opcoesDisciplina = etapa ? disciplinasPorEtapa[etapa] || [] : []
  const opcoesAno = etapa ? anosPorEtapa[etapa] || [] : []

  useEffect(() => {
    setAno("")
    setMateria("")
  }, [etapa])

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

  // Normaliza lista de BNCC (aceita objetos {codigo, descricao} ou strings)
  const formatarListaBncc = (lista) => {
    if (!lista) return ""
    if (typeof lista === "string") return lista.trim()
    if (!Array.isArray(lista)) return ""

    return lista
      .map((item) => {
        if (typeof item === "string") return item.trim()
        if (item && typeof item === "object") {
          const cod = (item.codigo || item.code || "").trim()
          const desc = (item.descricao || item.description || "").trim()
          if (cod && desc) return `${cod} - ${desc}`
          return cod || desc
        }
        return ""
      })
      .filter(Boolean)
      .join("\n\n")
  }

  // Normaliza o relato para parágrafos em texto corrido
  const obterParagrafosRelato = (plano) => {
    if (!plano) return []
    const fonte =
      plano.passo_a_passo || plano.relato_experiencia || plano.experiencia || []
    if (typeof fonte === "string") {
      return fonte
        .split(/\n\s*\n|\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    }
    if (Array.isArray(fonte)) {
      return fonte.map((p) => String(p).trim()).filter(Boolean)
    }
    return []
  }

  const handleProcessAI = async () => {
    if (!promptTexto.trim()) {
      setError("Por favor, descreva no Passo 2 o que você deseja ensinar.")
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
      setError(
        err.response?.data?.detail ||
          "O assistente não conseguiu processar o pedido. Tente novamente.",
      )
    }
  }

  const handleRetry = () => {
    setError(null)
    handleProcessAI()
  }

  const handleApplyToForm = () => {
    if (!planoGerado) return

    const paragrafosRelato = obterParagrafosRelato(planoGerado)
    const bnccFormatada = formatarListaBncc(planoGerado.bncc)
    const bnccCompFormatada = formatarListaBncc(planoGerado.bncc_computacao)

    // Resolve o Nível de Ensino caso o usuário tenha selecionado filtros ou vindo da IA
    const nivelInferido =
      planoGerado.nivel ||
      (etapa === "medio"
        ? "Ensino Médio"
        : etapa === "fundamental"
          ? Number(ano) >= 6
            ? "Fundamental 2"
            : "Fundamental 1"
          : "Fundamental 2")

    // Resolve o nome legível da disciplina selecionada
    const disciplinaSelecionadaObj = opcoesDisciplina.find(
      (d) => d.id === materia,
    )
    const disciplinaFinal =
      disciplinaSelecionadaObj?.label ||
      (filtrosUsados?.materia && filtrosUsados.materia !== "Geral"
        ? filtrosUsados.materia
        : "Geral")

    const catalogedData = {
      titulo: planoGerado.titulo || `Plano de Aula: ${disciplinaFinal}`,
      disciplina: disciplinaFinal,
      nivel: nivelInferido,
      nivel_ensino: nivelInferido,
      categoria: planoGerado.categoria || "Plano de Aula",
      modelo_ia: "LLM-UnB",
      bncc: bnccFormatada,
      bncc_computacao: bnccCompFormatada,
      possui_computacao: Boolean(bnccCompFormatada),
      metodologia: planoGerado.metodologia || "",
      duracao: planoGerado.duracao || "",
      recursos: Array.isArray(planoGerado.recursos) ? planoGerado.recursos : [],
      experiencia: paragrafosRelato.join("\n\n"),
      resultados: planoGerado.avaliacao || planoGerado.resultados || "",
      avaliacao: planoGerado.avaliacao || planoGerado.resultados || "",
      prompts_ia: planoGerado.prompts_ia || promptTexto,
    }

    navigate("/dashboard/catalogar/manual", {
      state: { initialData: catalogedData },
    })
  }

  // Badge BNCC com tooltip (suporta BNCC comum e Computação)
  const BnccBadge = ({ codigo, descricao, isComputacao = false }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const tooltipRef = useRef(null)

    return (
      <div
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border cursor-help transition-all ${
            isComputacao
              ? "bg-purple-50 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60"
              : "bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
          }`}
        >
          {isComputacao ? (
            <Layers size={12} className="flex-shrink-0" />
          ) : (
            <Target size={12} className="flex-shrink-0" />
          )}
          <span className="font-mono">{codigo}</span>
          {isComputacao && (
            <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-1 rounded">
              Comp.
            </span>
          )}
        </span>
        {showTooltip && descricao && (
          <div
            ref={tooltipRef}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg shadow-lg whitespace-normal w-72 max-w-xs animate-fade-in"
            role="tooltip"
          >
            <p className="font-bold mb-1">{codigo}</p>
            <p className="leading-relaxed">{descricao}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
          </div>
        )}
      </div>
    )
  }

  // Card para Metodologia e Resultados
  const InfoCard = ({ title, icon: Icon, children, color = "blue" }) => {
    const colors = {
      blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
      green:
        "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    }

    return (
      <div className={`p-4 rounded-xl border ${colors[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon size={18} className="flex-shrink-0" />
          <h5 className="font-bold text-xs uppercase tracking-wider m-0">
            {title}
          </h5>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-line">
          {children}
        </div>
      </div>
    )
  }

  const paragrafosRelatoAtual = obterParagrafosRelato(planoGerado)

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
            <strong> BNCC</strong> e redigir o relato detalhado da aula e os
            resultados esperados.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* --- ESQUERDA: Formulário Guiado --- */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
                <div className="mb-6">
                  <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <GraduationCap
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />
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
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        {etapa === "fundamental" ? "Ano:" : "Série:"}
                      </label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full sm:w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none dark:text-white appearance-none bg-no-repeat bg-right pr-10"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                          backgroundPosition: "right 0.5rem center",
                          backgroundSize: "1.5em 1.5em",
                        }}
                      >
                        <option value="" disabled>
                          {etapa === "fundamental"
                            ? "Selecione o ano (1º a 9º)"
                            : "Selecione a série (1ª a 3ª)"}
                        </option>
                        {opcoesAno.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        Disciplina:
                      </label>
                      <select
                        value={materia}
                        onChange={(e) => setMateria(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none dark:text-white appearance-none bg-no-repeat bg-right pr-10"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
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
                      Selecione a etapa acima para escolher ano/série e
                      disciplina
                    </p>
                  )}
                </div>
              </div>

              {/* Passo 2 */}
              <label className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <Bot
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
                2. O que você quer ensinar hoje?
              </label>
              <textarea
                value={promptTexto}
                onChange={(e) => setPromptTexto(e.target.value)}
                placeholder="Ex: Quero dar uma aula sobre o Egito Antigo abordando a importância do Rio Nilo, sociedade e religião..."
                rows="6"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base focus:border-purple-600 dark:focus:border-purple-400 outline-none transition-all dark:text-white placeholder-slate-400 font-sans leading-relaxed resize-y shadow-inner"
              />

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-slide-down">
                  <XCircle
                    size={20}
                    className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                      {error}
                    </p>
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
                  className={`relative z-10 flex items-center gap-2 text-lg font-extrabold tracking-wide ${
                    loading ? "text-white" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Consultando BNCC e redigindo... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} /> Gerar Plano de Aula
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* --- DIREITA: Plano Gerado (Texto Corrido & BNCC) --- */}
            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-purple-700 dark:text-purple-400 transition-all duration-500">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl mb-4">
                    <Loader2 size={36} className="animate-spin" />
                  </div>
                  <p className="font-bold text-base tracking-wide animate-pulse bg-white/80 dark:bg-slate-800/80 px-4 py-1 rounded-full">
                    Estruturando relato pedagógico e habilidades da BNCC...
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-base font-extrabold text-[#1565C0] dark:text-blue-400 flex items-center gap-2 mb-6 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-3">
                  <CheckCircle2 size={20} /> Resultado da IA
                </h3>

                {planoGerado ? (
                  <div className="space-y-5 max-h-[580px] overflow-y-auto pr-2">
                    {/* Tags de Identificação Seguras */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filtrosUsados?.etapa && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                          {String(filtrosUsados.etapa).toUpperCase()}
                        </span>
                      )}
                      {filtrosUsados?.materia && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">
                          {String(filtrosUsados.materia).toUpperCase()}
                        </span>
                      )}
                      {filtrosUsados?.ano && (
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-800">
                          {filtrosUsados.ano}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800">
                        {planoGerado.nivel || "Fundamental 2"}
                      </span>
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                        {planoGerado.categoria || "Plano de Aula"}
                      </span>
                    </div>

                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h4 className="font-black text-lg text-slate-800 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                        {planoGerado.titulo}
                      </h4>

                      {/* Habilidades BNCC (Badges + Descrição Completa) */}
                      {(planoGerado.bncc?.length > 0 ||
                        planoGerado.bncc_computacao?.length > 0) && (
                        <div className="mb-5">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Target size={16} className="text-blue-500" />
                            Habilidades BNCC
                          </h5>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {planoGerado.bncc?.map((item, i) => (
                              <BnccBadge
                                key={i}
                                codigo={item.codigo || item}
                                descricao={item.descricao || ""}
                              />
                            ))}
                            {planoGerado.bncc_computacao?.map((item, i) => (
                              <BnccBadge
                                key={"comp-" + i}
                                codigo={item.codigo || item}
                                descricao={item.descricao || ""}
                                isComputacao
                              />
                            ))}
                          </div>
                          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                            {planoGerado.bncc?.map((item, i) => (
                              <p key={i} className="m-0 leading-relaxed">
                                <strong className="text-blue-700 dark:text-blue-400 font-mono">
                                  {item.codigo}
                                </strong>
                                {item.descricao ? ` — ${item.descricao}` : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metodologia */}
                      {planoGerado.metodologia && (
                        <div className="mb-5">
                          <InfoCard
                            title="Metodologia"
                            icon={BookMarked}
                            color="blue"
                          >
                            {planoGerado.metodologia}
                          </InfoCard>
                        </div>
                      )}

                      {/* Relato da Experiência em Texto Corrido (Estilo ChatGPT/Gemini) */}
                      {paragrafosRelatoAtual.length > 0 && (
                        <div className="mb-5">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-indigo-500" />
                            Relato da Experiência (Desenvolvimento da Aula)
                          </h5>
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            {paragrafosRelatoAtual.map((paragrafo, index) => (
                              <p
                                key={index}
                                className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed m-0 text-justify"
                              >
                                {paragrafo}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resultados Baseados no Relato */}
                      {planoGerado.avaliacao && (
                        <div className="mb-5">
                          <InfoCard
                            title="Resultados Esperados (Baseados no Relato)"
                            icon={ClipboardList}
                            color="green"
                          >
                            {planoGerado.avaliacao}
                          </InfoCard>
                        </div>
                      )}

                      {/* Recursos */}
                      {planoGerado.recursos?.length > 0 && (
                        <div>
                          <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Wrench size={16} className="text-amber-500" />
                            Recursos Didáticos
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
                          <span className="font-medium">
                            Duração estimada: {planoGerado.duracao}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <BookOpen
                      size={56}
                      className={`mb-4 opacity-30 ${
                        loading ? "animate-bounce text-purple-500" : ""
                      }`}
                    />
                    <p className="text-base font-medium max-w-xs leading-relaxed">
                      Seu planejamento detalhado em texto corrido com as
                      habilidades da BNCC aparecerá aqui.
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

                <div className="flex items-start gap-2 px-1">
                  <AlertTriangle
                    size={16}
                    className="text-orange-500 shrink-0 mt-0.5"
                  />
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
