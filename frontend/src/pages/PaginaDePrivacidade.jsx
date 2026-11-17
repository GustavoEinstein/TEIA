import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, ShieldCheck, UserCheck, Lock, Eye, Share2, Trash2,
  AlertTriangle, Baby, Cookie, RefreshCw, Scale, Mail, FileText,
  Database, Server, Clock, CheckCircle, BookOpen,
} from "lucide-react"

export default function PoliticaDePrivacidade() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("introducao")
  const sectionRefs = useRef({})

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // IntersectionObserver para atualizar a seção ativa ao rolar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const sections = [
    { id: "introducao", title: "Introdução", icon: <FileText size={16} /> },
    { id: "definicoes", title: "1. Definições", icon: <BookOpen size={16} /> },
    { id: "dados", title: "2. Dados Coletados", icon: <Database size={16} /> },
    { id: "finalidades", title: "3. Finalidades e Bases Legais", icon: <CheckCircle size={16} /> },
    { id: "compartilhamento", title: "4. Compartilhamento", icon: <Share2 size={16} /> },
    { id: "direitos", title: "5. Direitos do Titular", icon: <UserCheck size={16} /> },
    { id: "seguranca", title: "6. Segurança e Incidentes", icon: <ShieldCheck size={16} /> },
    { id: "retencao", title: "7. Retenção e Eliminação", icon: <Trash2 size={16} /> },
    { id: "menores", title: "8. Crianças e Adolescentes", icon: <Baby size={16} /> },
    { id: "cookies", title: "9. Cookies", icon: <Cookie size={16} /> },
    { id: "alteracoes", title: "10. Alterações", icon: <RefreshCw size={16} /> },
    { id: "foro", title: "11. Legislação e Foro", icon: <Scale size={16} /> },
  ]

  const scrollTo = (id) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const registerRef = (id) => (el) => {
    sectionRefs.current[id] = el
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 font-sans">
      {/* HEADER FIXO */}
      <header className="sticky top-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-[1300px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-[#1565C0] dark:text-slate-400 dark:hover:text-blue-400 transition-colors flex items-center gap-2 font-bold text-sm bg-transparent border-none"
              aria-label="Voltar para a página anterior"
            >
              <ArrowLeft size={18} /> Voltar
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <span className="hidden sm:block font-black text-slate-800 dark:text-slate-200 tracking-tight">
              T.E.I.A. • Política de Privacidade
            </span>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
            Versão 1.1 — Novembro de 2026
          </div>
        </div>
      </header>

      <div className="max-w-[1300px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-10 items-start">
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <aside className="hidden md:block w-[320px] shrink-0 sticky top-28">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm max-h-[80vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              Sumário
            </h3>
            <nav className="flex flex-col gap-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border-none ${
                    activeSection === sec.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400"
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  aria-current={activeSection === sec.id ? "location" : undefined}
                >
                  {sec.icon} <span className="line-clamp-1">{sec.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* CARD DE CONTATO DPO */}
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                Encarregado (DPO)
              </h4>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3">
              Para exercer seus direitos ou tirar dúvidas sobre seus dados pessoais:
            </p>
            <a
              href="mailto:ishikawa@unb.br"
              className="block text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              Prof. Edison Ishikawa
              <span className="block font-normal mt-0.5">ishikawa@unb.br</span>
            </a>
          </div>
        </aside>

        {/* CONTEÚDO */}
        <main className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-14 shadow-sm">
          <div className="mb-16 border-b border-slate-200 dark:border-slate-800 pb-10">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Política de Privacidade
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              A presente Política de Privacidade descreve como a{" "}
              <strong>Universidade de Brasília (UnB)</strong>, por meio do projeto{" "}
              <strong>T.E.I.A. (Tecendo a Educação com Inteligência Artificial)</strong>, coleta,
              usa, armazena, compartilha e protege os dados pessoais dos usuários da Plataforma,
              em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD —
              Lei nº 13.709/2018)</strong> e demais legislações aplicáveis.
            </p>
          </div>

          <div className="space-y-16 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* INTRODUÇÃO */}
            <section id="introducao" ref={registerRef("introducao")} className="scroll-mt-24">
              <h3 className="text-xs font-black text-[#1565C0] dark:text-blue-400 uppercase tracking-widest mb-2">
                Disposição Inicial
              </h3>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                Compromisso com a sua Privacidade
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800/50 mb-6">
                <p className="font-black text-blue-800 dark:text-blue-300 mb-1 uppercase text-xs tracking-wider">
                  Identificação do Controlador
                </p>
                <div className="text-sm text-blue-700/90 dark:text-blue-400/90 space-y-1">
                  <p>
                    <strong>Controlador:</strong> Universidade de Brasília (UnB) — Projeto T.E.I.A.
                  </p>
                  <p>
                    <strong>Endereço:</strong> Campus Darcy Ribeiro, Brasília/DF
                  </p>
                  <p>
                    <strong>Encarregado (DPO):</strong>{" "}
                    Prof. Edison Ishikawa (<a href="mailto:ishikawa@unb.br" className="underline font-semibold">
                      ishikawa@unb.br
                    </a>)
                  </p>
                  <p>
                    <strong>Canal de Comunicação/Suporte:</strong>{" "}
                    <a href="mailto:suporte.ianaeducacaobasica.unb@gmail.com" className="underline font-semibold">
                      suporte.ianaeducacaobasica.unb@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              <p>
                A sua privacidade é fundamental para nós. Esta Política explica, de forma clara e
                transparente, quais dados coletamos, por que coletamos, como os utilizamos e quais
                são os seus direitos como titular. Ao utilizar a Plataforma, você declara ter lido e
                compreendido esta Política.
              </p>
            </section>

            {/* CLÁUSULA 1 - DEFINIÇÕES */}
            <section id="definicoes" ref={registerRef("definicoes")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <FileText className="text-[#1565C0] dark:text-blue-400" /> 1. Definições
              </h2>
              <p className="mb-4">
                Para os fins desta Política, consideram-se as definições previstas no Art. 5º da LGPD:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Dado Pessoal:</strong> informação relacionada a pessoa natural
                    identificada ou identificável.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Dado Pessoal Sensível:</strong> dado sobre origem racial ou étnica,
                    convicção religiosa, opinião política, filiação a sindicato, saúde, vida
                    sexual, dado genético ou biométrico.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Titular:</strong> pessoa natural a quem se referem os dados pessoais.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Tratamento:</strong> toda operação realizada com dados pessoais
                    (coleta, armazenamento, uso, compartilhamento, exclusão, etc.).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Controlador:</strong> pessoa natural ou jurídica responsável pelas
                    decisões sobre o tratamento de dados pessoais.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Operador:</strong> pessoa natural ou jurídica que realiza o tratamento
                    de dados pessoais em nome do controlador.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#1565C0] mt-2"></span>
                  <span>
                    <strong>Encarregado (DPO):</strong> pessoa indicada pelo controlador para atuar
                    como canal de comunicação entre o controlador, os titulares e a ANPD.
                  </span>
                </li>
              </ul>
            </section>

            {/* CLÁUSULA 2 - DADOS COLETADOS */}
            <section id="dados" ref={registerRef("dados")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Database className="text-indigo-600 dark:text-indigo-400" /> 2. Dados Pessoais Coletados
              </h2>
              <p className="mb-4">
                A Plataforma coleta as seguintes categorias de dados pessoais:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Dados Coletados
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Momento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Identificação
                      </td>
                      <td className="px-4 py-3">Nome completo</td>
                      <td className="px-4 py-3 text-slate-500">Cadastro</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Contato
                      </td>
                      <td className="px-4 py-3">E-mail institucional ou pessoal</td>
                      <td className="px-4 py-3 text-slate-500">Cadastro</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Profissional
                      </td>
                      <td className="px-4 py-3">Disciplina de atuação, instituição de ensino</td>
                      <td className="px-4 py-3 text-slate-500">Cadastro</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Autenticação
                      </td>
                      <td className="px-4 py-3">Senha criptografada</td>
                      <td className="px-4 py-3 text-slate-500">Cadastro</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Acesso
                      </td>
                      <td className="px-4 py-3">Endereço IP, data e hora, logs de navegação</td>
                      <td className="px-4 py-3 text-slate-500">Durante o uso</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Preferências
                      </td>
                      <td className="px-4 py-3">Cookies essenciais de funcionalidade</td>
                      <td className="px-4 py-3 text-slate-500">Durante o uso</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        Conteúdo
                      </td>
                      <td className="px-4 py-3">
                        Produções didáticas, pareceres, posts no fórum
                      </td>
                      <td className="px-4 py-3 text-slate-500">Submissão</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">Importante:</strong> Não
                  são coletados dados pessoais sensíveis (origem racial, convicção religiosa,
                  saúde, etc.) dos usuários professores.
                </p>
              </div>
            </section>

            {/* CLÁUSULA 3 - FINALIDADES E BASES LEGAIS */}
            <section id="finalidades" ref={registerRef("finalidades")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" /> 3. Finalidades e
                Bases Legais do Tratamento
              </h2>
              <p className="mb-4">
                O tratamento de dados pessoais fundamenta-se nas seguintes bases legais (Art. 7º da
                LGPD) e finalidades:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Finalidade
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Base Legal
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Dados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="px-4 py-3">Criação e gestão da conta</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#1565C0] dark:text-blue-400">
                        Execução de contrato (V)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        Identificação, Contato, Profissional, Autenticação
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Revisão duplo-cego</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#1565C0] dark:text-blue-400">
                        Execução de contrato (V)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        Identificação, Contato
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">XP e gamificação</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#1565C0] dark:text-blue-400">
                        Execução de contrato (V)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Identificação</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Segurança e prevenção a fraudes</td>
                      <td className="px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-400">
                        Legítimo interesse (IX)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        Acesso, Autenticação
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Comunicação sobre alterações</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#1565C0] dark:text-blue-400">
                        Execução de contrato (V)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Contato</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Pesquisa acadêmica (anonimizada)</td>
                      <td className="px-4 py-3 text-xs font-bold text-purple-600 dark:text-purple-400">
                        Estudos por órgão de pesquisa (IV)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Dados anonimizados</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Melhoria dos serviços</td>
                      <td className="px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-400">
                        Legítimo interesse (IX)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        Preferências, Acesso
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Obrigações legais</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Obrigação legal (II)
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        Acesso, Autenticação
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* CLÁUSULA 4 - COMPARTILHAMENTO */}
            <section id="compartilhamento" ref={registerRef("compartilhamento")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Share2 className="text-teal-600 dark:text-teal-400" /> 4. Compartilhamento de Dados
              </h2>
              <p className="mb-4">Os dados pessoais poderão ser compartilhados com:</p>
              <ul className="space-y-3 mb-4">
                <li className="flex gap-3">
                  <Server className="shrink-0 text-teal-600 dark:text-teal-400 mt-1" size={18} />
                  <span>
                    <strong>Operadores de hospedagem em nuvem:</strong> serviços de infraestrutura
                    para armazenamento e processamento dos dados.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="shrink-0 text-teal-600 dark:text-teal-400 mt-1" size={18} />
                  <span>
                    <strong>Serviços de e-mail:</strong> para comunicação com os usuários.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Eye className="shrink-0 text-teal-600 dark:text-teal-400 mt-1" size={18} />
                  <span>
                    <strong>Ferramentas de análise:</strong> para monitoramento de desempenho e
                    segurança, sempre com dados agregados ou anonimizados.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Scale className="shrink-0 text-teal-600 dark:text-teal-400 mt-1" size={18} />
                  <span>
                    <strong>Autoridades competentes:</strong> mediante ordem judicial ou
                    requisição legal.
                  </span>
                </li>
              </ul>
              <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800/50">
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong className="font-black uppercase text-xs tracking-wider">
                    Compromisso:
                  </strong>{" "}
                  Não há venda, cessão ou aluguel de dados a terceiros para fins de marketing.
                </p>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Em caso de transferência internacional de dados (Art. 33 da LGPD), a Plataforma
                garantirá que o país de destino ofereça nível de proteção adequado ou que sejam
                adotadas salvaguardas contratuais específicas.
              </p>
            </section>

            {/* CLÁUSULA 5 - DIREITOS DO TITULAR */}
            <section id="direitos" ref={registerRef("direitos")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <UserCheck className="text-emerald-600 dark:text-emerald-500" /> 5. Direitos do
                Titular
              </h2>
              <p className="mb-4">
                O Titular pode exercer, a qualquer momento e gratuitamente, os seguintes direitos
                (Art. 18 da LGPD):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  "Confirmação da existência de tratamento",
                  "Acesso aos dados pessoais",
                  "Correção de dados incompletos ou desatualizados",
                  "Anonimização, bloqueio ou eliminação",
                  "Portabilidade dos dados",
                  "Eliminação de dados tratados com consentimento",
                  "Informação sobre compartilhamento",
                  "Revogação do consentimento",
                ].map((direito, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <CheckCircle
                      size={18}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{direito}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <p className="font-black text-blue-800 dark:text-blue-300 mb-1 uppercase text-xs tracking-wider">
                  Como exercer seus direitos
                </p>
                <p className="text-sm text-blue-700/90 dark:text-blue-400/90 mb-2">
                  Envie e-mail para o Encarregado de Proteção de Dados com a descrição do direito
                  que deseja exercer. O prazo de resposta é de até <strong>15 dias</strong>.
                </p>
                <a
                  href="mailto:ishikawa@unb.br"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300 hover:underline"
                >
                  <Mail size={16} /> ishikawa@unb.br
                </a>
              </div>
            </section>

            {/* CLÁUSULA 6 - SEGURANÇA */}
            <section id="seguranca" ref={registerRef("seguranca")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="text-blue-600 dark:text-blue-400" /> 6. Segurança e
                Incidentes
              </h2>
              <p className="mb-4">
                A Plataforma adota medidas técnicas e administrativas para proteger os dados pessoais
                de acessos não autorizados, destruição, perda, alteração ou qualquer forma de
                tratamento inadequado (Art. 46 da LGPD). As medidas implementadas incluem:
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  "Criptografia de senhas com bcrypt (custo 12) e dados em trânsito via TLS 1.2+",
                  "JWT com rotação de refresh token (30min access / 7 dias refresh) em cookie HttpOnly, Secure, SameSite=Strict",
                  "Proteção CSRF via Double Submit Cookie pattern",
                  "Rate limiting e throttling por endpoint (login, registro, IA, reset senha)",
                  "Proteção SSRF no WeasyPrint (validação de URLs, allowlist de domínios)",
                  "Mascaramento de PII em logs (e-mail, telefone, IP parcial)",
                  "Controle de acesso baseado em funções (RBAC) e princípio do menor privilégio",
                  "Backups criptografados diários com retenção de 30 dias e testes de restauração mensais",
                  "Monitoramento de logs, detecção de anomalias e alertas de segurança",
                  "Headers de segurança: CSP com nonces, HSTS, X-Frame-Options, Referrer-Policy",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Lock
                      size={16}
                      className="shrink-0 text-blue-600 dark:text-blue-400 mt-1"
                    />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
                  <strong className="font-black uppercase text-xs tracking-wider">
                    Comunicação de Incidentes:
                  </strong>{" "}
                  Em caso de incidente de segurança relevante, a Plataforma comunicará os titulares
                  afetados e a Autoridade Nacional de Proteção de Dados (ANPD), nos termos dos Arts.
                  46 e 48 da LGPD, no prazo legal e com descrição da natureza dos dados afetados,
                  medidas adotadas e orientações aos titulares.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800/50 mt-4">
                <p className="text-sm text-blue-700/90 dark:text-blue-400/90">
                  <strong className="font-black uppercase text-xs tracking-wider">
                    Avaliação de Legítimo Interesse (Art. 10 LGPD):
                  </strong>{" "}
                  O tratamento baseado em legítimo interesse (segurança, prevenção a fraudes, melhoria dos serviços)
                  foi submetido a teste de balanceamento (LIA - Legitimate Interest Assessment), considerando:
                  (i) finalidade legítima e específica; (ii) necessidade do tratamento; (iii) balanceamento com
                  direitos do titular; (iv) medidas de mitigação (anonimização, pseudonimização, minimização).
                </p>
              </div>
            </section>

            {/* CLÁUSULA 7 - RETENÇÃO E ELIMINAÇÃO */}
            <section id="retencao" ref={registerRef("retencao")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Clock className="text-rose-600 dark:text-rose-400" /> 7. Retenção e Eliminação de
                Dados
              </h2>
              <p className="mb-4">
                Os dados pessoais serão mantidos apenas pelo tempo necessário ao cumprimento das
                finalidades para as quais foram coletados, observando os prazos abaixo definidos com
                base na LGPD, Marco Civil da Internet e legislação aplicável:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Categoria de Dados
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Período de Retenção
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Fundamento Legal
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Ação Após Período
                    </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Dados de conta (nome, e-mail, disciplina, escola)</td>
                      <td className="px-4 py-3">Enquanto a conta estiver ativa + 30 dias após exclusão</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Art. 15 LGPD; Execução de contrato</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Eliminação / Anonimização</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Senha (hash bcrypt)</td>
                      <td className="px-4 py-3">Enquanto a conta estiver ativa</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Art. 15 LGPD; Segurança</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Eliminação imediata</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Logs de acesso (IP, timestamp, user-agent)</td>
                      <td className="px-4 py-3">6 (seis) meses</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Art. 15 Marco Civil da Internet</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Eliminação automática</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Registros de consentimento (LGPD Art. 8º)</td>
                      <td className="px-4 py-3">5 (cinco) anos após última interação</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Art. 8º LGPD; Obrigação legal</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Arquivamento seguro</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Produções didáticas (conteúdo)</td>
                      <td className="px-4 py-3">Indeterminado (acervo público)</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Legítimo interesse; Pesquisa</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Anonimização irreversível</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Avaliações e pareceres (duplo-cego)</td>
                      <td className="px-4 py-3">5 (cinco) anos</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Execução de contrato; Pesquisa</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Anonimização</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Fórum (tópicos, comentários)</td>
                      <td className="px-4 py-3">Enquanto a conta ativa + anonimização</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Legítimo interesse</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Anonimização do autor</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Dados de gamificação (XP, conquistas, histórico)</td>
                      <td className="px-4 py-3">Enquanto a conta ativa</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Execução de contrato</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Eliminação / Anonimização</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Backups criptografados</td>
                      <td className="px-4 py-3">30 (trinta) dias</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Segurança da informação</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Rotação automática</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase text-xs tracking-wider">
                  Eliminação e Anonimização
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  O Usuário pode solicitar a exclusão da conta a qualquer momento. Seus dados
                  pessoais diretos (nome, e-mail) serão <strong>eliminados</strong>. As produções
                  públicas permanecerão no acervo, passando por processo de{" "}
                  <strong>anonimização irreversível</strong> (Art. 12 da LGPD), dissociando
                  definitivamente o nome e e-mail do conteúdo.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Contudo, informações como escola, disciplina e relato de experiência podem
                  permitir reidentificação indireta; nesses casos, a Plataforma empregará técnicas
                  adicionais de supressão ou generalização.
                </p>
              </div>
            </section>

            {/* CLÁUSULA 8 - CRIANÇAS E ADOLESCENTES */}
            <section id="menores" ref={registerRef("menores")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Baby className="text-pink-600 dark:text-pink-400" /> 8. Dados de Crianças e
                Adolescentes
              </h2>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-5 rounded-xl border border-pink-200 dark:border-pink-800/50 mb-4">
                <p className="font-black text-pink-800 dark:text-pink-300 mb-1 uppercase text-xs tracking-wider">
                  Atenção Importante
                </p>
                <p className="text-sm text-pink-700/90 dark:text-pink-400/90">
                  A Plataforma é destinada exclusivamente a <strong>maiores de 18 anos</strong>,
                  profissionais da educação. É expressamente proibido o envio de dados de alunos
                  (nomes, fotos, trabalhos) sem anonimização prévia, especialmente de menores de
                  idade.
                </p>
              </div>
              <p className="mb-3">
                Caso o relato de experiência contenha dados de crianças ou adolescentes, o Usuário
                deve:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Anonimizar todos os dados antes do envio;</li>
                <li>
                  Obter consentimento específico e em destaque dos pais ou responsáveis legais (Art.
                  14 da LGPD), quando aplicável;
                </li>
                <li>
                  Garantir que o tratamento atenda ao <strong>melhor interesse do menor</strong>.
                </li>
              </ul>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                A Plataforma não coleta intencionalmente dados de crianças. Caso identifique
                tratamento irregular, adotará medidas imediatas para eliminação.
              </p>
            </section>

            {/* CLÁUSULA 9 - COOKIES */}
            <section id="cookies" ref={registerRef("cookies")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Cookie className="text-amber-600 dark:text-amber-500" /> 9. Cookies e Tecnologias Similares
              </h2>
              <p className="mb-4">
                Utilizamos cookies e tecnologias similares para garantir o funcionamento da Plataforma,
                entender como ela é usada e melhorar sua experiência. Conforme a LGPD e as diretrizes da ANPD,
                o consentimento para cookies não essenciais deve ser <strong>livre, informado, específico e
                inequívoco</strong>. Você pode gerenciar suas preferências a qualquer momento no banner de
                cookies ou em <strong>Perfil → Conta → Preferências de Privacidade</strong>.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Finalidade
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Cookies / Tecnologias
                      </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Duração
                    </th>
                      <th className="text-left px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        Consentimento
                    </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="bg-green-50 dark:bg-green-900/20">
                      <td className="px-4 py-3 font-bold text-green-800 dark:text-green-300">Essenciais</td>
                      <td className="px-4 py-3 text-green-700 dark:text-green-400">Autenticação, sessão, segurança (CSRF), preferências de idioma/tema</td>
                      <td className="px-4 py-3"><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">refresh_token, csrftoken, sessionid</code></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Sessão / 7 dias (refresh)</td>
                      <td className="px-4 py-3 text-center"><span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Não necessário (Art. 7º LGPD)</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-blue-800 dark:text-blue-300">Análise e Desempenho</td>
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400">Métricas de uso anonimizadas (páginas, tempo, erros) para melhoria contínua</td>
                      <td className="px-4 py-3"><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">_ga, _gid, teia_analytics (futuro)</code></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">Até 2 anos / Sessão</td>
                      <td className="px-4 py-3 text-center"><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">Opt-in (Art. 7º LGPD)</span></td>
                    </tr>
                    <tr className="bg-purple-50 dark:bg-purple-900/20">
                      <td className="px-4 py-3 font-bold text-purple-800 dark:text-purple-300">Comunicação e Novidades</td>
                      <td className="px-4 py-3 text-purple-700 dark:text-purple-400">Preferências de UI, notificações push, avisos da comunidade</td>
                      <td className="px-4 py-3"><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">teia_prefs, teia_notifs (futuro)</code></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">1 ano / Sessão</td>
                      <td className="px-4 py-3 text-center"><span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">Opt-in (Art. 7º LGPD)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
                  <strong className="font-black uppercase text-xs tracking-wider">
                    Importante:
                  </strong>{" "}
                  Não utilizamos cookies de rastreamento comportamental entre sites (third-party tracking),
                  fingerprinting, ou tecnologias para publicidade direcionada. Os logs de acesso (IP, timestamp)
                  são registrados estritamente para segurança, auditoria e cumprimento do Art. 15 do Marco Civil
                  da Internet, com retenção de 6 meses.
                </p>
              </div>
            </section>

            {/* CLÁUSULA 10 - ALTERAÇÕES */}
            <section id="alteracoes" ref={registerRef("alteracoes")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <RefreshCw className="text-slate-600 dark:text-slate-400" /> 10. Alterações nesta
                Política
              </h2>
              <p>
                Esta Política poderá ser atualizada a qualquer momento. Alterações substanciais que
                afetem a forma como tratamos seus dados pessoais serão comunicadas por e-mail com 
                antecedência mínima de <strong>30 dias</strong>. O uso continuado da Plataforma após as 
                modificações implica na ciência e aceitação da nova versão.
              </p>
            </section>

            {/* CLÁUSULA 11 - LEGISLAÇÃO E FORO */}
            <section id="foro" ref={registerRef("foro")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Scale className="text-slate-700 dark:text-slate-300" /> 11. Legislação Aplicável e
                Foro
              </h2>
              <p className="mb-3">
                Esta Política rege-se pelas leis da República Federativa do Brasil, em especial pela{" "}
                <strong>Lei nº 13.709/2018 (LGPD)</strong>, pelo{" "}
                <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e pela{" "}
                <strong>Lei de Direitos Autorais (Lei nº 9.610/1998)</strong>.
              </p>
              <p>
                Fica eleito o Foro da Comarca de Brasília, Distrito Federal, para dirimir quaisquer
                litígios decorrentes desta Política.
              </p>
            </section>
          </div>

          {/* RODAPÉ COM CONTATOS */}
          <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                    Encarregado de Proteção de Dados
                  </h4>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                  Para exercer seus direitos como titular:
                </p>
                <a
                  href="mailto:ishikawa@unb.br"
                  className="block text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  Prof. Edison Ishikawa
                  <span className="block font-normal mt-0.5">ishikawa@unb.br</span>
                </a>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest">
                    Canal de Suporte e Dúvidas
                  </h4>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                  Comunicação geral com a equipe do projeto:
                </p>
                <a
                  href="mailto:suporte.ianaeducacaobasica.unb@gmail.com"
                  className="text-sm font-bold text-blue-700 dark:text-blue-300 hover:underline break-all"
                >
                  suporte.ianaeducacaobasica.unb@gmail.com
                </a>
              </div>
            </div>

            <div className="text-center">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                Precisa de mais informações?
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Consulte também nossos Termos de Uso e Propriedade Intelectual.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate("/termos")}
                  className="bg-[#1565C0] hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-sm"
                >
                  Ver Termos de Uso
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}