import React, { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })

  useEffect(() => {
    if (isDark) {
      localStorage.setItem("theme", "dark")
      document.documentElement.classList.add("dark")
    } else {
      localStorage.setItem("theme", "light")
      document.documentElement.classList.remove("dark")
    }
    window.dispatchEvent(new Event("themeChange"))
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      {isDark ? (
        <Sun size={16} className="text-amber-500" />
      ) : (
        <Moon size={16} className="text-[#1565C0]" />
      )}
      <span className="hidden sm:inline">{isDark ? "Modo Claro" : "Modo Escuro"}</span>
    </button>
  )
}