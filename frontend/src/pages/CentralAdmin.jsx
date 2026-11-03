import React from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  ShieldAlert, UserCheck, Settings, ChevronRight, Database, 
  Trophy, ExternalLink, Book, FileText
} from "lucide-react"

export default function CentralAdmin() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-200 pb-20">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Central de Administração
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gerencie usuários, configurações e recursos globais da plataforma.
            </p>
          </div>
        </div>

        {/* Grid de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div onClick={() => navigate("/dashboard/aprovacoes")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Aprovação de Contas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Analise e aprove novos professores que solicitaram acesso.</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
          </div>

          <div onClick={() => navigate("/dashboard/admin/gamificacao")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Trophy size={32} className="text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Gamificação e Hall</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Gerencie conquistas, atribua XP manual e crie badges.</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
          </div>

          <div onClick={() => navigate("/dashboard/admin")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert size={32} className="text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Auditoria de Dados</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Exclua usuários, exporte relatórios e gerencie o fórum.</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-red-500 transition-colors" />
          </div>

          <div onClick={() => navigate("/dashboard/admin/diario")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={32} className="text-orange-500 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Diário de Operações</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Registre reuniões, visitas às escolas e treinamentos.</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors" />
          </div>

          <div onClick={() => window.open("https://docs.google.com/document/d/SEU_LINK_AQUI", "_blank")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Book size={32} className="text-[#1565C0] dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">Documentação Técnica</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Requisitos funcionais, regras de negócio e arquitetura.</p>
            </div>
            <ExternalLink size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-[#1565C0] transition-colors" />
          </div>

          <div onClick={() => navigate("/dashboard/admin/configuracoes")} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
            <div className="w-16 h-16 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Database size={32} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Configurações Gerais</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Ajuste parâmetros globais e pesos da IA do sistema.</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
          </div>

        </div>
      </div>
    </div>
  )
}