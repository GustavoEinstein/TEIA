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
  ShieldCheck,
  Cpu,
  Terminal,
  Link2,
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
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
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
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1200px] mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        {/* Layout Principal em 2 Colunas */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ================= COLUNA PRINCIPAL DA ESQUERDA ================= */}
          <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
            {/* Cabeçalho do Material */}
            <div className="mb-8">
              <div className="flex gap-2 mb-3">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  {data.disciplina || "Geral"}
                </span>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
                  {data.nivel_ensino || data.nivel}
                </span>
                {data.categoria && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {data.categoria}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                {data.titulo}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Bot
                    size={16}
                    className="text-[#1565C0] dark:text-blue-400"
                  />{" "}
                  {data.modelo_ia || "Nenhum modelo"}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar size={16} /> {data.data}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <User size={16} /> Autor: Você
                </div>
              </div>
            </div>

            {/* Inspirada Em (Releitura) */}
            {data.producao_base && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl mb-8 flex items-center gap-4">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                  <Bookmark
                    size={20}
                    className="text-[#1565C0] dark:text-blue-400"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#1565C0] dark:text-blue-400 uppercase tracking-widest mb-0.5">
                    Inspirada Em
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    <a
                      href={`/dashboard/producao/${data.producao_base.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1 text-[#1565C0] dark:text-blue-400"
                    >
                      {data.producao_base.titulo} <Link2 size={14} />
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Ficha Técnica vertical limpa (Igual ao detalhar produção público) */}
            <div className="flex flex-col gap-5 mb-10 border-y border-slate-100 dark:border-slate-800 py-8">
              <div className="flex items-start gap-4">
                <Wrench size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                    Metodologia
                  </h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {data.metodologia || "Não informado."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                    Duração Estimada
                  </h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {data.duracao || "Não informado."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Package size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                    Recursos Necessários
                  </h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {recursosFormatados}
                  </p>
                </div>
              </div>
            </div>

            {/* Seções de Texto */}
            <div className="space-y-10">
              {/* BNCC */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#1565C0] dark:text-blue-400 mb-4">
                  <BookOpen size={20} /> Intencionalidade (BNCC)
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-[#1565C0] dark:border-blue-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm m-0">
                    {data.bncc || "Não informado."}
                  </p>
                </div>
              </div>

              {/* Computação */}
              {data.bncc_computacao && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
                    <Cpu size={20} /> BNCC Computação
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm m-0">
                      {data.bncc_computacao}
                    </p>
                  </div>
                </div>
              )}

              {/* Prompts */}
              {data.prompts_ia && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-700 dark:text-slate-400 mb-4">
                    <Terminal size={20} /> Prompts na IA
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 p-5 rounded-r-xl font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap m-0">
                    {data.prompts_ia}
                  </div>
                </div>
              )}

              {/* Relato */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-amber-600 dark:text-amber-500 mb-4">
                  <Lightbulb size={20} /> Relato de Experiência
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px] m-0">
                    {data.experiencia || data.relato || "Não informado."}
                  </p>
                </div>
              </div>

              {/* Resultados */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald-600 dark:text-emerald-500 mb-4">
                  <Target size={20} /> Resultados
                </h3>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                  <p className="text-emerald-800 dark:text-emerald-300 italic text-sm whitespace-pre-wrap m-0">
                    {data.resultados || "Sem resultados registrados."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUNA DA DIREITA (SIDEBAR) ================= */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
            {/* CARD 1: Status da Avaliação */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                Status da Produção
              </h3>

              {isApproved && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-start gap-3">
                  <ShieldCheck
                    className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    size={24}
                  />
                  <div>
                    <span className="block font-black text-emerald-700 dark:text-emerald-400 mb-1">
                      APROVADO
                    </span>
                    <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70 leading-relaxed m-0">
                      Sua prática foi validada e está pública na comunidade.
                    </p>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
                  <Clock
                    className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                    size={24}
                  />
                  <div>
                    <span className="block font-black text-amber-700 dark:text-amber-400 mb-1">
                      EM ANÁLISE
                    </span>
                    <p className="text-xs text-amber-800/70 dark:text-amber-300/70 leading-relaxed m-0">
                      Aguardando a validação dos colegas pelo sistema
                      duplo-cego.
                    </p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle
                      className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                      size={24}
                    />
                    <div>
                      <span className="block font-black text-red-700 dark:text-red-400 mb-1">
                        AJUSTES NECESSÁRIOS
                      </span>
                      <p className="text-xs text-red-800/70 dark:text-red-300/70 leading-relaxed m-0">
                        Sua prática precisa de correções baseadas no feedback do
                        revisor.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/dashboard/editar-producao/${data.id}`)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border-none cursor-pointer shadow-sm"
                  >
                    <Wrench size={14} /> Editar e Reenviar
                  </button>
                </div>
              )}

              {isDraft && (
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <Edit3
                      className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5"
                      size={24}
                    />
                    <div>
                      <span className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                        RASCUNHO SALVO
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                        Este material ainda é um rascunho privado.
                      </p>
                    </div>
                  </div>
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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Printer size={16} /> Plano de Aula (OFICIAL)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 m-0">
                Gere o documento padronizado em PDF para o seu registro
                pedagógico escolar.
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
                    <Loader2 size={18} className="animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Gerar PDF Institucional
                  </>
                )}
              </button>
            </div>

            {/* CARD 3: Material de Apoio */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                Material Anexo
              </h3>

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
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md shadow-purple-500/15 no-underline hover:-translate-y-0.5 box-border"
                  >
                    <ExternalLink size={18} /> Acessar Link Externo
                  </a>
                )}

                {!data.arquivo && !data.link_material && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    Nenhum material anexado.
                  </p>
                )}
              </div>
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
