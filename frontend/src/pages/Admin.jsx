import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import {
  Users, FileText, MessageSquare, Trash2, ShieldAlert,
  Eye, Search, Loader2, FileSpreadsheet, Download,
} from "lucide-react"

export default function Admin() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("usuarios")
  const [busca, setBusca] = useState("")

  const [usuarios, setUsuarios] = useState([])
  const [producoes, setProducoes] = useState([])
  const [topicos, setTopicos] = useState([])
  const [estatisticas, setEstatisticas] = useState({ users: 0, prods: 0, forum: 0 })

  useEffect(() => {
    verificarPermissaoECarregar()
  }, [])

  const verificarPermissaoECarregar = async () => {
    try {
      const perfilRes = await api.get("api/user/me/")
      if (!perfilRes.data.is_superuser) {
        Swal.fire({ icon: "error", title: "Acesso Negado", text: "Você não tem permissão." })
        navigate("/dashboard")
        return
      }
      await buscarDados("usuarios")
      await buscarDados("producoes")
      await buscarDados("topicos")
      setLoading(false)
    } catch (error) {
      navigate("/dashboard")
    }
  }

  const buscarDados = async (tipo) => {
    try {
      let endpoint = ""
      if (tipo === "usuarios") endpoint = "api/admin/users/"
      else if (tipo === "producoes") endpoint = "api/admin/productions/"
      else if (tipo === "topicos") endpoint = "api/admin/forum/"

      const res = await api.get(endpoint)
      if (tipo === "usuarios") {
        setUsuarios(res.data)
        setEstatisticas((prev) => ({ ...prev, users: res.data.length }))
      } else if (tipo === "producoes") {
        setProducoes(res.data)
        setEstatisticas((prev) => ({ ...prev, prods: res.data.length }))
      } else if (tipo === "topicos") {
        setTopicos(res.data)
        setEstatisticas((prev) => ({ ...prev, forum: res.data.length }))
      }
    } catch (e) {
      console.error(`Erro ao buscar ${tipo}:`, e)
    }
  }

  const handleDownload = async (arquivoUrl, id) => {
    if (!arquivoUrl) return
    try {
      const urlRelativa = arquivoUrl.replace("https://teia.cic.unb.br/kipo_playground/", "")
      const response = await api.get(urlRelativa, { responseType: "blob" })
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = urlBlob
      link.setAttribute("download", `producao-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (error) {
      Swal.fire("Erro", "Não foi possível baixar o arquivo.", "error")
    }
  }

  const exportarExcel = () => {
    let dados = []
    let nomeArquivo = `relatorio_${activeTab}_teia.xlsx`

    if (activeTab === "usuarios")
      dados = usuariosFiltrados.map((u) => ({ ID: u.id, Nome: u.username, "E-mail": u.email, Disciplina: u.disciplina, Perfil: u.is_superuser ? "Administrador" : "Docente" }))
    else if (activeTab === "producoes")
      dados = producoesFiltradas.map((p) => ({ ID: p.id, Título: p.titulo, Autor: p.autor, Status: p.status, Data: p.data }))
    else
      dados = topicosFiltrados.map((t) => ({ ID: t.id, Título: t.titulo, Autor: t.autor, Categoria: t.categoria }))

    if (dados.length === 0) return Swal.fire("Aviso", "Não há dados para exportar.", "info")
    const worksheet = XLSX.utils.json_to_sheet(dados)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório")
    XLSX.writeFile(workbook, nomeArquivo)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    const azulTeia = [21, 101, 192]

    doc.setFontSize(22)
    doc.setTextColor(azulTeia[0], azulTeia[1], azulTeia[2])
    doc.text("T.E.I.A", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("Relatório Administrativo - Inteligência Pedagógica", 14, 27)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 32)

    let head = []
    let body = []

    if (activeTab === "usuarios") {
      head = [["ID", "Nome", "E-mail", "Disciplina", "Papel"]]
      body = usuariosFiltrados.map((u) => [u.id, u.username, u.email, u.disciplina, u.is_superuser ? "Admin" : "Docente"])
    } else if (activeTab === "producoes") {
      head = [["ID", "Título", "Autor", "Status", "Data"]]
      body = producoesFiltradas.map((p) => [p.id, p.titulo, p.autor, p.status, p.data])
    } else {
      head = [["ID", "Título", "Autor", "Categoria"]]
      body = topicosFiltrados.map((t) => [t.id, t.titulo, t.autor, t.categoria])
    }

    if (body.length === 0) return Swal.fire("Aviso", "Não há dados para exportar.", "info")

    autoTable(doc, {
      startY: 40, head: head, body: body, headStyles: { fillColor: azulTeia }, theme: "grid", styles: { fontSize: 9 },
    })
    doc.save(`Relatorio_TEIA_${activeTab}.pdf`)
  }

  const handleDeletar = async (tipo, id, nome) => {
    const result = await Swal.fire({
      title: "Excluir registro?", text: `Deseja apagar ${nome}?`, icon: "warning",
      showCancelButton: true, confirmButtonColor: "#DC2626",
    })
    if (result.isConfirmed) {
      try {
        const endpoint = tipo === "usuario" ? `api/admin/users/${id}/delete/` : tipo === "producao" ? `api/admin/productions/${id}/delete/` : `api/admin/forum/${id}/delete/`
        await api.delete(endpoint)
        Swal.fire("Excluído!", "", "success")
        buscarDados(activeTab === "topicos" ? "forum" : activeTab)
      } catch (error) {
        Swal.fire("Erro", "Falha ao deletar.", "error")
      }
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => u.username?.toLowerCase().includes(busca.toLowerCase()) || u.email?.toLowerCase().includes(busca.toLowerCase()))
  const producoesFiltradas = producoes.filter((p) => p.titulo?.toLowerCase().includes(busca.toLowerCase()))
  const topicosFiltrados = topicos.filter((t) => t.titulo?.toLowerCase().includes(busca.toLowerCase()))

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 className="animate-spin text-[#1565C0] mb-4" size={32} />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Carregando Painel...</p>
    </div>
  )

  const activeTabClass = "px-6 py-2.5 rounded-lg border-none bg-[#1565C0] text-white font-bold cursor-pointer whitespace-nowrap shadow-md shadow-blue-500/20"
  const inactiveTabClass = "px-6 py-2.5 rounded-lg border-none bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer whitespace-nowrap transition-colors"

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800/50">
              <ShieldAlert size={28} className="text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel do Administrador</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestão de dados e auditoria do sistema.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div onClick={() => { setActiveTab("usuarios"); setBusca("") }} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl flex items-center gap-4 shadow-sm border cursor-pointer transition-all ${activeTab === "usuarios" ? "border-l-4 border-l-blue-600 dark:border-l-blue-500 border-slate-200 dark:border-slate-800" : "border border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl"><Users size={24} className="text-blue-600 dark:text-blue-400" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Usuários</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{estatisticas.users}</h3>
            </div>
          </div>
          <div onClick={() => { setActiveTab("producoes"); setBusca("") }} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl flex items-center gap-4 shadow-sm border cursor-pointer transition-all ${activeTab === "producoes" ? "border-l-4 border-l-emerald-500 dark:border-l-emerald-400 border-slate-200 dark:border-slate-800" : "border border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl"><FileText size={24} className="text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Produções</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{estatisticas.prods}</h3>
            </div>
          </div>
          <div onClick={() => { setActiveTab("topicos"); setBusca("") }} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl flex items-center gap-4 shadow-sm border cursor-pointer transition-all ${activeTab === "topicos" ? "border-l-4 border-l-purple-500 dark:border-l-purple-400 border-slate-200 dark:border-slate-800" : "border border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl"><MessageSquare size={24} className="text-purple-600 dark:text-purple-400" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tópicos Fórum</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{estatisticas.forum}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
              <button onClick={() => { setActiveTab("usuarios"); setBusca("") }} className={activeTab === "usuarios" ? activeTabClass : inactiveTabClass}>Usuários</button>
              <button onClick={() => { setActiveTab("producoes"); setBusca("") }} className={activeTab === "producoes" ? activeTabClass : inactiveTabClass}>Produções</button>
              <button onClick={() => { setActiveTab("topicos"); setBusca("") }} className={activeTab === "topicos" ? activeTabClass : inactiveTabClass}>Fórum</button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-64 focus-within:border-[#1565C0] transition-colors">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm dark:text-white" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={exportarExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"><FileSpreadsheet size={16} /> Excel</button>
                <button onClick={exportarPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"><FileText size={16} /> PDF</button>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-x-auto">
            {isMobile ? (
              <div className="flex flex-col gap-4">
                {activeTab === "usuarios" && usuariosFiltrados.map((u) => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div className="text-[11px] font-bold text-slate-400">ID: #{u.id}</div>
                    <div className="font-black text-slate-800 dark:text-white text-base">{u.username}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{u.email}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs font-bold ${u.is_superuser ? 'text-blue-500' : 'text-slate-500'}`}>{u.is_superuser ? "Admin" : "Docente"}</span>
                      <button onClick={() => handleDeletar("usuario", u.id, u.username)} disabled={u.is_superuser} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg disabled:opacity-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {activeTab === "producoes" && producoesFiltradas.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div className="text-[11px] font-bold text-slate-400">ID: #{p.id}</div>
                    <div className="font-black text-slate-800 dark:text-white text-base">{p.titulo}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Autor: {p.autor} • {p.status}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/dashboard/producao/${p.id}`)} className="flex-1 flex justify-center p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Eye size={16} /></button>
                      {p.arquivo && <button onClick={() => handleDownload(p.arquivo, p.id)} className="flex-1 flex justify-center p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Download size={16} /></button>}
                      <button onClick={() => handleDeletar("producao", p.id, p.titulo)} className="flex-1 flex justify-center p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {activeTab === "topicos" && topicosFiltrados.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div className="text-[11px] font-bold text-slate-400">ID: #{t.id}</div>
                    <div className="font-black text-slate-800 dark:text-white text-base">{t.titulo}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{t.categoria}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/dashboard/forum/${t.id}`)} className="flex-1 flex justify-center p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Eye size={16} /></button>
                      <button onClick={() => handleDeletar("topico", t.id, t.titulo)} className="flex-1 flex justify-center p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-widest">ID</th>
                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === "usuarios" ? "Nome" : "Título"}</th>
                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === "usuarios" ? "E-mail" : "Autor"}</th>
                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === "topicos" ? "Categoria" : "Status"}</th>
                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === "usuarios" && usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm text-slate-500">#{u.id}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{u.username}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="p-4 text-sm font-bold text-slate-500">{u.is_superuser ? "Admin" : "Docente"}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeletar("usuario", u.id, u.username)} disabled={u.is_superuser} className="inline-flex p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === "producoes" && producoesFiltradas.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm text-slate-500">#{p.id}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{p.titulo}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{p.autor}</td>
                      <td className="p-4 text-sm font-bold text-slate-500">{p.status}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/dashboard/producao/${p.id}`)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"><Eye size={16} /></button>
                          {p.arquivo && <button onClick={() => handleDownload(p.arquivo, p.id)} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition-colors"><Download size={16} /></button>}
                          <button onClick={() => handleDeletar("producao", p.id, p.titulo)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeTab === "topicos" && topicosFiltrados.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm text-slate-500">#{t.id}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{t.titulo}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{t.autor}</td>
                      <td className="p-4 text-sm font-bold text-slate-500">{t.categoria}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/dashboard/forum/${t.id}`)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"><Eye size={16} /></button>
                          <button onClick={() => handleDeletar("topico", t.id, t.titulo)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {activeTab === "usuarios" && usuariosFiltrados.length === 0 && <p className="text-center p-8 text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl mt-4">Nenhum usuário encontrado.</p>}
            {activeTab === "producoes" && producoesFiltradas.length === 0 && <p className="text-center p-8 text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl mt-4">Nenhuma produção encontrada.</p>}
            {activeTab === "topicos" && topicosFiltrados.length === 0 && <p className="text-center p-8 text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl mt-4">Nenhum tópico encontrado.</p>}
          </div>
        </div>

      </div>
    </div>
  )
}