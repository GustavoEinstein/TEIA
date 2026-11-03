import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  HelpCircle, PlayCircle, ChevronDown, BookOpen, ShieldCheck, 
  FileText, ArrowLeft, X, MessageCircle, Mail, Users
} from "lucide-react"

const Ajuda = () => {
  const navigate = useNavigate()
  const [faqAtivo, setFaqAtivo] = useState(null)
  const [showContactModal, setShowContactModal] = useState(false)

  const toggleFaq = (index) => setFaqAtivo(faqAtivo === index ? null : index)

  const faqs = [
    { pergunta: 'Como funciona o processo de "Revisão por Pares"?', resposta: "Após enviar sua produção, ela entra em uma fila anônima. Um outro professor da sua mesma área avaliará seu material seguindo uma Rúbrica de 6 Eixos." },
    { pergunta: "Por que não consigo revisar atividades de outras disciplinas?", resposta: "Para garantir a qualidade técnica e pedagógica, o sistema restringe a revisão à sua área de especialidade." },
    { pergunta: "O que acontece se minha produção for rejeitada?", resposta: 'Você receberá um feedback detalhado com "Pontos Fortes" e "Sugestões de Melhoria" e poderá reenviar o material ajustado.' },
    { pergunta: "Quais dados devo preencher ao catalogar?", resposta: "Além do básico, pedimos detalhamento sobre: Alinhamento com a BNCC, Metodologia usada, Relato de Experiência e Resultados Observados." },
    { pergunta: "Quem pode ver meus materiais aprovados?", resposta: 'Uma vez aprovado, seu material ganha o selo "Revisado por Pares" e fica visível na vitrine da página inicial.' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 p-4 md:p-8 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="mb-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Central de Ajuda
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tire suas dúvidas sobre o funcionamento da plataforma e comunidade T.E.I.A.
          </p>
        </div>

        {/* Guias Iniciais */}
        <div className="mb-16">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PlayCircle size={24} className="text-[#1565C0] dark:text-blue-400" /> Primeiros Passos
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl w-fit mb-5 text-[#1565C0] dark:text-blue-400"><FileText size={24} /></div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Guia de Catalogação</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">Aprenda a preencher os campos pedagógicos (BNCC, Metodologia).</p>
              <button className="w-full py-2.5 rounded-lg font-bold text-sm bg-slate-50 dark:bg-slate-800 text-[#1565C0] dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] transition-colors">
                Assistir Tutorial
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl w-fit mb-5 text-emerald-600 dark:text-emerald-400"><ShieldCheck size={24} /></div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Como Revisar um Par</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">Entenda como aplicar a Rúbrica de 6 Eixos para avaliar colegas.</p>
              <button className="w-full py-2.5 rounded-lg font-bold text-sm bg-slate-50 dark:bg-slate-800 text-[#1565C0] dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] transition-colors">
                Assistir Tutorial
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl w-fit mb-5 text-amber-600 dark:text-amber-400"><BookOpen size={24} /></div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Materiais em Sala</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">Dicas de como adaptar os roteiros da plataforma para sua realidade.</p>
              <button className="w-full py-2.5 rounded-lg font-bold text-sm bg-slate-50 dark:bg-slate-800 text-[#1565C0] dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] transition-colors">
                Assistir Tutorial
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <HelpCircle size={24} className="text-[#1565C0] dark:text-blue-400" /> Perguntas Frequentes
          </h3>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <button 
                  onClick={() => toggleFaq(index)}
                  className={`w-full text-left p-6 flex justify-between items-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${faqAtivo === index ? "text-[#1565C0] dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}
                >
                  <span className="font-bold text-[15px]">{faq.pergunta}</span>
                  <ChevronDown size={20} className={`shrink-0 transition-transform duration-300 ${faqAtivo === index ? "rotate-180" : ""}`} />
                </button>
                {faqAtivo === index && (
                  <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed animate-in slide-in-from-top-2 fade-in">
                    {faq.resposta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Support */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-10 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Ainda com dúvidas ou encontrou algum problema no sistema?</p>
          <button 
            onClick={() => setShowContactModal(true)}
            className="bg-[#1565C0] hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow-md transition-colors text-sm"
          >
            Fale com a nossa equipe
          </button>
        </div>

      </div>

      {/* MODAL Contato */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-8 relative border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Como podemos ajudar?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Escolha o canal mais adequado para a sua necessidade.</p>
            
            <div className="flex flex-col gap-4">
              <button onClick={() => window.open("https://chat.whatsapp.com/EEcyH5dEb4l0WKziyBVSqU", "_blank")} className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors cursor-pointer group">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-full shrink-0 group-hover:scale-110 transition-transform"><MessageCircle size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px] mb-1">Suporte Rápido</h4>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">Dúvidas pontuais ou bugs. Atendimento via grupo oficial de WhatsApp.</p>
                </div>
              </button>
              
              <button onClick={() => window.location.href = "mailto:suporte.ianaeducacaobasica.unb@gmail.com?subject=Suporte T.E.I.A"} className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#1565C0] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors cursor-pointer group">
                <div className="bg-blue-100 dark:bg-blue-900/40 text-[#1565C0] dark:text-blue-400 p-3 rounded-full shrink-0 group-hover:scale-110 transition-transform"><Mail size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px] mb-1">Canal Oficial</h4>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">Para documentações, exclusão de conta ou parcerias.</p>
                </div>
              </button>

              <button onClick={() => { setShowContactModal(false); navigate("/dashboard/forum"); }} className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors cursor-pointer group">
                <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 p-3 rounded-full shrink-0 group-hover:scale-110 transition-transform"><Users size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px] mb-1">Fórum T.E.I.A</h4>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">Abra uma discussão no fórum para debater com outros professores.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Ajuda