import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, Sparkles, CheckCircle2, Bot, Cpu, Check, FileText,
  BookOpen, Wrench, Clock, Package, Lightbulb, Target, Layers, Edit3
} from "lucide-react"
import api from "../../services/api"
import Swal from "sweetalert2"

const CatalogarAssistido = () => {
  const navigate = useNavigate()
  const [rawText, setRawText] = useState("")
  const [loading, setLoading] = useState(false)
  const [extractedData, setExtractedData] = useState(null)

  const handleProcessAI = async () => {
    if (!rawText.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Rascunho Vazio",
        text: "Por favor, cole ou digite as anotações da sua aula para análise.",
        confirmButtonColor: "#7B1FA2"
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post("api/production/auto-catalog-ai/", { raw_text: rawText })
      setExtractedData(response.data)

      Swal.fire({
        icon: "success",
        title: "Catalogação Concluída!",
        text: "Os campos foram identificados e estruturados segundo os padrões do formulário.",
        confirmButtonColor: "#7B1FA2"
      })
    } catch (error) {
      console.error("Erro ao catalogar via IA:", error)
      Swal.fire({
        icon: "error",
        title: "Erro no Processamento",
        text: "Não foi possível analisar o rascunho no momento. Tente novamente.",
        confirmButtonColor: "#7B1FA2"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToForm = () => {
    if (!extractedData) return
    navigate("/dashboard/catalogar/manual", { state: { initialData: extractedData } })
  }

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-purple-600 dark:focus:border-purple-400 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 mt-4"

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
              Preenchimento Assistido por IA
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-3xl leading-relaxed">
            Cole abaixo o rascunho, plano de aula ou relato livre da sua prática. O assistente de inteligência artificial analisará o texto e preencherá automaticamente os campos da ficha técnica e do detalhamento pedagógico.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* --- ESQUERDA: Entrada do Rascunho Bruto --- */}
            <div className="lg:col-span-5 flex flex-col">
              <h3 className="text-[15px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 mb-4 uppercase tracking-wide">
                <Bot size={18} /> Rascunho / Relato da Aula
              </h3>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Cole as anotações brutas da prática
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Exemplo: Apliquei uma atividade sobre dilemas éticos no uso de inteligência artificial para turmas do 9º ano. Usamos o ChatGPT para simular respostas e discutir os impactos sociais..."
                rows="14"
                className={`${inputClass} font-sans leading-relaxed resize-y`}
              />

              <button
                onClick={handleProcessAI}
                disabled={loading}
                className="mt-4 w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer border-none"
              >
                <Sparkles size={18} />
                {loading ? "Analisando com IA..." : "Analisar e Catalogar com IA"}
              </button>
            </div>

            {/* --- DIREITA: Campos Estruturados do Formulário Manual --- */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1565C0] dark:text-blue-400 flex items-center gap-2 mb-6 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-3">
                  <CheckCircle2 size={18} /> Pré-visualização dos Campos Identificados
                </h3>

                {extractedData ? (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    
                    {/* Bloco 1: Ficha Técnica */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <FileText size={14} /> Ficha Técnica
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-400 block mb-0.5">Título:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.titulo || "Não identificado"}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-400 block mb-0.5">Nível de Ensino:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.nivel || "Não identificado"}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-400 block mb-0.5">Categoria:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.categoria || "Não identificada"}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-400 block mb-0.5">Modelo de IA:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.modelo_ia || "Não informado"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Pedagógico */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <BookOpen size={14} /> Detalhamento Pedagógico
                      </h4>
                      <div className="space-y-3 text-xs">
                        {extractedData.bncc && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-[#1565C0] dark:text-blue-400 block mb-1">BNCC / Objetivos:</span>
                            <p className="m-0 text-slate-700 dark:text-slate-300 whitespace-pre-line">{extractedData.bncc}</p>
                          </div>
                        )}
                        {extractedData.bncc_computacao && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">BNCC Computação:</span>
                            <p className="m-0 text-slate-700 dark:text-slate-300 whitespace-pre-line">{extractedData.bncc_computacao}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-400 block mb-0.5">Metodologia:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.metodologia || "Não identificada"}</span>
                          </div>
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-400 block mb-0.5">Duração:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{extractedData.duracao || "Não informada"}</span>
                          </div>
                        </div>

                        {extractedData.recursos && extractedData.recursos.length > 0 && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-400 block mb-2">Recursos Mencionados:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(Array.isArray(extractedData.recursos) 
                                ? extractedData.recursos 
                                : String(extractedData.recursos).split(",")
                              ).map((rec, i) => (
                                <span key={i} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[11px] font-semibold border border-purple-200 dark:border-purple-800">
                                  {typeof rec === "string" ? rec.trim() : rec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {extractedData.experiencia && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-400 block mb-1">Relato da Experiência:</span>
                            <p className="m-0 text-slate-700 dark:text-slate-300 leading-relaxed">{extractedData.experiencia}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <Cpu size={48} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">Os campos estruturados aparecerão aqui assim que a IA processar o rascunho.</p>
                  </div>
                )}
              </div>

              {/* Botão de Redirecionamento */}
              {extractedData && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleApplyToForm}
                    className="w-full bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer border-none"
                  >
                    <Edit3 size={18} />
                    Aproveitar Dados e Editar no Formulário Completo
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default CatalogarAssistido