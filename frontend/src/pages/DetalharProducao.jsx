import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom"
import {
  ArrowLeft, Calendar, Clock, Bot, BookOpen, CheckCircle2,
  AlertCircle, Wrench, Lightbulb, Target, Download, FileText,
  User, Bookmark, ShieldCheck, Package, Cpu, Terminal,
  Star, BarChart3, ThumbsUp, AlertTriangle, ExternalLink, Link2
} from "lucide-react"

const DetalharProducao = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const location = useLocation()
  const fromHistory = location.state?.fromHistory || false
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleDownload = async () => {
    if (!data || !data.arquivo) return
    try {
      const urlRelativa = data.arquivo.replace("https://teia.cic.unb.br/kipo_playground/", "")
      const response = await api.get(urlRelativa, { responseType: "blob" })
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = urlBlob
      link.setAttribute("download", `producao-${data.id}.pdf`)
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
        setData(response.data)
      } catch (error) {
        alert("Erro ao carregar a produção.")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetails()
  }, [id, navigate])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold">Carregando detalhes...</div>
    </div>
  )
  if (!data) return null

  const statusLower = data.status ? data.status.toLowerCase() : ""
  const isRejected = statusLower.includes("rejeitado") || statusLower.includes("correção")
  const isApproved = statusLower.includes("aprovado") || statusLower.includes("publicado")
  const isPending = !isApproved && !isRejected
  const podeVerParecer = data.is_admin || (data.is_revisor && fromHistory)

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1200px] mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {isMobile && (
            <div className="w-full mb-2">
              <SidebarContent data={data} isApproved={isApproved} isRejected={isRejected} isPending={isPending} handleDownload={handleDownload} />
            </div>
          )}

          <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
            
            <div className="mb-8">
              <div className="flex gap-2 mb-3">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">{data.disciplina}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">{data.nivel_ensino || data.nivel}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">{data.titulo}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Bot size={16}/> {data.modelo_ia || "Nenhum modelo"}</div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Calendar size={16}/> {data.data}</div>
              </div>
            </div>

            {data.producao_base && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl mb-8 flex items-center gap-4">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                  <Bookmark size={20} className="text-[#1565C0] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#1565C0] dark:text-blue-400 uppercase tracking-widest mb-0.5">Inspirada Em</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    <a href={`/dashboard/producao/${data.producao_base.id}`} className="hover:underline flex items-center gap-1 text-[#1565C0] dark:text-blue-400">
                      {data.producao_base.titulo} <Link2 size={14}/>
                    </a>
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5 mb-10 border-y border-slate-100 dark:border-slate-800 py-8">
              <div className="flex items-start gap-4">
                <Wrench size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Metodologia</h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.metodologia || "Não informado."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Duração Estimada</h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.duracao || "Não informado."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Package size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Recursos Necessários</h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{Array.isArray(data.recursos) ? data.recursos.join(", ") : data.recursos || "Nenhum recurso específico."}</p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#1565C0] dark:text-blue-400 mb-4"><BookOpen size={20} /> Alinhamento BNCC</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-[#1565C0] dark:border-blue-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{data.bncc || "Não informado."}</p>
                </div>
              </div>

              {data.bncc_computacao && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mb-4"><Cpu size={20} /> BNCC Computação</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{data.bncc_computacao}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-700 dark:text-slate-400 mb-4"><Terminal size={20} /> Prompts na IA</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 p-5 rounded-r-xl font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {data.prompts_ia || "Nenhum prompt registrado."}
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-amber-600 dark:text-amber-500 mb-4"><Lightbulb size={20} /> Relato de Experiência</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">{data.experiencia || data.relato || "Não informado."}</p>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald-600 dark:text-emerald-500 mb-4"><Target size={20} /> Resultados</h3>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                  <p className="text-emerald-800 dark:text-emerald-300 italic text-sm whitespace-pre-wrap">{data.resultados || "Sem resultados registrados."}</p>
                </div>
              </div>
            </div>

            {podeVerParecer && <ParecerTecnico producao={data} />}

          </div>

          {!isMobile && (
            <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24">
              <SidebarContent data={data} isApproved={isApproved} isRejected={isRejected} isPending={isPending} handleDownload={handleDownload} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const SidebarContent = ({ data, isApproved, isRejected, isPending, handleDownload }) => {
  const isAnonimo = data.anonimo !== false;
  const initial = isAnonimo ? "A" : (data.autor ? data.autor.charAt(0).toUpperCase() : "U");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      
      <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Autor(a)</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
             {data.autor}
          </p>
        </div>
      </div>

      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Status do Material</h3>
      
      {isApproved && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-start gap-3 mb-6">
          <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={24} />
          <div>
            <span className="block font-black text-emerald-700 dark:text-emerald-400 mb-1">APROVADO</span>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70 leading-relaxed">Validado pela comunidade.</p>
          </div>
        </div>
      )}
      
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3 mb-6">
          <Clock className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={24} />
          <div><span className="block font-black text-amber-700 dark:text-amber-400 mb-1">EM ANÁLISE</span></div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={24} />
          <div><span className="block font-black text-red-700 dark:text-red-400 mb-1">AJUSTES NECESSÁRIOS</span></div>
        </div>
      )}

      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Arquivos e Links</h3>
      
      <div className="flex flex-col gap-3">
        {data.arquivo && (
          <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20">
            <Download size={18} /> Baixar Roteiro
          </button>
        )}

        {data.link_material && (
          <a href={data.link_material} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-purple-500/20">
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
  );
}

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

export default DetalharProducao