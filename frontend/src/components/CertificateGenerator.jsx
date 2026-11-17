import React, { useState, useCallback } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import {
  X,
  Download,
  Loader2,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

/**
 * Componente para gerar certificados de conclusão T.E.I.A
 * - Usa template JPG: /certificados/certificado_TEIA.jpg
 * - Embute JPG como background no PDF via pdf-lib
 * - Desenha nome do professor centralizado e data na base
 * - Download automático
 */
const CertificateGenerator = ({ isOpen, onClose, onSuccess }) => {
  const [professorName, setProfessorName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null)

  const generateCertificate = useCallback(async () => {
    const name = professorName.trim()
    if (!name) {
      setError("Digite o nome do professor.")
      return
    }
    if (name.length < 3) {
      setError("Nome muito curto.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // 1. Carregar template JPG
      let jpgArrayBuffer
      try {
        const response = await fetch("/certificados/certificado_TEIA.jpg")
        if (!response.ok) throw new Error("Template não encontrado")
        jpgArrayBuffer = await response.arrayBuffer()
      } catch (e) {
        console.error("Erro ao carregar template JPG:", e)
        setError("Erro ao carregar template do certificado.")
        setLoading(false)
        return
      }

      // 2. Criar PDF com pdf-lib mantendo as dimensões do A4 Landscape
      const pdfDoc = await PDFDocument.create()
      const pageWidth = 1123
      const pageHeight = 794
      const page = pdfDoc.addPage([pageWidth, pageHeight])

      const jpgImage = await pdfDoc.embedJpg(jpgArrayBuffer)
      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      })

      // 3. Embutir fontes (Times combina com o título serifado do certificado)
      const fontName = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      const fontDate = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

      const darkBlue = rgb(0.05, 0.16, 0.24)
      const darkGray = rgb(0.25, 0.25, 0.25)

      // 4. Calcular largura exata e centralizar o NOME DO PROFESSOR
      const upperName = name.toUpperCase()
      let nameFontSize = 32
      const maxTextWidth = 680 // Limite seguro acima da linha divisória

      let nameWidth = fontName.widthOfTextAtSize(upperName, nameFontSize)
      while (nameWidth > maxTextWidth && nameFontSize > 16) {
        nameFontSize -= 1
        nameWidth = fontName.widthOfTextAtSize(upperName, nameFontSize)
      }

      const nameX = (pageWidth - nameWidth) / 2
      const nameY = 382 // Logo acima da linha divisória central

      page.drawText(upperName, {
        x: nameX,
        y: nameY,
        size: nameFontSize,
        font: fontName,
        color: darkBlue,
      })

      // 5. Calcular largura exata e centralizar a DATA ATUAL na base
      const now = new Date()
      const months = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ]
      const dateStr = `Brasília, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
      const dateFontSize = 14
      const dateWidth = fontDate.widthOfTextAtSize(dateStr, dateFontSize)

      const dateX = (pageWidth - dateWidth) / 2
      const dateY = 115 // No topo da "montanha" central (mude para 65 se quiser dentro do desenho)

      page.drawText(dateStr, {
        x: dateX,
        y: dateY,
        size: dateFontSize,
        font: fontDate,
        color: darkGray,
      })

      // 6. Gerar bytes do PDF e disparar download
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setGeneratedPdfBlob(blob)

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const fileName = `certificado_${name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")}.pdf`
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess(true)
      setLoading(false)
      onSuccess?.(name)
    } catch (err) {
      console.error("Erro ao gerar certificado:", err)
      setError("Erro ao gerar certificado. Tente novamente.")
      setLoading(false)
    }
  }, [professorName, onSuccess])

  const handleDownload = () => {
    if (generatedPdfBlob) {
      const url = URL.createObjectURL(generatedPdfBlob)
      const link = document.createElement("a")
      const name = professorName.trim()
      const fileName = `certificado_${name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")}.pdf`
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const reset = () => {
    setProfessorName("")
    setError("")
    setSuccess(false)
    setGeneratedPdfBlob(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={() => {
        reset()
        onClose()
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            reset()
            onClose()
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors bg-transparent border-none"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {!success ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Gerar Certificado
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Digite o nome do professor para emitir o certificado de
                conclusão da formação T.E.I.A.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Nome do Professor
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !loading && generateCertificate()
                  }
                  placeholder="Ex: Maria da Silva"
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1565C0] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white placeholder-slate-400 disabled:opacity-50"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-right">
                Será impresso em maiúsculas no certificado
              </p>
            </div>

            <button
              onClick={generateCertificate}
              disabled={loading || !professorName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Gerar e Baixar Certificado
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
              O certificado será baixado automaticamente como{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                certificado_NomeDoProfessor.pdf
              </code>
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle
                size={36}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <h3 className="font-bold text-green-800 dark:text-green-300 text-lg mb-2">
              Certificado gerado com sucesso!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              O PDF de{" "}
              <strong className="text-slate-900 dark:text-white">
                {professorName}
              </strong>{" "}
              foi baixado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                <Download size={16} /> Baixar novamente
              </button>
              <button
                onClick={() => {
                  reset()
                  onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                <X size={16} /> Fechar
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
              Entregue o arquivo via WhatsApp ou e-mail ao professor.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CertificateGenerator
