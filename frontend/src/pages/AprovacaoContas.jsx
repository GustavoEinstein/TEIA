import React, { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  ShieldCheck, CheckCircle, XCircle, Clock, User, Mail, School, BookOpen, Loader2, ArrowLeft
} from "lucide-react"

export default function AprovacaoContas() {
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    verificarAcesso()
  }, [])

  const verificarAcesso = async () => {
    try {
      const perfilRes = await api.get("api/user/me/")
      if (!perfilRes.data.is_superuser) {
        Swal.fire({ icon: "error", title: "Acesso Negado", text: "Você não tem privilégios de administrador.", confirmButtonColor: "#1565C0" })
        navigate("/dashboard")
        return
      }
      carregarUsuarios()
    } catch (error) {
      navigate("/dashboard")
    }
  }

  const carregarUsuarios = async () => {
    try {
      const response = await api.get("api/admin/pending-users/")
      setUsuarios(response.data)
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403)
        Swal.fire("Erro!", "Erro ao carregar lista de aprovação.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAcao = async (id, nome, acao) => {
    const result = await Swal.fire({
      title: `Confirmar Ação`, text: `Marcar a conta de ${nome} como ${acao.toUpperCase()}?`,
      icon: "warning", showCancelButton: true, confirmButtonColor: acao === "Aprovado" ? "#10B981" : "#EF4444",
    })
    if (!result.isConfirmed) return
    setProcessingId(id)
    try {
      await api.post(`api/admin/approve-user/${id}/`, { acao: acao })
      setUsuarios(usuarios.filter((u) => u.id !== id))
      Swal.fire({ icon: "success", title: "Sucesso!", text: `Conta de ${nome} foi ${acao.toLowerCase()}.`, timer: 2000, showConfirmButton: false })
    } catch (error) {
      Swal.fire("Erro!", "Falha ao executar ação.", "error")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
      <Loader2 size={32} className="animate-spin text-[#1565C0] mb-4" />
      <p className="text-slate-500 dark:text-slate-400 font-bold">Verificando credenciais...</p>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-20 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto">
        
        <header className="mb-8">
          <button onClick={() => navigate("/dashboard/central-admin")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-blue-400 font-bold text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Voltar à Central
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={32} className="text-[#1565C0] dark:text-blue-400" />
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight m-0">Aprovação de Contas</h1>
            </div>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-bold border border-amber-200 dark:border-amber-800/50">
              {usuarios.length} {usuarios.length === 1 ? "pendente" : "pendentes"}
            </span>
          </div>
        </header>

        {usuarios.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4"><Clock size={40} className="text-slate-400" /></div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">Tudo limpo por aqui!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Não há nenhuma conta aguardando aprovação no momento.</p>
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-4">
            {usuarios.map((u) => (
              <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="font-bold text-slate-800 dark:text-white text-[15px] mb-1 flex items-center gap-2"><User size={16} className="text-slate-400"/> {u.nome}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {u.email}</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"><BookOpen size={12}/> {u.disciplina}</span>
                  <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"><School size={12}/> {u.escola || "Não informada"}</span>
                </div>
                <div className="text-xs text-slate-400 mb-5">Registrado em: {u.data_cadastro}</div>
                <div className="flex gap-3">
                  <button onClick={() => handleAcao(u.id, u.nome, "Aprovado")} disabled={processingId === u.id} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                    <CheckCircle size={16} /> Aprovar
                  </button>
                  <button onClick={() => handleAcao(u.id, u.nome, "Rejeitado")} disabled={processingId === u.id} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                    <XCircle size={16} /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Professor / Contato</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Disciplina</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Escola</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Data Solicitação</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{u.nome}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4"><span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">{u.disciplina}</span></td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{u.escola || "-"}</td>
                      <td className="p-4 text-xs font-medium text-slate-500">{u.data_cadastro}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleAcao(u.id, u.nome, "Aprovado")} disabled={processingId === u.id} className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-emerald-200 dark:border-emerald-800 disabled:opacity-50">
                            <CheckCircle size={14} /> Aprovar
                          </button>
                          <button onClick={() => handleAcao(u.id, u.nome, "Rejeitado")} disabled={processingId === u.id} className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50">
                            <XCircle size={14} /> Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}