import React, { useState, useEffect } from "react"
import api from "./services/api";
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import Swal from "sweetalert2"
import {
  ArrowLeft, Save, UploadCloud, Lock, BookOpen, Wrench, Clock,
  Package, Lightbulb, Target, FileText, CheckCircle2, Layers,
  Plus, X, Loader2, Send, Link as LinkIcon, UserCheck, EyeOff
} from "lucide-react"

const EditarProducao = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useOutletContext() || { isMobile: false }

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customResource, setCustomResource] = useState("")

  const RECURSOS_COMUNS = [
    "Projetor / Datashow", "Internet / Wi-Fi", "Celulares (BYOD)", 
    "Laboratório de Informática", "Tablets", "Quadro Branco", 
    "IA Generativa", "Jogos", "Livro Didático",
  ]

  const [formData, setFormData] = useState({
    titulo: "", disciplina: "", nivel: "", modelo_ia: "", prompts_ia: "", categoria: "", 
    bncc: "", metodologia: "", duracao: "", recursos: [], experiencia: "", 
    resultados: "", arquivo: null, link_material: "", anonimo: true,
  })

  const [existingFile, setExistingFile] = useState(null)
  const [isDraftStatus, setIsDraftStatus] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`api/production/${id}/`)
        const d = response.data
        let recursosArray = []
        if (d.recursos && typeof d.recursos === "string") {
          recursosArray = d.recursos.split(",").map((r) => r.trim()).filter((r) => r !== "")
        } else if (Array.isArray(d.recursos)) {
          recursosArray = d.recursos
        }

        setIsDraftStatus(d.status === "Rascunho" || d.status === "Correção solicitada")

        setFormData({
          titulo: d.titulo || "", disciplina: d.disciplina || "", nivel: d.nivel || "",
          modelo_ia: d.modelo_ia || "", prompts_ia: d.prompts_ia || "", categoria: d.categoria || "",
          bncc: d.bncc || "", metodologia: d.metodologia || "", duracao: d.duracao || "",
          recursos: recursosArray, experiencia: d.experiencia || "", resultados: d.resultados || "",
          arquivo: null, link_material: d.link_material || "", anonimo: d.anonimo !== false,
        })

        if (d.arquivo) setExistingFile(d.arquivo)
      } catch (error) {
        Swal.fire("Erro", "Erro ao carregar dados da produção.", "error")
        navigate("/dashboard/minhas-producoes")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, navigate])

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleFileChange = (e) => setFormData((prev) => ({ ...prev, arquivo: e.target.files[0] }))

  const toggleRecurso = (recurso) => {
    setFormData((prev) => {
      const exists = prev.recursos.includes(recurso)
      return exists ? { ...prev, recursos: prev.recursos.filter((r) => r !== recurso) } : { ...prev, recursos: [...prev.recursos, recurso] }
    })
  }

  const addCustomResource = (e) => {
    if ((e.key === "Enter" || e.type === "click") && customResource.trim()) {
      e.preventDefault()
      if (!formData.recursos.includes(customResource.trim())) {
        setFormData((prev) => ({ ...prev, recursos: [...prev.recursos, customResource.trim()] }))
      }
      setCustomResource("")
    }
  }

  const handleToggleAutoria = () => {
    setFormData((prev) => ({ ...prev, anonimo: !prev.anonimo }))
  }

  const handleUpdate = async (isDraft) => {
    if (!isDraft && (!formData.titulo || !formData.nivel || !formData.categoria || !formData.experiencia)) {
      Swal.fire("Campos Incompletos", "Preencha os campos obrigatórios para enviar para revisão.", "warning")
      return
    }

    setSubmitting(true)
    const dataToSend = new FormData()
    dataToSend.append("is_draft", isDraft)
    dataToSend.append("anonimo", formData.anonimo) // Envia a flag
    Object.keys(formData).forEach((key) => {
      if (key === 'recursos') {
        formData.recursos.forEach(r => dataToSend.append("recursos", r))
      } else if (key === 'arquivo') {
        if (formData.arquivo) dataToSend.append("arquivo", formData.arquivo)
      } else if (key === 'nivel') {
        dataToSend.append("nivel_ensino", formData.nivel)
      } else if (key !== 'anonimo' && formData[key] !== null && formData[key] !== "") {
        dataToSend.append(key, formData[key])
      }
    })

    try {
      await api.put(`api/production/${id}/update/`, dataToSend, { headers: { "Content-Type": "multipart/form-data" } })
      Swal.fire({ icon: "success", title: isDraft ? "Alterações Salvas!" : "Prática Reenviada!", confirmButtonColor: "#1565C0" })
      navigate("/dashboard/minhas-producoes")
    } catch (error) {
      Swal.fire("Erro", "Erro ao atualizar produção.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide flex items-center gap-1.5"

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
      <div className="animate-pulse text-slate-400 font-bold flex items-center gap-2">
        <Loader2 className="animate-spin" size={24} /> Carregando formulário...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1300px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors">
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="text-left sm:text-right">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isDraftStatus ? "Continuar Editando" : "Editar Prática"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isDraftStatus ? "Termine de preencher seu rascunho." : "Faça as correções solicitadas e reenvie."}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Esquerda (Ficha Técnica) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText size={20} className="text-[#1565C0]" /> Ficha Técnica
              </h3>

              <div>
                <label className={labelClass}>Título <span className="text-red-500">*</span></label>
                <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className={inputClass} placeholder="Ex: Dilemas Éticos com IA" />
              </div>

              <div>
                <label className={labelClass}>Disciplina</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-4 text-slate-400" />
                  <input type="text" value={formData.disciplina} readOnly className={`${inputClass} pl-10 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed text-slate-500`} title="Não editável" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Nível <span className="text-red-500">*</span></label>
                <select name="nivel" value={formData.nivel} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">Selecione...</option>
                  <option value="Fundamental 1">Fundamental 1</option>
                  <option value="Fundamental 2">Fundamental 2</option>
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Ensino Superior">Ensino Superior</option>
                </select>
              </div>

              <div>
                <label className={labelClass}><Layers size={14}/> Categoria <span className="text-red-500">*</span></label>
                <select name="categoria" value={formData.categoria} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">O que foi criado?</option>
                  <optgroup label="Planejamento">
                    <option value="Plano de Aula">Plano de Aula / Roteiro</option>
                    <option value="Sequência Didática">Sequência Didática</option>
                    <option value="Rubrica de Avaliação">Rubrica de Avaliação</option>
                  </optgroup>
                  <optgroup label="Recursos Didáticos">
                    <option value="Texto de Apoio">Texto de Apoio / Artigo</option>
                    <option value="Slide / Apresentação">Slide / Apresentação</option>
                    <option value="Lista de Exercícios">Lista de Exercícios</option>
                    <option value="Quiz / Questões">Quiz / Banco de Questões</option>
                    <option value="Imagens / Vídeos">Imagens / Vídeos</option>
                  </optgroup>
                  <optgroup label="Atividades Práticas">
                    <option value="Estudo de Caso">Estudo de Caso</option>
                    <option value="Simulação / Roleplay">Simulação / Roleplay</option>
                    <option value="Prompt para Alunos">Prompt para Alunos</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className={labelClass}>Modelo de IA</label>
                <input type="text" name="modelo_ia" value={formData.modelo_ia} onChange={handleChange} className={inputClass} placeholder="Ex: ChatGPT-4, Gemini..." />
              </div>

              <div>
                <label className={labelClass}>Prompts Utilizados</label>
                <textarea name="prompts_ia" value={formData.prompts_ia} onChange={handleChange} rows="4" className={inputClass} placeholder="Ex: 'Atue como um professor...'" />
              </div>

              <div className="mt-2">
                <label className={labelClass}><UploadCloud size={16}/> Arquivo Anexado</label>
                <div className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                  <input type="file" id="file-upload" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full">
                    {formData.arquivo ? (
                      <>
                        <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Novo: {formData.arquivo.name}</span>
                      </>
                    ) : existingFile ? (
                      <>
                        <FileText size={32} className="text-[#1565C0] dark:text-blue-400 mb-2" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Manter atual (clique para trocar)</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm mb-3">
                          <UploadCloud size={24} className="text-[#1565C0] dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-[#1565C0] dark:text-blue-400">Substituir Arquivo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}><LinkIcon size={14}/> Link Externo (Opcional)</label>
                <input type="url" name="link_material" value={formData.link_material} onChange={handleChange} className={inputClass} placeholder="Ex: https://youtu.be/..." />
              </div>
            </div>

            {/* Direita (Pedagógico) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <BookOpen size={20} className="text-[#1565C0]" /> Detalhamento Pedagógico
              </h3>

              <div>
                <label className={labelClass}>BNCC / Objetivos</label>
                <textarea name="bncc" value={formData.bncc} onChange={handleChange} rows="2" className={inputClass} placeholder="Cite os códigos e objetivos da BNCC relacionados..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><Wrench size={14}/> Metodologia</label>
                  <input type="text" name="metodologia" value={formData.metodologia} onChange={handleChange} className={inputClass} placeholder="Ex: Sala Invertida, PBL..." />
                </div>
                <div>
                  <label className={labelClass}><Clock size={14}/> Duração</label>
                  <input type="text" name="duracao" value={formData.duracao} onChange={handleChange} className={inputClass} placeholder="Ex: 50 min, 2 aulas..." />
                </div>
              </div>

              <div>
                <label className={labelClass}><Package size={14}/> Recursos Didáticos</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {RECURSOS_COMUNS.map((res) => {
                    const isSelected = formData.recursos.includes(res)
                    return (
                      <button
                        key={res} type="button" onClick={() => toggleRecurso(res)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${isSelected ? "bg-[#1565C0] text-white border-[#1565C0] shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}
                      >
                        {res}
                      </button>
                    )
                  })}
                </div>
                
                <div className="flex gap-2">
                  <input type="text" placeholder="Outro recurso..." value={customResource} onChange={(e) => setCustomResource(e.target.value)} onKeyDown={addCustomResource} className={inputClass} />
                  <button type="button" onClick={addCustomResource} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 rounded-xl hover:bg-slate-200 transition-colors"><Plus size={18}/></button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.recursos.filter((r) => !RECURSOS_COMUNS.includes(r)).map((res, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-2 border border-amber-200 dark:border-amber-800/50">
                      {res} <button type="button" onClick={() => toggleRecurso(res)} className="hover:text-amber-500"><X size={12}/></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}><Lightbulb size={14}/> Relato da Experiência</label>
                <textarea name="experiencia" value={formData.experiencia} onChange={handleChange} rows="5" className={inputClass} placeholder="Descreva como foi a aplicação em sala de aula, o engajamento dos alunos e os desafios encontrados..." />
              </div>

              <div>
                <label className={labelClass}><Target size={14}/> Resultados Obtidos</label>
                <textarea name="resultados" value={formData.resultados} onChange={handleChange} rows="3" className={inputClass} placeholder="Quais foram as evidências de aprendizagem? O que os alunos produziram ou demonstraram?" />
              </div>

              {/* AUTORIA BUTTON */}
              <div className="mt-4 flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Deseja receber os créditos por essa prática?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Por padrão, sua produção será enviada anonimamente para evitar vieses na revisão. Mas você pode assinar a obra se preferir.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleToggleAutoria}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                    !formData.anonimo 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {!formData.anonimo ? <UserCheck size={16}/> : <EyeOff size={16}/>}
                  {!formData.anonimo ? "Assinar Obra" : "Manter Anônimo"}
                </button>
              </div>

              {/* Botões */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                {isDraftStatus && (
                  <button type="button" disabled={submitting} onClick={() => handleUpdate(true)} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                    <Save size={18} /> Salvar Alterações
                  </button>
                )}
                <button type="button" disabled={submitting} onClick={() => handleUpdate(false)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-[#1565C0] hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  {submitting ? " Enviando..." : isDraftStatus ? " Enviar para Revisão" : " Salvar e Reenviar"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditarProducao