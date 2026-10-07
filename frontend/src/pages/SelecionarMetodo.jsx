import React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Keyboard, GitMerge, Sparkles } from "lucide-react"

const SelecionarMetodo = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center pt-12 md:pt-20 transition-colors duration-200">
      
      <div className="w-full max-w-6xl flex flex-col items-center">
        {/* Botão Voltar */}
        <div className="w-full mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={18} /> Cancelar
          </button>
        </div>

        {/* Título */}
        <div className="text-center max-w-xl mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Como você deseja catalogar?
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Escolha a forma mais confortável para registrar sua atividade na comunidade.
          </p>
        </div>

        {/* Grid de 3 Cards de Seleção */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* Card 1: Começar do Zero */}
          <div 
            onClick={() => navigate("/dashboard/catalogar/manual")}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-[#1565C0]/40 dark:hover:border-blue-500/40 transition-all duration-300 group"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
              <Keyboard size={36} className="text-slate-600 dark:text-slate-300 group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">
              Prática Original
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1 leading-relaxed">
              Crie uma prática totalmente nova, preenchendo o formulário detalhado com a sua própria experiência.
            </p>
            <span className="text-sm font-bold text-[#1565C0] dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Começar do zero &rarr;
            </span>
          </div>

          {/* Card 2: Releitura */}
          <div 
            onClick={() => navigate("/dashboard/catalogar/base")}
            className="bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-900/10 dark:to-slate-900 border-2 border-blue-100 hover:border-[#1565C0] dark:border-blue-900/50 dark:hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 group-hover:bg-[#1565C0] transition-colors">
              <GitMerge size={36} className="text-[#1565C0] dark:text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1565C0] dark:text-blue-400 mb-3">
              Criar Releitura
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 flex-1 leading-relaxed">
              Use uma prática que já deu certo na comunidade e adapte para a sua realidade (turma, recursos ou IA).
            </p>
            <span className="text-sm font-bold text-[#1565C0] dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Buscar no Acervo &rarr;
            </span>
          </div>

          {/* Card 3: Catalogar com IA (NOVO CARD) */}
          <div 
            onClick={() => navigate("/dashboard/catalogar/assistido")}
            className="bg-gradient-to-b from-purple-50/60 to-white dark:from-purple-900/10 dark:to-slate-900 border-2 border-purple-100 hover:border-purple-600 dark:border-purple-900/50 dark:hover:border-purple-500 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <Sparkles size={36} className="text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-extrabold text-purple-700 dark:text-purple-400 mb-3">
              Catalogar com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 flex-1 leading-relaxed">
              Cole o rascunho da sua aula ou notas livres e deixe a IA extrair e preencher os campos para você.
            </p>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Usar Assistente IA &rarr;
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SelecionarMetodo