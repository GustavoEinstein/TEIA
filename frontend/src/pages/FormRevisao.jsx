import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useOutletContext, useParams, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import {
  Star, CheckCircle2, Bot, Download, ArrowLeft, Clock,
  Wrench, BookOpen, Target, Lightbulb, ThumbsUp, ShieldAlert,
  FileText, User, AlertTriangle, Lock, PenTool, Eye,
  Cpu, Terminal, Link, ExternalLink, Package, BarChart3
} from "lucide-react"

const Revisao = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false

  const [producaoEmRevisao, setProducaoEmRevisao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [avaliacao, setAvaliacao] = useState({
    notaCoerencia: 0,
    notaQualidade: 0,
    notaMetodologia: 0,
    notaAvaliacao: 0,
    notaInclusao: 0,
    notaInovacao: 0,
    pontosFortes: "",
    pontosMelhoria: "",
  })

  const scores = [
    avaliacao.notaCoerencia,
    avaliacao.notaQualidade,
    avaliacao.notaMetodologia,
    avaliacao.notaAvaliacao,
    avaliacao.notaInclusao,
    avaliacao.notaInovacao,
  ]
  const isFormComplete = scores.every((s) => s > 0)
  const hasCriticalFail = scores.some((s) => s > 0 && s <= 2)

  const handleDownload = async () => {
    if (!producaoEmRevisao || !producaoEmRevisao.arquivo) return
    try {
      const urlRelativa = producaoEmRevisao.arquivo.replace("https://teia.cic.unb.br/kipo_playground/", "")
      const response = await api.get(urlRelativa, { responseType: "blob" })
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = urlBlob
      link.setAttribute("download", `producao-${producaoEmRevisao.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (error) {
      console.error("Erro no download:", error)
    }
  }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`api/production/${id}/`)
        setProducaoEmRevisao(response.data)
      } catch (error) {
        Swal.fire("Erro", "Não foi possível carregar os detalhes.", "error")
        navigate("/dashboard/revisao")
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [id, navigate])

  const handleScoreChange = (campo, valor) => setAvaliacao((prev) => ({ ...prev, [campo]: valor }))

  const handleSubmit = async (veredito) => {
    if (!isFormComplete) return
    if (veredito === false && !avaliacao.pontosMelhoria.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Para rejeitar a prática, é OBRIGATÓRIO preencher as Sugestões de Melhoria para orientar o colega.",
        confirmButtonColor: "#F57C00",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await api.post(`api/production/${id}/review/`, {
        aprovado: veredito,
        pontos_fortes: avaliacao.pontosFortes,
        pontos_melhoria: avaliacao.pontosMelhoria,
        nota_coerencia: avaliacao.notaCoerencia,
        nota_qualidade: avaliacao.notaQualidade,
        nota_metodologia: avaliacao.notaMetodologia,
        nota_avaliacao: avaliacao.notaAvaliacao,
        nota_inclusao: avaliacao.notaInclusao,
        nota_inovacao: avaliacao.notaInovacao,
      })

      window.dispatchEvent(new Event("perfilAtualizado"))

      if (veredito) {
        const currentApprovals = producaoEmRevisao.total_aprovacoes || 0
        if (currentApprovals === 0) {
          Swal.fire({
            icon: "info",
            title: "Avaliação Registrada! (1/2)",
            html: "Sua aprovação foi salva com sucesso!<br><br>Como o sistema exige a revisão em <b>duplo-cego</b>, outro colega precisará aprovar para publicação.",
            confirmButtonColor: "#1565C0",
            confirmButtonText: "Continuar revisando",
          }).then(() => navigate("/dashboard/revisao"))
        } else {
          Swal.fire({
            icon: "success",
            title: "Prática Publicada! (2/2)",
            html: "Excelente! Você foi o <b>segundo revisor</b> a aprovar este material.<br><br>A prática acaba de ser <b>publicada no Fórum Público</b>!",
            confirmButtonColor: "#2E7D32",
            confirmButtonText: "Que legal!",
          }).then(() => navigate("/dashboard/revisao"))
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Devolvido para Correção",
          text: "A prática foi devolvida ao autor com as suas sugestões de melhoria.",
          confirmButtonColor: "#C62828",
        }).then(() => navigate("/dashboard/revisao"))
      }
    } catch (error) {
      Swal.fire("Erro", "Ocorreu um problema ao salvar sua revisão.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold flex items-center gap-2">
        <Clock className="animate-spin" size={24} /> Carregando área de revisão...
      </div>
    </div>
  )
  if (!producaoEmRevisao) return null

  const CriteriaCard = ({ label, description, fieldName, value }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-colors hover:border-[#1565C0]/30 dark:hover:border-blue-500/30">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight pr-2">{label}</span>
        <span className={`text-sm font-black ${value > 0 ? (value <= 2 ? 'text-red-500' : 'text-emerald-500') : 'text-slate-400'}`}>
          {value > 0 ? value : "-"}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex-1">{description}</p>
      <div className="flex justify-center gap-1 mt-auto">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => handleScoreChange(fieldName, star)} className="p-0.5 hover:scale-110 transition-transform">
            <Star size={22} className={star <= value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-600"} />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button onClick={() => navigate("/dashboard/revisao")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors">
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="text-left sm:text-right">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sala de Revisão</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Analise o conteúdo abaixo e preencha a avaliação no final.</p>
          </div>
        </div>

        {/* MATERIAL A SER REVISADO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 mb-10">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">{producaoEmRevisao.disciplina}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">{producaoEmRevisao.nivel}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">{producaoEmRevisao.titulo}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Bot size={16}/> {producaoEmRevisao.modelo_ia || "Nenhum modelo"}</div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><User size={16}/> Autor(a) Anônimo(a)</div>
              </div>
            </div>

            {/* Ações Rápidas (Arquivos) */}
            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
              {producaoEmRevisao.arquivo && (
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-blue-500/20">
                  <Download size={18} /> Baixar Roteiro
                </button>
              )}
              {producaoEmRevisao.link_material && (
                <a href={producaoEmRevisao.link_material} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-purple-500/20">
                  <ExternalLink size={18} /> Acessar Link
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex gap-3">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm shrink-0 h-fit"><Wrench size={18} className="text-[#1565C0] dark:text-blue-400"/></div>
              <div><span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Metodologia</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{producaoEmRevisao.metodologia || "-"}</span></div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm shrink-0 h-fit"><Clock size={18} className="text-[#1565C0] dark:text-blue-400"/></div>
              <div><span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Duração</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{producaoEmRevisao.duracao || "-"}</span></div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm shrink-0 h-fit"><Package size={18} className="text-[#1565C0] dark:text-blue-400"/></div>
              <div><span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Recursos</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{Array.isArray(producaoEmRevisao.recursos) ? producaoEmRevisao.recursos.join(", ") : producaoEmRevisao.recursos || "-"}</span></div>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#1565C0] dark:text-blue-400 mb-4"><BookOpen size={20} /> Alinhamento BNCC</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-[#1565C0] dark:border-blue-500 p-5 rounded-r-xl">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{producaoEmRevisao.bncc || "Não informado."}</p>
              </div>
            </div>

            {producaoEmRevisao.bncc_computacao && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mb-4"><Cpu size={20} /> BNCC Computação</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{producaoEmRevisao.bncc_computacao}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-700 dark:text-slate-400 mb-4"><Terminal size={20} /> Prompts na IA</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 p-5 rounded-r-xl font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {producaoEmRevisao.prompts_ia || "Nenhum prompt registrado."}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-amber-600 dark:text-amber-500 mb-4"><Lightbulb size={20} /> Relato de Experiência</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">{producaoEmRevisao.experiencia || producaoEmRevisao.relato || "Não informado."}</p>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald-600 dark:text-emerald-500 mb-4"><Target size={20} /> Resultados</h3>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                <p className="text-emerald-800 dark:text-emerald-300 italic text-sm whitespace-pre-wrap">{producaoEmRevisao.resultados || "Sem resultados registrados."}</p>
              </div>
            </div>
          </div>

          <ParecerTecnico producao={producaoEmRevisao} />
        </div>

        {/* --- DIVISOR: ÁREA DE AVALIAÇÃO --- */}
        <div className="flex items-center gap-4 my-12 opacity-80">
          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <PenTool size={16}/> Área de Avaliação
          </div>
          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
        </div>

        {/* FORMULÁRIO DE AVALIAÇÃO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-[#1565C0]/5 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-10">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8">Sua Avaliação</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            <CriteriaCard label="Coerência Pedagógica" description="Objetivos claros e alinhados à BNCC?" fieldName="notaCoerencia" value={avaliacao.notaCoerencia} />
            <CriteriaCard label="Qualidade do Prompt" description="O uso da IA foi intencional e bem estruturado?" fieldName="notaQualidade" value={avaliacao.notaQualidade} />
            <CriteriaCard label="Metodologia Ativa" description="O aluno atuou como protagonista?" fieldName="notaMetodologia" value={avaliacao.notaMetodologia} />
            <CriteriaCard label="Critérios de Avaliação" description="Existem formas claras de verificar o aprendizado?" fieldName="notaAvaliacao" value={avaliacao.notaAvaliacao} />
            <CriteriaCard label="Inclusão" description="A prática é acessível a todos os alunos?" fieldName="notaInclusao" value={avaliacao.notaInclusao} />
            <CriteriaCard label="Inovação e Criatividade" description="Apresenta ideias originais para a disciplina?" fieldName="notaInovacao" value={avaliacao.notaInovacao} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-5 rounded-r-xl">
              <label className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">
                <ThumbsUp size={16} /> Pontos Fortes
              </label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none transition-all dark:text-emerald-100 placeholder-emerald-700/50 dark:placeholder-emerald-400/50 resize-y min-h-[100px]"
                placeholder="O que se destacou positivamente nesta prática?"
                value={avaliacao.pontosFortes}
                onChange={(e) => setAvaliacao({ ...avaliacao, pontosFortes: e.target.value })}
              />
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-5 rounded-r-xl">
              <label className="flex items-center gap-2 text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-3">
                <AlertTriangle size={16} /> Sugestões de Melhoria
              </label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/50 rounded-xl p-4 text-sm focus:border-red-500 outline-none transition-all dark:text-red-100 placeholder-red-700/50 dark:placeholder-red-400/50 resize-y min-h-[100px]"
                placeholder="O que precisa ser ajustado antes da publicação?"
                value={avaliacao.pontosMelhoria}
                onChange={(e) => setAvaliacao({ ...avaliacao, pontosMelhoria: e.target.value })}
              />
            </div>
          </div>

          {/* BOTÕES DE ENVIO */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            {!isFormComplete ? (
              <button disabled className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed">
                <Lock size={18} /> Preencha todas as 6 notas (estrelas) para liberar a decisão
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-extrabold text-sm transition-all ${
                    hasCriticalFail 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20" 
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                  }`}
                >
                  <ShieldAlert size={20} /> REJEITAR
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || hasCriticalFail}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-extrabold text-sm transition-all ${
                    !hasCriticalFail 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" 
                    : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600/50 dark:text-emerald-400/50 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={20} /> APROVAR
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// COMPONENTES AUXILIARES DA REVISÃO
// -------------------------------------------------------------

const ParecerTecnico = ({ producao }) => {
  if (!producao || !producao.avaliacoes_detalhadas || producao.avaliacoes_detalhadas.length === 0) return null
  const avaliacoes = producao.avaliacoes_detalhadas

  return (
    <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={24} className="text-[#1565C0] dark:text-blue-400" />
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Histórico de Revisão</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detalhamento dos avaliadores sobre esta prática.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        {avaliacoes.map((aval) => <ReviewCard key={aval.ordem} avaliacao={aval} />)}
        {producao.total_avaliacoes === 1 && (producao.is_dono || producao.is_admin) && !producao.status.toLowerCase().includes("rejeitado") && (
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
            <Clock size={24} className="mx-auto text-slate-400 mb-3" />
            <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-1">Aguardando 2º Avaliador</h4>
            <p className="text-sm text-slate-500">Aguardando o parecer de mais um colega para finalização.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ReviewCard = ({ avaliacao }) => {
  const isAprovado = avaliacao.aprovado
  const { notas, pontos_fortes, pontos_melhoria, ordem } = avaliacao
  
  return (
    <div className={`rounded-xl border overflow-hidden ${isAprovado ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800/50'}`}>
      <div className={`px-6 py-4 flex justify-between items-center ${isAprovado ? 'bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50'}`}>
        <div className={`flex items-center gap-2 font-black text-sm ${isAprovado ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
          {isAprovado ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>PARECER DO {ordem}º AVALIADOR</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${isAprovado ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'}`}>
          {isAprovado ? "APROVADO" : "AJUSTES"}
        </div>
      </div>
      
      <div className="p-6">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 size={16}/> Notas Atribuídas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ScoreItem label="Coerência Pedagógica" valor={notas.coerencia} />
          <ScoreItem label="Qualidade do Prompt" valor={notas.qualidade} />
          <ScoreItem label="Metodologia Ativa" valor={notas.metodologia} />
          <ScoreItem label="Critérios de Avaliação" valor={notas.avaliacao} />
          <ScoreItem label="Inclusão" valor={notas.inclusao} />
          <ScoreItem label="Inovação" valor={notas.inovacao} />
        </div>
        
        <hr className="border-slate-100 dark:border-slate-800 mb-6" />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16}/> Comentários do Revisor</h4>
        
        <div className="flex flex-col gap-4">
          {pontos_fortes && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2"><ThumbsUp size={16}/> Pontos Fortes</div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{pontos_fortes}</p>
            </div>
          )}
          {pontos_melhoria && (
            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-2"><AlertTriangle size={16}/> Melhorias</div>
              <p className="text-sm text-red-800 dark:text-red-300">{pontos_melhoria}</p>
            </div>
          )}
          {!pontos_fortes && !pontos_melhoria && avaliacao.feedback_texto && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 p-4 rounded-r-lg">
              <p className="text-sm text-slate-600 dark:text-slate-300">{avaliacao.feedback_texto}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ScoreItem = ({ label, valor }) => (
  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={14} className={star <= valor ? (valor <= 2 ? "fill-red-500 text-red-500" : "fill-amber-400 text-amber-400") : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"} />
        ))}
      </div>
      <span className={`text-xs font-black ${valor <= 2 ? 'text-red-600' : 'text-emerald-600'}`}>{valor}/5</span>
    </div>
  </div>
)

export default Revisao