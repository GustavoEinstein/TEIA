import React, { useEffect, useState } from "react"
import api from "../../services/api"
import { useNavigate, useOutletContext, useLocation } from "react-router-dom"
import Swal from "sweetalert2"
import {
  ArrowLeft, UploadCloud, Lock, BookOpen, Wrench, Clock,
  Package, Lightbulb, Target, FileText, CheckCircle2, Layers,
  X, Send, Check, Search, Link as LinkIcon, Cpu, GitMerge, UserCheck, EyeOff, Plus, Save
} from "lucide-react"

import bnccMat from "../../data/bncc_mat.json"
import bnccPort from "../../data/bncc_port.json"
import bnccComp from "../../data/bncc_comp.json"

const BNCC_GERAL = [...bnccMat, ...bnccPort, ...bnccComp]
const BNCC_COMPUTACAO = [...bnccComp]

const FormularioManual = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const storedDisc = localStorage.getItem("user_disciplina") || "Geral"
  const baseDataInfo = location.state?.baseData || null

  const [formData, setFormData] = useState(() => {
    if (baseDataInfo) {
      return {
        ...baseDataInfo,
        titulo: `Releitura: ${baseDataInfo.titulo}`,
        disciplina: baseDataInfo.disciplina && baseDataInfo.disciplina !== "Outra" ? baseDataInfo.disciplina : storedDisc,
        producao_base: baseDataInfo.id,
        arquivo: null,
        recursos: Array.isArray(baseDataInfo.recursos) ? baseDataInfo.recursos : typeof baseDataInfo.recursos === "string" ? baseDataInfo.recursos.split(",").map((r) => r.trim()) : [],
        link_material: baseDataInfo.link_material || "",
        anonimo: true,
      }
    }

    return {
      titulo: "", disciplina: storedDisc !== "Outra" ? storedDisc : "Geral", nivel: "", modelo_ia: "",
      prompts_ia: "", categoria: "", bncc: "", bncc_computacao: "", metodologia: "", duracao: "",
      recursos: [], experiencia: "", resultados: "", arquivo: null, producao_base: "", link_material: "",
      anonimo: true, 
    }
  })

  const [customResource, setCustomResource] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [mostrarCampoComp, setMostrarCampoComp] = useState(() => formData.bncc_computacao ? true : false)
  const [bnccBuscaGeral, setBnccBuscaGeral] = useState("")
  const [mostrarOpcoesGeral, setMostrarOpcoesGeral] = useState(false)

  const bnccFiltradasGeral = BNCC_GERAL.filter(
    (item) => item.id.toLowerCase().includes(bnccBuscaGeral.toLowerCase()) || item.texto.toLowerCase().includes(bnccBuscaGeral.toLowerCase()),
  ).slice(0, 5)

  const adicionarBnccGeral = (item) => {
    const novaCompetencia = `${item.id}: ${item.texto}`
    const textoAtual = formData.bncc ? `\n${formData.bncc}` : ""
    setFormData((prev) => ({ ...prev, bncc: novaCompetencia + textoAtual }))
    setBnccBuscaGeral("")
    setMostrarOpcoesGeral(false)
  }

  const [bnccBuscaComp, setBnccBuscaComp] = useState("")
  const [mostrarOpcoesComp, setMostrarOpcoesComp] = useState(false)

  const bnccFiltradasComp = BNCC_COMPUTACAO.filter(
    (item) => item.id.toLowerCase().includes(bnccBuscaComp.toLowerCase()) || item.texto.toLowerCase().includes(bnccBuscaComp.toLowerCase()),
  ).slice(0, 5)

  const adicionarBnccComp = (item) => {
    const novaCompetencia = `${item.id}: ${item.texto}`
    const textoAtual = formData.bncc_computacao ? `\n${formData.bncc_computacao}` : ""
    setFormData((prev) => ({ ...prev, bncc_computacao: novaCompetencia + textoAtual }))
    setBnccBuscaComp("")
    setMostrarOpcoesComp(false)
  }

  const handleToggleComp = () => {
    const newValue = !mostrarCampoComp
    setMostrarCampoComp(newValue)
    if (!newValue) setFormData((prev) => ({ ...prev, bncc_computacao: "" }))
  }

  const handleToggleAutoria = () => {
    setFormData((prev) => ({ ...prev, anonimo: !prev.anonimo }))
  }

  useEffect(() => {
    if (!baseDataInfo) {
      const savedDraft = localStorage.getItem("producao_autosave_draft")
      if (savedDraft) {
        Swal.fire({
          title: "Rascunho Encontrado!",
          text: "Deseja restaurar os dados não salvos da última vez?",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Sim",
          cancelButtonText: "Não",
          confirmButtonColor: "#1565C0",
        }).then((result) => {
          if (result.isConfirmed) {
            try {
              const draftData = JSON.parse(savedDraft)
              setFormData((prev) => ({ ...prev, ...draftData, arquivo: null }))
              if (draftData.bncc_computacao) setMostrarCampoComp(true)
            } catch (e) {}
          } else {
            localStorage.removeItem("producao_autosave_draft")
          }
        })
      }
    }
  }, [baseDataInfo])

  useEffect(() => {
    const { arquivo, ...dataToSave } = formData
    if (dataToSave.titulo || dataToSave.experiencia || dataToSave.bncc) {
      localStorage.setItem("producao_autosave_draft", JSON.stringify(dataToSave))
    }
  }, [formData])

  const RECURSOS_COMUNS = [
    "Projetor", "Internet / Wi-Fi", "Celulares (BYOD)", "Laboratório de Informática",
    "Tablets", "Quadro Branco", "IA Generativa", "Jogos", "Livro Didático",
  ]

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleFileChange = (e) => setFormData((prev) => ({ ...prev, arquivo: e.target.files[0] }))

  const toggleRecurso = (recurso) => {
    setFormData((prev) => {
      const currentRecursos = prev.recursos || []
      const exists = currentRecursos.includes(recurso)
      return exists ? { ...prev, recursos: currentRecursos.filter((r) => r !== recurso) } : { ...prev, recursos: [...currentRecursos, recurso] }
    })
  }

  const addCustomResource = (e) => {
    if ((e.key === "Enter" || e.type === "click") && customResource.trim()) {
      e.preventDefault()
      const val = customResource.trim()
      const currentRecursos = formData.recursos || []
      if (!currentRecursos.includes(val)) {
        setFormData((prev) => ({ ...prev, recursos: [...currentRecursos, val] }))
      }
      setCustomResource("")
    }
  }

  const handleSubmit = async (isDraft) => {
    if (!isDraft && (!formData.titulo || !formData.nivel || !formData.categoria || !formData.experiencia)) {
      Swal.fire("Campos Incompletos", "Preencha Título, Nível, Categoria e Relato para enviar.", "warning")
      return
    }
    setIsSubmitting(true)
    try {
      const url = "api/production/create/"
      const dataToSend = new FormData()
      
      dataToSend.append("is_draft", isDraft)
      dataToSend.append("anonimo", formData.anonimo)

      Object.keys(formData).forEach((key) => {
        if (key === "recursos") {
          const recArray = formData.recursos || []
          if (recArray.length > 0) dataToSend.append("recursos", recArray.join(", "))
        } else if (key === "arquivo" && formData.arquivo) {
          dataToSend.append("arquivo", formData.arquivo)
        } else if (key === "nivel") {
          dataToSend.append("nivel_ensino", formData.nivel)
        } else if (key !== "anonimo" && formData[key] !== null && formData[key] !== "") {
          dataToSend.append(key, formData[key])
        }
      })

      await api.post(url, dataToSend, { headers: { "Content-Type": "multipart/form-data" } })
      localStorage.removeItem("producao_autosave_draft")

      Swal.fire({ icon: "success", title: isDraft ? "Rascunho Salvo!" : "Prática Enviada!", confirmButtonColor: "#1565C0" })
      navigate("/dashboard/minhas-producoes")
    } catch (error) {
      console.error(error)
      Swal.fire("Erro", "Ocorreu um problema ao salvar. Verifique se os dados estão corretos.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- ESTILOS RESTAURADOS PARA O DESIGN ORIGINAL (BRANCO) ---
  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 outline-none transition-all dark:text-white placeholder-slate-400"
  const labelClass = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 mt-4"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1300px] mx-auto">
        
        {/* Cabeçalho Restaurado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button onClick={() => navigate("/dashboard/catalogar")} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors bg-transparent border-none">
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
            Detalhes da Prática
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
          
          {/* BANNER RELEITURA */}
          {baseDataInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-5 rounded-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-full shrink-0 shadow-sm">
                <GitMerge size={24} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#1565C0] dark:text-blue-400 uppercase mb-1">Modo Releitura Ativo</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 m-0">
                  Você está criando uma adaptação baseada na prática: <br className="sm:hidden"/>
                  <a href={`/dashboard/producao/${baseDataInfo.id}`} target="_blank" rel="noreferrer" className="font-bold text-[#1565C0] dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1">
                    "{baseDataInfo.titulo}" <LinkIcon size={12} />
                  </a>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* --- ESQUERDA (Ficha Técnica) --- */}
            <div className="lg:col-span-4 flex flex-col">
              <h3 className="text-[15px] font-bold text-[#1565C0] dark:text-blue-400 flex items-center gap-2 mb-4 uppercase tracking-wide">
                <FileText size={18} /> Ficha Técnica
              </h3>

              <label className={labelClass}>Título da sua prática</label>
              <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className={inputClass} placeholder="Ex: Dilemas Éticos com IA" />

              <label className={labelClass}>Disciplina</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-4 text-slate-400" />
                <input type="text" value={formData.disciplina} readOnly className={`${inputClass} pl-10 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed text-slate-500`} />
              </div>

              <label className={labelClass}>Nível de Ensino</label>
              <select name="nivel" value={formData.nivel} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer bg-white dark:bg-slate-900`}>
                <option value="">Selecione...</option>
                <option value="Fundamental 1">Fundamental 1</option>
                <option value="Fundamental 2">Fundamental 2</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Ensino Superior">Ensino Superior</option>
              </select>

              <label className={labelClass}><Layers size={14} className="inline mr-1"/> Categoria</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer bg-white dark:bg-slate-900`}>
                <option value="">Selecione a categoria</option>
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

              <label className={labelClass}>Modelo de IA Utilizado</label>
              <input type="text" name="modelo_ia" value={formData.modelo_ia} onChange={handleChange} className={inputClass} placeholder="Ex: ChatGPT-4, Gemini, Claude..." />

              <label className={labelClass}>Prompts Utilizados</label>
              <textarea name="prompts_ia" value={formData.prompts_ia} onChange={handleChange} rows="4" className={inputClass} placeholder="Ex: 'Atue como um professor do ensino médio e crie...'" />

              {/* Upload Restaurado ao original */}
              <label className={labelClass}><UploadCloud size={14} className="inline mr-1"/> Anexar Material</label>
              <div className="border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6 text-center hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer mt-1">
                <input type="file" id="file-upload" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full m-0">
                  {formData.arquivo ? (
                    <>
                      <CheckCircle2 size={24} className="text-[#1565C0] mb-2" />
                      <span className="text-sm font-bold text-[#1565C0]">{formData.arquivo.name}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={24} className="text-[#1565C0] mb-2" />
                      <span className="text-sm font-bold text-[#1565C0]">Carregar Arquivo</span>
                    </>
                  )}
                </label>
              </div>

              <label className={labelClass}><LinkIcon size={14} className="inline mr-1"/> Link Externo (Opcional)</label>
              <input type="url" name="link_material" value={formData.link_material} onChange={handleChange} className={inputClass} placeholder="Ex: https://youtu.be/..." />
              <p className="text-[10px] text-slate-500 mt-1">Caso o material seja muito pesado (ex: vídeos {'>'} 50MB), cole o link do YouTube ou Drive aqui.</p>
            </div>

            {/* --- DIREITA (Pedagógico) --- */}
            <div className="lg:col-span-8 flex flex-col">
              <h3 className="text-[15px] font-bold text-[#1565C0] dark:text-blue-400 flex items-center gap-2 mb-4 uppercase tracking-wide">
                <BookOpen size={18} /> Detalhamento Pedagógico
              </h3>

              <label className={labelClass}>BNCC / Objetivos de Aprendizagem</label>
              <div className="relative z-20 mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Busque por código ou palavra-chave..."
                  value={bnccBuscaGeral} onChange={(e) => { setBnccBuscaGeral(e.target.value); setMostrarOpcoesGeral(true); }}
                  onFocus={() => setMostrarOpcoesGeral(true)} onBlur={() => setTimeout(() => setMostrarOpcoesGeral(false), 200)}
                  className={`${inputClass} pl-10`}
                />
                {mostrarOpcoesGeral && bnccBuscaGeral && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {bnccFiltradasGeral.length > 0 ? bnccFiltradasGeral.map((item) => (
                      <div key={item.id} onClick={() => adicionarBnccGeral(item)} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
                        <strong className="text-[#1565C0]">{item.id}</strong> - <span className="text-slate-600 dark:text-slate-300">{item.texto}</span>
                      </div>
                    )) : <div className="p-4 text-center text-sm text-slate-500">Nenhuma habilidade encontrada.</div>}
                  </div>
                )}
              </div>
              <textarea name="bncc" value={formData.bncc} onChange={handleChange} rows="3" className={inputClass} placeholder="Cite os códigos e objetivos de aprendizagem da BNCC relacionados..." />

              <div 
                onClick={handleToggleComp} 
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mt-4 mb-2 hover:border-slate-300 transition-colors"
              >
                <input type="checkbox" checked={mostrarCampoComp} readOnly className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Esta prática possui interdisciplinaridade com Computação?</span>
              </div>

              {mostrarCampoComp && (
                <div className="mb-4">
                  <div className="relative mb-2 z-10">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" placeholder="Busque por eixo ou habilidade de computação..."
                      value={bnccBuscaComp} onChange={(e) => { setBnccBuscaComp(e.target.value); setMostrarOpcoesComp(true); }}
                      onFocus={() => setMostrarOpcoesComp(true)} onBlur={() => setTimeout(() => setMostrarOpcoesComp(false), 200)}
                      className={`${inputClass} pl-10`}
                    />
                    {mostrarOpcoesComp && bnccBuscaComp && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {bnccFiltradasComp.length > 0 ? bnccFiltradasComp.map((item) => (
                          <div key={item.id} onClick={() => adicionarBnccComp(item)} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
                            <strong className="text-indigo-600">{item.id}</strong> - <span className="text-slate-600 dark:text-slate-300">{item.texto}</span>
                          </div>
                        )) : <div className="p-4 text-center text-sm text-slate-500">Nenhuma encontrada.</div>}
                      </div>
                    )}
                  </div>
                  <textarea name="bncc_computacao" value={formData.bncc_computacao} onChange={handleChange} rows="2" className={inputClass} placeholder="Habilidades de computação..." />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}><Wrench size={14} className="inline mr-1"/> Metodologia</label>
                  <input type="text" name="metodologia" value={formData.metodologia} onChange={handleChange} className={inputClass} placeholder="Ex: Sala Invertida, PBL..." />
                </div>
                <div>
                  <label className={labelClass}><Clock size={14} className="inline mr-1"/> Duração</label>
                  <input type="text" name="duracao" value={formData.duracao} onChange={handleChange} className={inputClass} placeholder="Ex: 50 min, 2 aulas..." />
                </div>
              </div>

              <label className={labelClass}><Package size={14} className="inline mr-1"/> Recursos Didáticos</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {RECURSOS_COMUNS.map((res) => {
                  const isSelected = (formData.recursos || []).includes(res)
                  return (
                    <button
                      key={res} type="button" onClick={() => toggleRecurso(res)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isSelected ? "bg-white text-slate-800 border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-500" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}
                    >
                      {res}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Outro recurso (Enter)..." value={customResource} onChange={(e) => setCustomResource(e.target.value)} onKeyDown={addCustomResource} className={inputClass} />
                <button type="button" onClick={addCustomResource} className="bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-lg hover:bg-slate-100 transition-colors"><Plus size={16}/></button>
              </div>
              {(formData.recursos || []).some((r) => !RECURSOS_COMUNS.includes(r)) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.recursos || []).filter((r) => !RECURSOS_COMUNS.includes(r)).map((res, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                      {res} <button type="button" onClick={() => toggleRecurso(res)} className="hover:text-red-500"><X size={12}/></button>
                    </span>
                  ))}
                </div>
              )}

              <label className={labelClass}><Lightbulb size={14} className="inline mr-1"/> Relato da Experiência</label>
              <textarea name="experiencia" value={formData.experiencia} onChange={handleChange} rows="4" className={inputClass} placeholder="Descreva como foi a aplicação em sala de aula, o engajamento dos alunos e os desafios encontrados..." />

              <label className={labelClass}><Target size={14} className="inline mr-1"/> Resultados</label>
              <textarea name="resultados" value={formData.resultados} onChange={handleChange} rows="3" className={inputClass} placeholder="Quais foram as evidências de aprendizagem? O que os alunos produziram ou demonstraram?" />

              {/* AUTORIA BUTTON RESTAURADO */}
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 m-0">Créditos de Autoria</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Sua produção é enviada anonimamente para revisão duplo-cego. Você deseja assinar a obra publicamente após aprovação?</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleToggleAutoria}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                    !formData.anonimo 
                    ? "bg-[#1565C0]/10 text-[#1565C0] border-[#1565C0]/30" 
                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {!formData.anonimo ? <UserCheck size={16}/> : <EyeOff size={16}/>}
                  {!formData.anonimo ? "Assinar Obra" : "Manter Anônimo"}
                </button>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button type="button" disabled={isSubmitting} onClick={() => handleSubmit(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                  <Save size={16} /> Salvar como Rascunho
                </button>
                <button type="button" disabled={isSubmitting} onClick={() => handleSubmit(false)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white bg-[#1565C0] hover:bg-blue-700 transition-colors border-none">
                  <Send size={16} /> {isSubmitting ? "Enviando..." : "Enviar Prática"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormularioManual