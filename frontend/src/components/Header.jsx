import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Menu, Trophy, LogOut, Bell, Star, ArrowUpCircle, 
  Medal, CheckCircle2, AlertCircle
} from "lucide-react"
import api from "../services/api"
import ThemeToggle from "./ThemeToggle"
import Swal from "sweetalert2"

function Header({ onToggleMenu, showMenuButton }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)

  const pageTitles = {
    "/dashboard": "Visão Geral",
    "/dashboard/catalogar": "Catalogar Prática",
    "/dashboard/minhas-producoes": "Minhas Produções",
    "/dashboard/revisao": "Revisão (Duplo Cego)",
    "/dashboard/comunidade": "Comunidade",
    "/dashboard/ajuda": "Ajuda e Suporte",
    "/dashboard/forum": "Fórum de Rascunhos",
    "/dashboard/admin": "Painel do Administrador",
    "/dashboard/central-admin": "Central Administrativa",
    "/dashboard/ranking": "Hall da Fama",
    "/dashboard/aprovacoes": "Aprovação de Contas",
    "/perfil": "Meu Perfil",
  }

  const currentTitle = pageTitles[location.pathname] || "Página do Sistema"

  const [userPontos, setUserPontos] = useState(localStorage.getItem("user_pontos") || "0")
  const [userNivel, setUserNivel] = useState(localStorage.getItem("user_nivel") || "Prof. Conectado(a)")
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem("user_avatar"))

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter((n) => !n.lida).length

  const isInitialMount = useRef(true)
  const knownNotifIds = useRef(new Set())

  useEffect(() => {
    let isMounted = true

    const buscarDadosEnotificacoes = async () => {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) return

        const [resPerfil, resNotif] = await Promise.all([
          api.get("api/user/me/"),
          api.get("api/notificacoes/"),
        ])

        if (!isMounted) return

        const data = resPerfil.data
        localStorage.setItem("user_pontos", data.pontos)
        localStorage.setItem("user_nivel", data.nivel)
        setUserPontos(data.pontos)
        setUserNivel(data.nivel)

        const fetchedNotifs = resNotif.data
        setNotifications(fetchedNotifs)

        if (isInitialMount.current) {
          fetchedNotifs.forEach((n) => knownNotifIds.current.add(n.id))
          isInitialMount.current = false
        } else {
          fetchedNotifs.forEach((n) => {
            if (!n.lida && !knownNotifIds.current.has(n.id)) {
              knownNotifIds.current.add(n.id)
              dispararToastNotificacao(n)
            }
          })
        }
      } catch (e) {
        console.error("Erro no Radar de XP", e)
      }
    }

    buscarDadosEnotificacoes()

    const atualizarHeader = () => buscarDadosEnotificacoes()
    window.addEventListener("perfilAtualizado", atualizarHeader)
    const interval = setInterval(buscarDadosEnotificacoes, 30000)

    return () => {
      isMounted = false
      window.removeEventListener("perfilAtualizado", atualizarHeader)
      clearInterval(interval)
    }
  }, [])

  const dispararToastNotificacao = (n) => {
    let iconHtml = "🔔"
    let borderColor = "#cbd5e1" // slate-300

    if (n.tipo === "XP") { iconHtml = "⭐"; borderColor = "#F59E0B" }
    if (n.tipo === "NIVEL") { iconHtml = "🚀"; borderColor = "#10B981" }
    if (n.tipo === "MEDALHA") { iconHtml = "🏅"; borderColor = "#8B5CF6" }

    Swal.fire({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 6000,
      timerProgressBar: true,
      background: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
      color: document.documentElement.classList.contains("dark") ? "#f8fafc" : "#0f172a",
      html: `
        <div style="display: flex; align-items: center; gap: 15px; text-align: left;">
            <div style="font-size: 28px;">${iconHtml}</div>
            <div>
                <strong style="display: block; font-size: 15px; margin-bottom: 2px;">${n.titulo}</strong>
                <span style="font-size: 13px; opacity: 0.8;">${n.mensagem}</span>
            </div>
        </div>
      `,
      didOpen: (toast) => {
        toast.style.borderLeft = `5px solid ${borderColor}`
        toast.addEventListener("mouseenter", Swal.stopTimer)
        toast.addEventListener("mouseleave", Swal.resumeTimer)
      },
    })
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowNotifications(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = (e) => {
    e.stopPropagation()
    localStorage.clear()
    navigate("/")
  }

  const handleToggleNotifications = async () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadCount > 0) {
      try {
        await api.post("api/notificacoes/ler/")
        setNotifications(notifications.map((n) => ({ ...n, lida: true })))
      } catch (e) {
        console.error("Falha ao marcar como lida")
      }
    }
  }

  const fullUserName = localStorage.getItem("user_name") || ""
  const getFirstName = (fullName) => {
    if (!fullName) return ""
    const first = fullName.split(" ")[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }

  const displayName = getFirstName(fullUserName)
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : "P"

  const getNotifIcon = (tipo) => {
    switch (tipo) {
      case "XP": return <Star size={18} className="text-amber-500" />
      case "NIVEL": return <ArrowUpCircle size={18} className="text-emerald-500" />
      case "MEDALHA": return <Medal size={18} className="text-violet-500" />
      case "AVALIACAO": return <CheckCircle2 size={18} className="text-blue-500" />
      default: return <AlertCircle size={18} className="text-slate-400" />
    }
  }

  return (
    <header className="sticky top-0 z-[900] w-full h-[75px] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 transition-colors duration-200 shadow-sm">
      
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button onClick={onToggleMenu} className="p-2 text-slate-500 hover:text-[#1565C0] dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
            <Menu size={24} />
          </button>
        )}
        <div className="hidden sm:flex items-center text-sm font-semibold whitespace-nowrap">
          {!showMenuButton && <span className="text-slate-400 dark:text-slate-500 mr-2">Dashboard /</span>}
          <span className="text-[#1565C0] dark:text-blue-400">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className={showMenuButton ? "hidden" : "block"}>
          <ThemeToggle />
        </div>

        {/* Notificações */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleToggleNotifications} 
            className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Notificações</h3>
              </div>
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Você não tem novas notificações.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${n.lida ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/50 dark:bg-slate-800/50'}`}>
                      <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                        {getNotifIcon(n.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{n.titulo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mb-2">{n.mensagem}</p>
                        <span className="text-[10px] text-slate-400 font-semibold">{n.data}</span>
                      </div>
                      {!n.lida && <div className="w-2 h-2 rounded-full bg-[#1565C0] dark:bg-blue-500 shrink-0 mt-1.5"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div 
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
          title="Ir para meu perfil"
        >
          <div className={`hidden md:flex flex-col items-end justify-center ${showMenuButton ? 'hidden' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-800 dark:text-white group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">Prof. {displayName}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span onClick={handleLogout} className="flex items-center text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                Sair <LogOut size={12} className="ml-1" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider mt-1">
              <Trophy size={10} />
              <span>{userNivel} • {userPontos} XP</span>
            </div>
          </div>

          <div className="w-11 h-11 bg-[#1565C0] dark:bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform shrink-0">
            {userAvatar && userAvatar !== "null" ? (
              <img src={userAvatar} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}

export default Header