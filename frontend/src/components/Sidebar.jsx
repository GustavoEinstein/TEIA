import React from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, FilePlus2, FolderOpen, Scale,
  LifeBuoy, MessageSquare, Settings, Trophy,
  ClipboardList, X
} from "lucide-react"

const SpiderWebIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20" /> <path d="M2 12h20" />
    <path d="M4.93 4.93l14.14 14.14" /> <path d="M19.07 4.93L4.93 19.07" />
    <path d="M12 7 L15.53 8.47 L17 12 L15.53 15.53 L12 17 L8.47 15.53 L7 12 L8.47 8.47 Z" />
    <path d="M12 3 L18.36 5.64 L21 12 L18.36 18.36 L12 21 L5.64 18.36 L3 12 L5.64 5.64 Z" />
  </svg>
)

export default function Sidebar({ isOpen, isMobile, onClose }) {
  const isSuperUser = localStorage.getItem("is_superuser") === "true"

  const baseLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
  const inactiveLinkClass = "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
  const activeLinkClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-[#1565C0] dark:text-blue-400"

  return (
    <aside
      className={`fixed top-0 left-0 h-screen w-[280px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-[1000] transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full"
      }`}
    >
      {/* --- LOGO AREA --- */}
      <div className="h-[75px] shrink-0 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 shadow-sm">
            <SpiderWebIcon size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            T.E.I.A
          </h1>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* --- NAVEGAÇÃO --- */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin flex flex-col gap-8">
        
        {/* Menu Principal */}
        <div>
          <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Menu Principal
          </p>
          <ul className="flex flex-col gap-1.5">
            <li>
              <NavLink to="/dashboard" end onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <LayoutDashboard size={20} className="shrink-0" /> Início
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/catalogar" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <FilePlus2 size={20} className="shrink-0" /> Catalogar Produção
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/minhas-producoes" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <FolderOpen size={20} className="shrink-0" /> Minhas Produções
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/revisao" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <Scale size={20} className="shrink-0" /> Revisão (Duplo-Cego)
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/forum" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <MessageSquare size={20} className="shrink-0" /> Fórum e Dúvidas
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/ranking" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <Trophy size={20} className="shrink-0" /> Hall da Fama
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Menu de Admin (Se for SuperUser) */}
        {isSuperUser && (
          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Administração
            </p>
            <ul className="flex flex-col gap-1.5">
              <li>
                <NavLink to="/dashboard/central-admin" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <Settings size={20} className="shrink-0" /> Central do Admin
                </NavLink>
              </li>
            </ul>
          </div>
        )}

        {/* Espaçador flexível para jogar os itens abaixo para o fundo da lista, caso haja espaço */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <ul className="flex flex-col gap-1.5">
            <li>
              <a href="https://forms.gle/hTbpQGN9zHkFXEHk6" target="_blank" rel="noopener noreferrer" onClick={isMobile ? onClose : undefined} className={`${baseLinkClass} ${inactiveLinkClass}`}>
                <ClipboardList size={20} className="shrink-0" /> Avaliar o Sistema
              </a>
            </li>
            <li>
              <NavLink to="/dashboard/ajuda" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                <LifeBuoy size={20} className="shrink-0" /> Ajuda e Suporte
              </NavLink>
            </li>
          </ul>
        </div>

      </nav>

      {/* --- FOOTER CARD --- */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="w-full bg-gradient-to-br from-[#1565C0] to-blue-500 dark:from-blue-700 dark:to-blue-900 rounded-xl p-4 shadow-md shadow-blue-500/20 text-center relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
          <h4 className="text-white font-black text-sm tracking-wide mb-1">PROJETO T.E.I.A</h4>
          <p className="text-blue-100/80 text-[11px] font-medium leading-tight">Tecendo a Educação com Inteligência Artificial</p>
        </div>
      </div>

    </aside>
  )
}