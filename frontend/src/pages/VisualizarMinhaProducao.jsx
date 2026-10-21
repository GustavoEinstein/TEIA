import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bot,
  BookOpen,
  CheckCircle2,
  XCircle,
  Wrench,
  Lightbulb,
  Target,
  Download,
  FileText,
  User,
  Package,
  ExternalLink,
  Printer,
  Loader2,
  X,
  Tag,
  Sparkles,
  Link as LinkIcon,
  Edit3,
  AlertCircle,
} from "lucide-react"

const API_BASE_URL = "http://localhost:8000"

const VisualizarMinhaProducao = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  // Estados para o Modal de Exportação do PDF
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [docenteName, setDocenteName] = useState("")

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`api/production/${id}/`)
        setData(response.data)
        if (
          response.data.autor &&
          response.data.autor !== "Professor(a) Anônimo(a)"
        ) {
          setDocenteName(response.data.autor)
        } else {
          const storedName = localStorage.getItem("user_name") || ""
          if (storedName) setDocenteName(storedName)
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetails()
  }, [id])

  // Lógica de download do PDF com o nome do docente informado no Modal
  const handleConfirmExportPDF = async () => {
    if (!docenteName.trim()) {
      alert("Por favor, preencha o nome do(a) docente.")
      return
    }

    setDownloadingPDF(true)
    setIsModalOpen(false)

    try {
      const response = await api.get(
        `api/production/${id}/export-pdf/?docente=${encodeURIComponent(docenteName)}`,
        { responseType: "blob" },
      )

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `plano_de_aula_${id}_IFB.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Não foi possível gerar o Plano de Aula em PDF.")
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FE] dark:bg-slate-950">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-[#1565C0] dark:text-blue-400 font-bold text-sm">
          <Loader2 className="animate-spin" size={20} />
          Carregando detalhes da produção...
        </div>
      </div>
    )
  }

  if (!data) return null

  // Cálculo dos status da produção
  const statusLower = data.status ? data.status.toLowerCase() : ""
  const isApproved =
    statusLower.includes("aprovado") ||
    statusLower.includes("publicado") ||
    statusLower.includes("concluído")
  const isRejected =
    statusLower.includes("rejeitado") || statusLower.includes("correção")
  const isDraft = statusLower.includes("rascunho")
  const isPending = !isApproved && !isRejected && !isDraft

  const recursosFormatados = Array.isArray(data.recursos)
    ? data.recursos.filter(Boolean).join(", ")
    : data.recursos || "Não informado"

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] dark:bg-slate-950 transition-colors duration-200 py-6 px-4 md:px-8 pb-20">
      <div className="max-w-[1240px] mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-solid border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl font-bold text-sm mb-6 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Layout Principal em 2 Colunas */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ================= COLUNA PRINCIPAL DA ESQUERDA ================= */}
          <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-solid border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.05)] overflow-hidden">
            {/* Barra superior institucional */}
            <div className="h-2 w-full bg-gradient-to-r from-[#1565C0] via-blue-500 to-indigo-600" />

            <div className="p-6 md:p-9">
              {/* Cabeçalho do Material */}
              <div className="pb-6 mb-7 border-b border-solid border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 mb-3.5">
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-400 border border-solid border-blue-200/80 dark:border-blue-800/60 px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
                    {data.disciplina || "Geral"}
                  </span>

                  {(data.nivel_ensino || data.nivel) && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-solid border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-[11px] font-bold">
                      {data.nivel_ensino || data.nivel}
                    </span>
                  )}

                  {data.categoria && (
                    <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-solid border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                      <Tag size={12} /> {data.categoria}
                    </span>
                  )}

                  {data.producao_base && (
                    <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                      <LinkIcon size={12} /> Releitura
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-[28px] font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight mb-4 break-words m-0">
                  {data.titulo}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-solid border-slate-200/80 dark:border-slate-700">
                    <Bot
                      size={15}
                      className="text-[#1565C0] dark:text-blue-400"
                    />
                    <span>{data.modelo_ia || "IA não informada"}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-solid border-slate-200/60 dark:border-slate-800">
                    <User size={14} className="text-slate-400" />
                    <span>
                      Autor:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {data.autor || "Você"}
                      </strong>
                    </span>
                  </div>

                  {data.data && (
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-solid border-slate-200/60 dark:border-slate-800">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{data.data}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ficha Técnica (Metodologia, Duração, Recursos) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-[#F8FAFC] dark:bg-slate-950/60 rounded-2xl border border-solid border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-solid border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-solid border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                    <Wrench
                      size={18}
                      className="text-[#1565C0] dark:text-blue-400"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      Metodologia
                    </span>
                    <span className="text-xs md:text-[13px] font-bold text-slate-800 dark:text-slate-200 break-words leading-snug block">
                      {data.metodologia || "Não informada"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-solid border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-solid border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                    <Clock
                      size={18}
                      className="text-[#1565C0] dark:text-blue-400"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      Duração
                    </span>
                    <span className="text-xs md:text-[13px] font-bold text-slate-800 dark:text-slate-200 break-words leading-snug block">
                      {data.duracao || "Não informada"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-solid border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-solid border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                    <Package
                      size={18}
                      className="text-[#1565C0] dark:text-blue-400"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                      Recursos
                    </span>
                    <span className="text-xs md:text-[13px] font-bold text-slate-800 dark:text-slate-200 break-words leading-snug block">
                      {recursosFormatados}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 1: Intencionalidade Pedagógica (BNCC) */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white mb-3 m-0">
                  <BookOpen
                    size={19}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  Intencionalidade (BNCC)
                </h3>
                <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-solid border-amber-200/80 dark:border-amber-800/50 border-l-4 border-l-amber-500 p-5 rounded-xl">
                  <p className="text-sm md:text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap m-0 font-medium">
                    {data.bncc || "Não informado."}
                  </p>
                  {data.bncc_computacao && (
                    <div className="mt-4 pt-3 border-t border-solid border-amber-200/60 dark:border-amber-800/40">
                      <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                        BNCC Computação:
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap m-0">
                        {data.bncc_computacao}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompts de IA (exibido caso tenha sido preenchido) */}
              {data.prompts_ia && (
                <div className="mb-8">
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white mb-3 m-0">
                    <Sparkles
                      size={19}
                      className="text-[#1565C0] dark:text-blue-400"
                    />
                    Prompts Utilizados na IA
                  </h3>
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-solid border-blue-200/70 dark:border-blue-800/50 p-5 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap m-0">
                      {data.prompts_ia}
                    </p>
                  </div>
                </div>
              )}

              {/* Seção 2: Relato de Experiência */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white mb-3 m-0">
                  <Lightbulb
                    size={19}
                    className="text-[#1565C0] dark:text-blue-400"
                  />
                  Relato de Experiência
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-solid border-slate-200/80 dark:border-slate-800 p-5 rounded-xl">
                  <p className="text-sm md:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap m-0">
                    {data.experiencia || data.relato || "Não informado."}
                  </p>
                </div>
              </div>

              {/* Seção 3: Resultados */}
              <div>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white mb-3 m-0">
                  <Target
                    size={19}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  Resultados
                </h3>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-solid border-emerald-200 dark:border-emerald-800/60 border-l-4 border-l-emerald-500 p-5 rounded-xl">
                  <p className="text-sm md:text-[15px] text-slate-800 dark:text-slate-200 italic leading-relaxed whitespace-pre-wrap m-0">
                    {data.resultados || "Sem resultados registrados."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUNA DA DIREITA (SIDEBAR) ================= */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
            {/* CARD 1: Status da Avaliação */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-solid border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-5">
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pb-3 border-b border-solid border-slate-100 dark:border-slate-800 m-0">
                Status da Avaliação
              </h3>

              {isPending && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-solid border-amber-200 dark:border-amber-800/60 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm mb-1.5">
                    <Clock size={18} className="shrink-0" />
                    <span>AGUARDANDO VALIDAÇÃO</span>
                  </div>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 m-0 leading-relaxed font-medium">
                    Sua prática está na fila e será avaliada por colegas no
                    sistema duplo-cego.
                  </p>
                </div>
              )}

              {isApproved && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-solid border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm mb-1.5">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>PUBLICADA!</span>
                  </div>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 m-0 leading-relaxed font-medium">
                    Prática validada por pares e disponível na Central da
                    Comunidade.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-solid border-red-200 dark:border-red-800/60 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-black text-sm mb-1.5">
                    <XCircle size={18} className="shrink-0" />
                    <span>AJUSTES NECESSÁRIOS</span>
                  </div>
                  <p className="text-xs text-red-800/80 dark:text-red-300/80 m-0 leading-relaxed font-medium mb-3">
                    Sua prática precisa de correções antes de ser publicada.
                  </p>
                  <button
                    onClick={() =>
                      navigate(`/dashboard/editar-producao/${data.id}`)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border-none cursor-pointer shadow-xs"
                  >
                    <Wrench size={14} /> Editar e Reenviar
                  </button>
                </div>
              )}

              {isDraft && (
                <div className="bg-slate-100 dark:bg-slate-800 border border-solid border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-black text-sm mb-1.5">
                    <Edit3 size={18} className="shrink-0" />
                    <span>RASCUNHO SALVO</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 m-0 leading-relaxed mb-3">
                    Este material ainda é um rascunho privado.
                  </p>
                  <button
                    onClick={() =>
                      navigate(`/dashboard/editar-producao/${data.id}`)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 py-2.5 px-4 rounded-lg text-xs font-extrabold transition-all border-none cursor-pointer"
                  >
                    <Edit3 size={14} /> Continuar Editando
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: Exportação de Plano de Aula em PDF (IFB / MEC) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-solid border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-5">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pb-3 border-b border-solid border-slate-100 dark:border-slate-800 m-0">
                <Printer
                  size={15}
                  className="text-[#1b5e20] dark:text-emerald-400"
                />
                Plano de Aula (IFB / MEC)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 m-0">
                Gere o documento oficial padronizado no formato de Plano de Aula
                para registro pedagógico.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={downloadingPDF}
                className={`w-full flex items-center justify-center gap-2 bg-[#1b5e20] hover:bg-[#144718] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-900/15 border-none ${
                  downloadingPDF
                    ? "opacity-70 cursor-not-allowed"
                    : "cursor-pointer hover:-translate-y-0.5"
                }`}
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Gerando
                    PDF...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Baixar Plano de Aula (PDF)
                  </>
                )}
              </button>
            </div>

            {/* CARD 3: Material de Apoio (Arquivo Anexo e Link Externo) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-solid border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-5">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pb-3 border-b border-solid border-slate-100 dark:border-slate-800 m-0">
                <FileText
                  size={15}
                  className="text-[#1565C0] dark:text-blue-400"
                />
                Material de Apoio
              </h3>

              {data.arquivo || data.link_material ? (
                <div className="flex flex-col gap-3">
                  {data.arquivo && (
                    <a
                      href={
                        data.arquivo.startsWith("http")
                          ? data.arquivo
                          : `${API_BASE_URL}${data.arquivo}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/15 no-underline hover:-translate-y-0.5 box-border"
                    >
                      <Download size={18} /> Baixar Arquivo Anexo
                    </a>
                  )}

                  {data.link_material && (
                    <a
                      href={data.link_material}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-solid border-slate-200 dark:border-slate-700 py-3 px-4 rounded-xl font-bold text-sm transition-all no-underline box-border"
                    >
                      <ExternalLink size={18} /> Acessar Link Externo
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400 dark:text-slate-500 m-0 font-medium">
                    Nenhum arquivo anexo ou link externo enviado nesta prática.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL SOLICITANDO O NOME DO DOCENTE ================= */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-[440px] rounded-2xl shadow-2xl border border-solid border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-solid border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Printer
                  size={18}
                  className="text-[#1b5e20] dark:text-emerald-400"
                />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base m-0">
                  Exportar Plano de Aula
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Nome do(a) Docente / Professor(a):
              </label>
              <input
                type="text"
                value={docenteName}
                onChange={(e) => setDocenteName(e.target.value)}
                placeholder="Ex: Prof. Gustavo"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-solid border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-[#1b5e20] dark:focus:border-emerald-500 outline-none transition-all box-border"
                autoFocus
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-0 leading-relaxed">
                Este nome será inserido diretamente no cabeçalho do documento
                oficial de Plano de Aula (IFB / MEC).
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-solid border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-solid border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExportPDF}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1b5e20] hover:bg-[#144718] text-white border-none shadow-md cursor-pointer transition-colors"
              >
                Confirmar e Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisualizarMinhaProducao
