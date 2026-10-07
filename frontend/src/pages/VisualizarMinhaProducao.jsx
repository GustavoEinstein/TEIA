import React, { useState, useEffect } from "react"
import api from "../services/api"
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import {
  ArrowLeft,
  Clock,
  Bot,
  BookOpen,
  Wrench,
  Package,
  Lightbulb,
  Target,
  Download,
  FileText,
  User,
  ExternalLink,
  Printer,
  Loader2,
  X,
} from "lucide-react"

const API_BASE_URL = "http://localhost:8000"

const VisualizarMinhaProducao = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext()
  const isMobile = context ? context.isMobile : false

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  // Estados para o Modal de Exportação do PDF
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [docenteName, setDocenteName] = useState("")

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`api/production/${id}/`)
        setData(response.data)
        if (response.data.autor) setDocenteName(response.data.autor)
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetails()
  }, [id])

  // Lógica de download do PDF com o nome do docente informado no Modal
  const handleConfirmExportPDF = async () => {
    if (!docenteName.trim()) {
      alert("Por favor, preencha o nome do(a) docente.")
      return
    }

    setDownloadingPDF(true)
    setIsModalOpen(false)

    try {
      const response = await api.get(
        `api/production/${id}/export-pdf/?docente=${encodeURIComponent(docenteName)}`,
        { responseType: "blob" }
      )

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `plano_de_aula_${id}_IFB.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Não foi possível gerar o Plano de Aula em PDF.")
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (loading)
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Carregando detalhes...
      </div>
    )
  if (!data) return null

  // Cálculo dos status da produção
  const statusLower = data.status ? data.status.toLowerCase() : ""
  const isApproved =
    statusLower.includes("aprovado") ||
    statusLower.includes("publicado") ||
    statusLower.includes("concluído")
  const isRejected =
    statusLower.includes("rejeitado") || statusLower.includes("correção")
  const isPending = !isApproved && !isRejected

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={18} /> Voltar
        </button>

        <div
          style={{ ...styles.grid, flexDirection: isMobile ? "column" : "row" }}
        >
          {/* ================= COLUNA PRINCIPAL DA ESQUERDA ================= */}
          <div style={styles.columnContent}>
            <div style={styles.materialCard}>
              
              {/* Cabeçalho do Material com Badges e Título */}
              <div style={styles.headerSection}>
                <div>
                  <div style={styles.badgesRow}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: "var(--bg-info)",
                        color: "var(--text-info)",
                      }}
                    >
                      {data.disciplina}
                    </span>
                    <span style={styles.badgeNeutral}>
                      {data.nivel_ensino || data.nivel}
                    </span>
                  </div>
                  <h1 style={styles.title}>{data.titulo}</h1>
                </div>
                <div style={styles.metaRow}>
                  <div style={styles.iaTag}>
                    <Bot size={14} />{" "}
                    {data.modelo_ia || "Nenhum modelo informado"}
                  </div>
                  <span style={styles.dateText}>
                    <User size={14} /> Autor: {data.autor || "Você"}
                  </span>
                </div>
              </div>

              {/* Ficha Técnica (Metodologia, Duração, Recursos) */}
              <div style={styles.techSheet}>
                <div style={styles.techItem}>
                  <div style={styles.iconCircle}>
                    <Wrench size={18} color="var(--text-info)" />
                  </div>
                  <div>
                    <span style={styles.techLabel}>Metodologia</span>
                    <span style={styles.techValue}>
                      {data.metodologia || "-"}
                    </span>
                  </div>
                </div>
                <div style={styles.techItem}>
                  <div style={styles.iconCircle}>
                    <Clock size={18} color="var(--text-info)" />
                  </div>
                  <div>
                    <span style={styles.techLabel}>Duração</span>
                    <span style={styles.techValue}>{data.duracao || "-"}</span>
                  </div>
                </div>
                <div style={styles.techItem}>
                  <div style={styles.iconCircle}>
                    <Package size={18} color="var(--text-info)" />
                  </div>
                  <div>
                    <span style={styles.techLabel}>Recursos</span>
                    <span style={styles.techValue}>
                      {Array.isArray(data.recursos)
                        ? data.recursos.join(", ")
                        : data.recursos || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 1: BNCC */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <BookOpen size={18} /> Intencionalidade (BNCC)
                </h3>
                <div style={styles.bnccBox}>
                  <p style={styles.bnccText}>{data.bncc || "Não informado."}</p>
                </div>
              </div>

              {/* Seção 2: Relato de Experiência */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <Lightbulb size={18} /> Relato de Experiência
                </h3>
                <p style={styles.textBody}>
                  {data.experiencia || data.relato || "Não informado."}
                </p>
              </div>

              {/* Seção 3: Resultados */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <Target size={18} /> Resultados
                </h3>
                <div style={styles.resultsBox}>
                  {data.resultados || "Sem resultados registrados."}
                </div>
              </div>

            </div>
          </div>

          {/* ================= COLUNA DA DIREITA (SIDEBAR) ================= */}
          <div style={styles.columnSidebar}>
            
            {/* 1. Status da Avaliação */}
            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarTitle}>Status da Avaliação</h3>
              {isPending && (
                <div style={styles.statusBoxPending}>
                  <span style={styles.statusTitlePending}>
                    AGUARDANDO VALIDAÇÃO
                  </span>
                  <p style={styles.statusDesc}>
                    Sua prática está na fila e será avaliada por colegas.
                  </p>
                </div>
              )}
              {isApproved && (
                <div style={styles.statusBoxApproved}>
                  <span style={styles.statusTitleApproved}>PUBLICADA!</span>
                  <p style={styles.statusDesc}>
                    Prática validada e disponível na comunidade.
                  </p>
                </div>
              )}
              {isRejected && (
                <div style={styles.statusBoxRejected}>
                  <span style={styles.statusTitleRejected}>
                    AJUSTES NECESSÁRIOS
                  </span>
                  <p style={styles.statusDesc}>
                    Sua prática precisa de correções antes de ser publicada.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Exportação de Plano de Aula em PDF */}
            <div style={{ ...styles.sidebarCard, marginTop: "20px" }}>
              <h3 style={styles.sidebarTitle}>
                <Printer
                  size={16}
                  style={{ marginRight: "6px", verticalAlign: "bottom" }}
                />
                Plano de Aula (IFB / MEC)
              </h3>
              <p style={styles.statusDesc}>
                Gere o documento oficial padronizado no formato de Plano de Aula para registro pedagógico.
              </p>
              <div style={{ ...styles.buttonsSidebarContainer, marginTop: "12px" }}>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={downloadingPDF}
                  style={{
                    ...styles.btnExportGdfSidebar,
                    opacity: downloadingPDF ? 0.7 : 1,
                    cursor: downloadingPDF ? "not-allowed" : "pointer",
                  }}
                >
                  {downloadingPDF ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileText size={18} /> Baixar Plano de Aula (PDF)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Botões de Material de Apoio (Anexo e Link Externo) */}
            {(data.arquivo || data.link_material) && (
              <div style={{ ...styles.sidebarCard, marginTop: "20px" }}>
                <h3 style={styles.sidebarTitle}>
                  <FileText
                    size={16}
                    style={{ marginRight: "6px", verticalAlign: "bottom" }}
                  />
                  Material de Apoio
                </h3>
                <div style={styles.buttonsSidebarContainer}>
                  {data.arquivo && (
                    <a
                      href={
                        data.arquivo.startsWith("http")
                          ? data.arquivo
                          : `${API_BASE_URL}${data.arquivo}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.btnDownloadSidebar}
                    >
                      <Download size={18} /> Baixar Arquivo Anexo
                    </a>
                  )}
                  {data.link_material && (
                    <a
                      href={data.link_material}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.btnExternalSidebar}
                    >
                      <ExternalLink size={18} /> Acessar Link Externo
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ================= MODAL SOLICITANDO O NOME DO DOCENTE ================= */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                Exportar Plano de Aula
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ marginTop: "15px" }}>
              <label style={styles.labelInput}>
                Nome do(a) Docente / Professor(a):
              </label>
              <input
                type="text"
                value={docenteName}
                onChange={(e) => setDocenteName(e.target.value)}
                placeholder="Ex: Prof. Gustavo Einstein"
                style={styles.inputStyle}
                autoFocus
              />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.4" }}>
                Este nome será inserido diretamente no cabeçalho do documento oficial de Plano de Aula.
              </p>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.btnCancel}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExportPDF}
                style={styles.btnConfirm}
              >
                Confirmar e Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  fullPageWrapper: {
    backgroundColor: "var(--bg-main)",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    paddingTop: "20px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 20px 40px 20px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: "700",
    marginBottom: "15px",
  },
  grid: { display: "flex", gap: "20px", alignItems: "flex-start" },
  columnContent: { flex: 1, minWidth: "0" },
  columnSidebar: {
    width: "300px",
    minWidth: "300px",
    position: "sticky",
    top: "20px",
  },

  materialCard: {
    backgroundColor: "var(--bg-card)",
    borderRadius: "12px",
    padding: "35px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    border: "1px solid var(--border-color)",
  },
  headerSection: { marginBottom: "25px" },
  badgesRow: { display: "flex", gap: "8px", marginBottom: "8px" },
  badge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  badgeNeutral: {
    backgroundColor: "var(--bg-main)",
    color: "var(--text-secondary)",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: 0,
    lineHeight: "1.2",
    wordBreak: "break-word",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "12px",
  },
  iaTag: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-main)",
    padding: "4px 8px",
    borderRadius: "6px",
    fontWeight: "600",
  },
  dateText: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },

  techSheet: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
    padding: "15px",
    backgroundColor: "var(--bg-main)",
    borderRadius: "8px",
  },
  techItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  iconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  techLabel: {
    display: "block",
    fontSize: "10px",
    textTransform: "uppercase",
    fontWeight: "800",
    color: "var(--text-muted)",
    marginBottom: "2px",
  },
  techValue: {
    fontSize: "13px",
    color: "var(--text-primary)",
    fontWeight: "600",
    wordBreak: "break-word",
  },

  section: { marginBottom: "30px" },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "var(--text-primary)",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  bnccBox: {
    backgroundColor: "var(--bg-warning)",
    borderLeft: "4px solid var(--border-warning)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "30px",
  },
  bnccText: {
    margin: 0,
    fontSize: "15px",
    color: "var(--text-primary)",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  textBody: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "var(--text-secondary)",
    whiteSpace: "pre-wrap",
  },
  resultsBox: {
    backgroundColor: "var(--bg-success)",
    border: "1px solid var(--border-success)",
    padding: "15px",
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontStyle: "italic",
    whiteSpace: "pre-wrap",
  },

  sidebarCard: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "20px",
  },
  sidebarTitle: {
    margin: "0 0 15px 0",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "800",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "8px",
  },

  statusBoxApproved: {
    padding: "15px",
    backgroundColor: "var(--bg-success)",
    borderRadius: "8px",
    border: "1px solid var(--border-success)",
  },
  statusTitleApproved: {
    display: "block",
    fontSize: "14px",
    fontWeight: "900",
    color: "var(--text-success)",
  },
  statusBoxPending: {
    padding: "15px",
    backgroundColor: "var(--bg-warning)",
    borderRadius: "8px",
    border: "1px solid var(--border-warning)",
  },
  statusTitlePending: {
    display: "block",
    fontSize: "14px",
    fontWeight: "900",
    color: "var(--text-warning)",
  },
  statusBoxRejected: {
    padding: "15px",
    backgroundColor: "var(--bg-danger)",
    borderRadius: "8px",
    border: "1px solid var(--border-danger)",
  },
  statusTitleRejected: {
    fontSize: "13px",
    fontWeight: "900",
    color: "var(--text-danger)",
  },
  statusDesc: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    margin: "5px 0 0 0",
    lineHeight: "1.4",
  },

  buttonsSidebarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  btnExportGdfSidebar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#1b5e20", // Verde institucional IFB/MEC
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  btnDownloadSidebar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#1565C0",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  btnExternalSidebar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "var(--bg-main)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    padding: "12px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },

  /* MODAL */
modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)", // Escurece o fundo
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // Garante que fique sobre todos os elementos
  },
  modalContent: {
    backgroundColor: "var(--bg-card, #ffffff)", // Fallback para #ffffff evita transparência
    color: "var(--text-primary, #212121)",
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid var(--border-color, #e0e0e0)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color, #eee)",
    paddingBottom: "12px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary, #666)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  labelInput: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-primary, #333)",
    display: "block",
    marginBottom: "6px",
  },
  inputStyle: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-color, #ccc)",
    backgroundColor: "var(--bg-main, #f9f9f9)", // Fallback opaco para o campo de texto
    color: "var(--text-primary, #111)",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  btnCancel: {
    padding: "8px 16px",
    border: "1px solid var(--border-color, #ccc)",
    background: "transparent",
    color: "var(--text-secondary, #555)",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  btnConfirm: {
    padding: "8px 16px",
    border: "none",
    background: "#1b5e20",
    color: "#ffffff",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
  },
}

export default VisualizarMinhaProducao