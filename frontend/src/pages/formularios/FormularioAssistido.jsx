import React, { useState, useEffect } from "react"
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
  AlertTriangle, // <-- Novo ícone importado
} from "lucide-react"
import api from "../../services/api"
import Swal from "sweetalert2"

const CatalogarAssistido = () => {
  const navigate = useNavigate()

  // Estados para o prompt livre
  const [promptTexto, setPromptTexto] = useState("")

  // Estados para os filtros (Agora visíveis e amigáveis)
  const [etapa, setEtapa] = useState("")
  const [materia, setMateria] = useState("")
  const [ano, setAno] = useState("")

  // Estados de controle e resposta
  const [loading, setLoading] = useState(false)
  const [planoGerado, setPlanoGerado] = useState(null)
  const [filtrosUsados, setFiltrosUsados] = useState(null)
  const [progress, setProgress] = useState(0)

  // Opções para os botões intuitivos
  const opcoesEtapa = [
    { id: "fundamental", label: "Fundamental" },
    { id: "medio", label: "Ensino Médio" },
  ]

  const opcoesDisciplina = [
    { id: "historia", label: "História" },
    { id: "matematica", label: "Matemática" },
    { id: "lingua_portuguesa", label: "Português" },
    { id: "ciencias", label: "Ciências / Biologia" },
    { id: "geografia", label: "Geografia" },
  ]

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
      Swal.fire({
        icon: "warning",
        title: "Faltou o tema!",
        text: "Por favor, descreva no Passo 3 o que você deseja ensinar.",
        confirmButtonColor: "#1565C0",
      })
      return
    }

    setLoading(true)
    setProgress(0)
    setPlanoGerado(null)
    setFiltrosUsados(null)

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
        Swal.fire({
          icon: "success",
          title: "Plano Gerado com Sucesso!",
          text: "A inteligência artificial mapeou as habilidades da BNCC para você.",
          confirmButtonColor: "#1565C0",
        })
      }, 400)
    } catch (error) {
      console.error("Erro ao gerar plano:", error)
      setLoading(false)
      setProgress(0)
      Swal.fire({
        icon: "error",
        title: "Ops, algo deu errado",
        text: "O assistente não conseguiu processar o pedido agora. Tente novamente.",
        confirmButtonColor: "#1565C0",
      })
    }
  }

  const handleApplyToForm = () => {
    if (!planoGerado) return

    // Função escudo: Se a IA inventar de mandar Arrays ou Objetos, converte para texto limpo
    const extrairTextoLimpo = (dado) => {
      if (!dado) return ""
      if (typeof dado === "string") return dado
      if (Array.isArray(dado)) {
        return dado
          .map((item) =>
            typeof item === "object" ? Object.values(item).join(" - ") : item,
          )
          .join("\n\n")
      }
      return JSON.stringify(dado)
    }

    const catalogedData = {
      titulo:
        extrairTextoLimpo(planoGerado.titulo) ||
        `Plano de Aula: ${filtrosUsados?.materia || "Geral"}`,
      disciplina: filtrosUsados?.materia || "Geral",
      categoria: "Plano de Aula",
      modelo_ia: "LLM-UnB (Qwen 3)",
      bncc:
        extrairTextoLimpo(planoGerado.bncc) ||
        `Filtros aplicados: ${filtrosUsados?.etapa} - ${filtrosUsados?.ano}`,
      metodologia: extrairTextoLimpo(planoGerado.metodologia),
      duracao: extrairTextoLimpo(planoGerado.duracao),
      recursos: Array.isArray(planoGerado.recursos) ? planoGerado.recursos : [],
      experiencia: extrairTextoLimpo(planoGerado.relato_experiencia),
      resultados: extrairTextoLimpo(planoGerado.resultados),
    }

    navigate("/dashboard/catalogar/manual", {
      state: { initialData: catalogedData },
    })
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
            {/* --- ESQUERDA: Formulário Guiado (UX Intuitiva) --- */}
            <div className="lg:col-span-6 flex flex-col">
              {/* Bloco Conversacional de Filtros */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
                {/* Passo 1 */}
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
                  <input
                    type="text"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    placeholder="Qual o ano/série? (Ex: 6º Ano)"
                    className="w-full sm:w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none dark:text-white"
                  />
                </div>

                {/* Passo 2 */}
                <div>
                  <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <BookA
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    2. Qual é a disciplina?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {opcoesDisciplina.map((op) => (
                      <button
                        key={op.id}
                        onClick={() =>
                          setMateria(materia === op.id ? "" : op.id)
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                          materia === op.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <label className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <Bot
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
                3. O que você quer ensinar hoje?
              </label>
              <textarea
                value={promptTexto}
                onChange={(e) => setPromptTexto(e.target.value)}
                placeholder="Ex: Quero dar uma aula sobre a Revolução Industrial com foco no impacto social..."
                rows="6"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base focus:border-purple-600 dark:focus:border-purple-400 outline-none transition-all dark:text-white placeholder-slate-400 font-sans leading-relaxed resize-y shadow-inner"
              />

              <button
                onClick={handleProcessAI}
                disabled={loading}
                className={`relative mt-6 w-full h-[56px] rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden border-none cursor-pointer ${
                  loading
                    ? "bg-purple-200 dark:bg-purple-900/50"
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

            {/* --- DIREITA: Plano Gerado --- */}
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
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {/* Tags de Identificação */}
                    {filtrosUsados && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
                          {filtrosUsados.etapa.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">
                          {filtrosUsados.materia.toUpperCase()}
                        </span>
                        {filtrosUsados.ano && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200">
                            {filtrosUsados.ano}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h4 className="font-black text-lg text-slate-800 dark:text-white mb-3">
                        {planoGerado.titulo}
                      </h4>
                      <p className="m-0 text-slate-700 dark:text-slate-300 text-base whitespace-pre-line leading-relaxed">
                        {planoGerado.relato_experiencia}
                      </p>

                      {planoGerado.recursos &&
                        planoGerado.recursos.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-2">
                              Recursos Sugeridos:
                            </strong>
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
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <BookOpen
                      size={56}
                      className={`mb-4 opacity-30 ${loading ? "animate-bounce text-purple-500" : ""}`}
                    />
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
