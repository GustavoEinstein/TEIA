import React, { useState, useEffect, useCallback } from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, FilePlus2, FolderOpen, Scale,
  LifeBuoy, MessageSquare, Settings, Trophy,
  ClipboardList, X, PanelLeftClose, PanelLeftOpen
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

const MIN_WIDTH = 200
const MAX_WIDTH = 440
const DEFAULT_WIDTH = 280

export default function Sidebar({ isOpen, isMobile, onClose, onToggle }) {
  const isSuperUser = localStorage.getItem("is_superuser") === "true"

  // Estado local caso o componente pai não controle o recolhimento no Desktop
  const [desktopHidden, setDesktopHidden] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("teia_sidebar_width")
    return saved ? Number(saved) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)

  const isSidebarVisible = isMobile ? isOpen : (isOpen !== undefined ? isOpen && !desktopHidden : !desktopHidden)

  // Atualiza variável CSS global para caso o Dashboard.jsx queira usar calc() ou margin-left dinâmico
  useEffect(() => {
    const currentWidth = isSidebarVisible && !isMobile ? `${sidebarWidth}px` : "0px"
    document.documentElement.style.setProperty("--sidebar-width", currentWidth)
  }, [sidebarWidth, isSidebarVisible, isMobile])

  const startResizing = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    setIsResizing(true)
  }, [isMobile])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH)
      setSidebarWidth(newWidth)
      localStorage.setItem("teia_sidebar_width", String(newWidth))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const handleHideSidebar = () => {
    if (isMobile && onClose) {
      onClose()
    } else if (onToggle) {
      onToggle()
    } else {
      setDesktopHidden(true)
    }
  }

  const handleOpenSidebar = () => {
    if (onToggle) {
      onToggle()
    } else {
      setDesktopHidden(false)
    }
  }

  const baseLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border truncate"
  const inactiveLinkClass = "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
  const activeLinkClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-[#1565C0] dark:text-blue-400"

  return (
    <>
      {/* Botão flutuante para reabrir a Sidebar quando escondida no Desktop */}
      {!isMobile && !isSidebarVisible && (
        <button
          onClick={handleOpenSidebar}
          title="Mostrar menu lateral"
          className="fixed top-4 left-4 z-[999] flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#1565C0] dark:hover:text-blue-400 p-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      <aside
        style={{ width: isMobile ? "280px" : `${sidebarWidth}px` }}
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-[1000] ${
          isResizing ? "transition-none" : "transition-transform duration-300 ease-in-out"
        } ${
          isSidebarVisible ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full"
        }`}
      >
        {/* --- LOGO AREA + BOTÃO DE ESCONDER --- */}
        <div className="h-[75px] shrink-0 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 shadow-sm">
              <SpiderWebIcon size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
              T.E.I.A
            </h1>
          </div>

          <button
            onClick={handleHideSidebar}
            title="Esconder barra lateral"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            {isMobile ? <X size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* --- NAVEGAÇÃO --- */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin flex flex-col gap-8">
          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 truncate">
              Menu Principal
            </p>
            <ul className="flex flex-col gap-1.5">
              <li>
                <NavLink to="/dashboard" end onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <LayoutDashboard size={20} className="shrink-0" /> <span className="truncate">Início</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/catalogar" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <FilePlus2 size={20} className="shrink-0" /> <span className="truncate">Catalogar Produção</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/minhas-producoes" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <FolderOpen size={20} className="shrink-0" /> <span className="truncate">Minhas Produções</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/revisao" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <Scale size={20} className="shrink-0" /> <span className="truncate">Revisão (Duplo-Cego)</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/forum" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <MessageSquare size={20} className="shrink-0" /> <span className="truncate">Fórum e Dúvidas</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/ranking" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <Trophy size={20} className="shrink-0" /> <span className="truncate">Hall da Fama</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {isSuperUser && (
            <div>
              <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 truncate">
                Administração
              </p>
              <ul className="flex flex-col gap-1.5">
                <li>
                  <NavLink to="/dashboard/central-admin" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    <Settings size={20} className="shrink-0" /> <span className="truncate">Central do Admin</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <ul className="flex flex-col gap-1.5">
              <li>
                <a href="https://forms.gle/hTbpQGN9zHkFXEHk6" target="_blank" rel="noopener noreferrer" onClick={isMobile ? onClose : undefined} className={`${baseLinkClass} ${inactiveLinkClass}`}>
                  <ClipboardList size={20} className="shrink-0" /> <span className="truncate">Avaliar o Sistema</span>
                </a>
              </li>
              <li>
                <NavLink to="/dashboard/ajuda" onClick={isMobile ? onClose : undefined} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  <LifeBuoy size={20} className="shrink-0" /> <span className="truncate">Ajuda e Suporte</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* --- FOOTER CARD --- */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="w-full bg-gradient-to-br from-[#1565C0] to-blue-500 dark:from-blue-700 dark:to-blue-900 rounded-xl p-4 shadow-md shadow-blue-500/20 text-center relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <h4 className="text-white font-black text-sm tracking-wide mb-1">T.E.I.A</h4>
            <p className="text-blue-100/80 text-[11px] font-medium leading-tight">
              Tecendo a Educação com Inteligência Artificial
            </p>
          </div>
        </div>

        {/* --- ALÇA DE REDIMENSIONAMENTO (DRAG HANDLE PARA COMPUTADOR) --- */}
        {!isMobile && (
          <div
            onMouseDown={startResizing}
            title="Arraste para ajustar a largura"
            className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize group hover:bg-[#1565C0]/60 transition-colors ${
              isResizing ? "bg-[#1565C0]" : "bg-transparent"
            }`}
          />
        )}
      </aside>
    </>
  )
}