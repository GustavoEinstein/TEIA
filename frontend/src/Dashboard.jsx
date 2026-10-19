import React, { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"

function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    let lastMobile = window.innerWidth < 768

    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Só abre/fecha automaticamente se cruzar a barreira entre celular e PC
      if (mobile !== lastMobile) {
        setSidebarOpen(!mobile)
        lastMobile = mobile
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  return (
    <div className="flex min-h-screen relative bg-[#F4F7FE] dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        onToggle={toggleSidebar}
      />

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[999]"
        />
      )}

      <div
        style={{
          marginLeft: isMobile || !sidebarOpen ? "0px" : "var(--sidebar-width, 280px)",
          width: isMobile || !sidebarOpen ? "100%" : "calc(100% - var(--sidebar-width, 280px))",
        }}
        className="flex-1 flex flex-col min-h-screen transition-[margin-left,width] duration-150 ease-out bg-[#F4F7FE] dark:bg-slate-950"
      >
        <Header
          onToggleMenu={toggleSidebar}
          showMenuButton={isMobile || !sidebarOpen}
        />
        <main className="p-0 flex-1 bg-[#F4F7FE] dark:bg-slate-950">
          <Outlet context={{ isMobile }} />
        </main>
      </div>
    </div>
  )
}

export default Dashboard