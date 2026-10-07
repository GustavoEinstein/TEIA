import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, Scale, ShieldCheck, Cpu, ScrollText, UserCheck,
  BookOpen, Lock, Award, AlertTriangle, FileText, ExternalLink, Mail
} from "lucide-react"

export default function TermosDeUso() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("preambulo")
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
    { id: "preambulo", title: "Preâmbulo e Aceitação", icon: <ScrollText size={16} /> },
    { id: "natureza", title: "1. Natureza do Serviço", icon: <BookOpen size={16} /> },
    { id: "conta", title: "2. Conta e Segurança", icon: <Lock size={16} /> },
    { id: "direitos", title: "3. Direitos Autorais", icon: <Scale size={16} /> },
    { id: "ia", title: "4. IA e Autoria", icon: <Cpu size={16} /> },
    { id: "licenciamento", title: "5. Licenciamento e Releituras", icon: <ScrollText size={16} /> },
    { id: "revisao", title: "6. Revisão Duplo-Cego", icon: <ShieldCheck size={16} /> },
    { id: "conduta", title: "7. Código de Conduta", icon: <AlertTriangle size={16} /> },
    { id: "gamificacao", title: "8. XP e Gamificação", icon: <Award size={16} /> },
    { id: "responsabilidade", title: "9. Responsabilidade", icon: <ShieldCheck size={16} /> },
    { id: "privacidade", title: "10. Privacidade e LGPD", icon: <UserCheck size={16} /> },
    { id: "pesquisa", title: "11. Pesquisa Acadêmica", icon: <FileText size={16} /> },
    { id: "geral", title: "12. Disposições Gerais", icon: <ScrollText size={16} /> },
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
              T.E.I.A. • Termos de Serviço
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
              Versão 4.0 — Última atualização: Outubro de 2026
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[1300px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-10 items-start">
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <aside className="hidden md:block w-[320px] shrink-0 sticky top-28">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm max-h-[80vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              Sumário Jurídico
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
        </aside>

        {/* CONTEÚDO */}
        <main className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-14 shadow-sm">
          <div className="mb-16 border-b border-slate-200 dark:border-slate-800 pb-10">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Contrato de Termos de Serviço e Acordo de Propriedade Intelectual
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Estes Termos de Serviço ("Termos") constituem um acordo legalmente vinculativo entre você ("Usuário", "Professor") e a{" "}
              <strong>Universidade de Brasília (UnB)</strong>, por meio do projeto T.E.I.A. (Tecendo a Educação com Inteligência Artificial), doravante denominado "T.E.I.A." ou "Plataforma". Leia atentamente cada cláusula abaixo.
            </p>
          </div>

          <div className="space-y-16 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* PREÂMBULO */}
            <section id="preambulo" ref={registerRef("preambulo")} className="scroll-mt-24">
              <h3 className="text-xs font-black text-[#1565C0] dark:text-blue-400 uppercase tracking-widest mb-2">
                Disposição Inicial
              </h3>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                Aceitação dos Termos
              </h2>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 mb-4">
                <p className="font-black text-amber-800 dark:text-amber-300 mb-1 uppercase text-xs tracking-wider">
                  Manifestação de Vontade
                </p>
                <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
                  Ao marcar a caixa de seleção no cadastro e clicar em "Criar Conta", você declara que leu,
                  compreendeu e concorda com estes Termos e com a{" "}
                  <a href="/privacidade" className="underline font-semibold">
                    Política de Privacidade
                  </a>
                  . O consentimento é livre, informado e inequívoco, nos termos do Art. 8º da LGPD.
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <strong>Controlador de Dados:</strong> Universidade de Brasília (UnB), por meio do projeto T.E.I.A.
                <br />
                <strong>Encarregado de Proteção de Dados (DPO):</strong> Prof. Edison Ishikawa (
                <a href="mailto:ishikawa@unb.br" className="underline text-[#1565C0]">
                  ishikawa@unb.br
                </a>)
                <br />
                <strong>Canal de Suporte e Denúncias:</strong>{" "}
                <a href="mailto:suporte.ianaeducacaobasica.unb@gmail.com" className="underline text-[#1565C0]">
                  suporte.ianaeducacaobasica.unb@gmail.com
                </a>
              </p>
            </section>

            {/* CLÁUSULA 1 */}
            <section id="natureza" ref={registerRef("natureza")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <BookOpen className="text-[#1565C0] dark:text-blue-400" /> 1. Natureza e Escopo do Serviço
              </h2>
              <p className="mb-3">
                <strong>1.1. Definição Institucional:</strong> O T.E.I.A. é um repositório digital de caráter
                acadêmico, científico e cultural vinculado à Universidade de Brasília (UnB), voltado ao fomento de
                práticas educacionais inovadoras integradas à Inteligência Artificial.
              </p>
              <p className="mb-3">
                <strong>1.2. Gratuidade e Ausência de Lucro:</strong> Os serviços são prestados em caráter
                inteiramente gratuito aos profissionais da educação. Nenhuma transação financeira, cobrança de
                mensalidade ou taxação de direitos autorais é operada ou intermediada pela Plataforma.
              </p>
              <p>
                <strong>1.3. Papel de Provedor de Aplicação:</strong> Nos termos do Art. 5º, inciso VII, da Lei nº
                12.965/2014 (Marco Civil da Internet), a Plataforma atua como provedora de aplicação, fornecendo
                ambiente digital para armazenamento e circulação de conteúdos gerados de forma autônoma por seus
                usuários.
              </p>
            </section>

            {/* CLÁUSULA 2 */}
            <section id="conta" ref={registerRef("conta")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Lock className="text-indigo-600 dark:text-indigo-400" /> 2. Conta, Cadastro e Segurança
              </h2>
              <p className="mb-3">
                <strong>2.1. Requisitos de Cadastro:</strong> O cadastro é restrito a maiores de 18 anos,
                profissionais da educação. O Usuário deve fornecer dados verídicos, incluindo nome completo, e-mail
                institucional ou pessoal válido, disciplina de atuação e instituição de ensino.
              </p>
              <p className="mb-3">
                <strong>2.2. Guarda de Credenciais:</strong> A senha é pessoal e intransferível. O Usuário é
                responsável por todas as operações realizadas em sua conta, eximindo a Plataforma de prejuízos
                decorrentes de invasões causadas por negligência na guarda de senhas.
              </p>
              <p>
                <strong>2.3. Suspensão e Cancelamento:</strong> A Plataforma poderá suspender ou cancelar contas que
                violem estes Termos, apresentem comportamento fraudulento no sistema de XP ou permaneçam inativas
                por mais de 12 meses. Em casos de banimento, o Usuário será previamente notificado e terá direito de
                contestar, salvo em situações de fraude comprovada ou risco iminente a terceiros.
              </p>
            </section>

            {/* CLÁUSULA 3 */}
            <section id="direitos" ref={registerRef("direitos")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Scale className="text-amber-600 dark:text-amber-500" /> 3. Direitos Autorais e Titularidade
              </h2>
              <p className="mb-3">
                <strong>3.1. Titularidade do Professor:</strong> Conforme os Arts. 11 e 22 da Lei de Direitos
                Autorais (LDA - nº 9.610/98), pertencem exclusivamente ao Professor criador os direitos morais e
                patrimoniais sobre as produções didáticas, planos de aula e roteiros submetidos à Plataforma.
              </p>
              <p className="mb-3">
                <strong>3.2. Domínio das Ideias e Métodos:</strong> Nos termos do Art. 8º da LDA, ideias, métodos
                operacionais e metodologias pedagógicas gerais não são protegidos por direitos autorais. O
                compartilhamento na Plataforma franqueia o estudo e a aplicação metodológica por outros docentes,
                sem configurar violação patrimonial.
              </p>
              <p className="mb-3">
                <strong>3.3. Duplo-Cego e Anonimato Público:</strong> O sistema de revisão duplo-cego (Cláusula 6)
                oculta a identidade do autor e do revisor durante o processo de avaliação. O anonimato público
                ("Manter Anônimo") é uma escolha autônoma do autor para exibir sua produção sem seu nome no acervo
                público. Em ambos os casos, o vínculo de autoria é preservado internamente no banco de dados para
                fins de auditoria e gamificação.
              </p>
              <p>
                <strong>3.4. Garantia de Titularidade:</strong> Ao submeter qualquer conteúdo (texto, imagem, áudio,
                vídeo), o Usuário declara ser o autor ou ter obtido todas as autorizações necessárias de terceiros.
                O Usuário responsabiliza-se integralmente por eventuais reclamações de violação de direitos
                autorais, obrigando-se a indenizar a Plataforma por perdas e danos.
              </p>
            </section>

            {/* CLÁUSULA 4 */}
            <section id="ia" ref={registerRef("ia")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Cpu className="text-purple-600 dark:text-purple-400" /> 4. Inteligência Artificial e Autoria
              </h2>
              <p className="mb-3">
                <strong>4.1. Autoria Humana:</strong> A legislação brasileira (Art. 11 da LDA) reconhece como autor
                apenas a pessoa física criadora de obra intelectual. Sistemas de Inteligência Artificial não são
                titulares de direitos autorais.
              </p>
              <p className="mb-3">
                <strong>4.2. O Professor como Diretor Intelectual:</strong> O uso de IAs generativas (ChatGPT,
                Gemini, Claude, etc.) para estruturar um roteiro didático assemelha-se à figura de um assistente
                téico. A força intelectual criativa é do instrutor humano responsável pela formulação dos comandos
                (*prompts*) e pela validação crítica do resultado.
              </p>
              <p>
                <strong>4.3. Responsabilidade e Limitações:</strong> Ao submeter material gerado com auxílio de IA, o
                Usuário certifica que exerceu juízo crítico ativo, assumindo integralmente a responsabilidade por
                eventuais incorreções, vieses ou alucinações. A Plataforma não garante que conteúdos gerados por IA
                sejam protegidos por direitos autorais, na medida em que haja criação intelectual humana protegida.
                O Usuário deve respeitar os termos de uso das ferramentas de IA utilizadas.
              </p>
            </section>

            {/* CLÁUSULA 5 */}
            <section id="licenciamento" ref={registerRef("licenciamento")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <ScrollText className="text-emerald-600 dark:text-emerald-400" /> 5. Licenciamento e Obras
                Derivadas ("Releituras")
              </h2>
              <p className="mb-3">
                <strong>5.1. Licença Não Exclusiva e Revogável:</strong> Ao publicar uma produção no Acervo Público,
                o Usuário concede à Plataforma e aos demais membros da comunidade uma licença gratuita, não
                exclusiva, por prazo indeterminado, para visualizar, armazenar, baixar e utilizar o material para
                fins exclusivamente pedagógicos e não comerciais. Esta licença é revogável mediante exclusão da
                conta, ressalvadas as releituras já publicadas.
              </p>
              <p className="mb-3">
                <strong>5.2. Obras Derivadas (Releituras):</strong> O Usuário autoriza expressamente que outros
                professores criem "Releituras" (obras derivadas, conforme Art. 5º, VIII, "g" da LDA) a partir de seu
                material original, adaptando-o para diferentes realidades de ensino. A Plataforma adota como padrão
                a licença{" "}
                <a
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1565C0]"
                >
                  Creative Commons CC BY-NC-SA 4.0
                </a>
                , que permite adaptações com atribuição e uso não comercial.
              </p>
              <p>
                <strong>5.3. Cadeia de Atribuição:</strong> Sempre que uma Releitura for publicada, o sistema
                vinculará de forma perpétua a referência à obra originária, assegurando o reconhecimento moral da
                fonte criadora.
              </p>
            </section>

            {/* CLÁUSULA 6 */}
            <section id="revisao" ref={registerRef("revisao")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="text-teal-600 dark:text-teal-400" /> 6. Sistema de Revisão Duplo-Cego
              </h2>
              <p className="mb-3">
                <strong>6.1. Metodologia:</strong> As produções submetidas passam por crivo cego, onde avaliadores
                pares analisam critérios pedagógicos, de inclusão e alinhamento com a BNCC sem conhecer a identidade
                do autor.
              </p>
              <p className="mb-3">
                <strong>6.2. Ausência de Coautoria:</strong> Os pareceres configuram opinião técnica. Nenhum revisor
                adquire direitos de coautoria sobre a obra avaliada em razão de sua intervenção revisional.
              </p>
              <p>
                <strong>6.3. Isenção e Limitações:</strong> A aprovação por dois revisores confere o selo "Material
                Validado", mas não transfere à Plataforma responsabilidade jurídica sobre a execução da aula em
                instituições externas. O anonimato do revisor pode ser levantado por ordem judicial, nos termos do
                Art. 22 do Marco Civil da Internet.
              </p>
            </section>

            {/* CLÁUSULA 7 */}
            <section id="conduta" ref={registerRef("conduta")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <AlertTriangle className="text-red-600 dark:text-red-400" /> 7. Código de Conduta
              </h2>
              <p className="mb-3">O Usuário compromete-se a abster-se de:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  Publicar conteúdos que violem legislações brasileiras, incluindo difamação, calúnia, apologia a
                  crimes ou discriminação;
                </li>
                <li>
                  Violar direitos autorais de terceiros, como apostilas comerciais, artigos científicos ou imagens
                  sem licença. O uso educacional não é exceção geral; apenas pequenos trechos com citação (Art. 46,
                  VIII da LDA) são permitidos;
                </li>
                <li>
                  Enviar dados de alunos (nomes, fotos, trabalhos) sem anonimização prévia, especialmente de menores
                  de idade (Art. 14 da LGPD);
                </li>
                <li>
                  Utilizar métodos automatizados, robôs ou scripts de extração (*scraping*) para coletar dados de
                  outros usuários;
                </li>
                <li>
                  Fraudar o sistema de gamificação através de conluios maliciosos para manipulação do Hall da Fama.
                </li>
              </ul>
              <p>
                A violação ensejará exclusão imediata do material, revogação do XP e banimento definitivo da conta,
                garantido o direito de contestação prévia, salvo em casos de fraude comprovada.
              </p>
            </section>

            {/* CLÁUSULA 8 */}
            <section id="gamificacao" ref={registerRef("gamificacao")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Award className="text-amber-500" /> 8. Sistema de XP e Gamificação
              </h2>
              <p className="mb-3">
                <strong>8.1. Natureza Simbólica:</strong> O sistema de pontos (XP), títulos e medalhas possui
                caráter estritamente lúdico, acadêmico e honorífico.
              </p>
              <p>
                <strong>8.2. Inconversibilidade:</strong> Os pontos não constituem ativos financeiros, não possuem
                valor monetário e não podem ser convertidos em dinheiro ou vantagens comerciais.
              </p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                <strong>Hall da Fama:</strong> A exibição do nome no ranking é opcional. O Usuário pode optar por um
                pseudônimo ou solicitar a exclusão do ranking a qualquer momento.
              </p>
            </section>

            {/* CLÁUSULA 9 */}
            <section id="responsabilidade" ref={registerRef("responsabilidade")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="text-blue-600 dark:text-blue-400" /> 9. Isenção e Limitação de
                Responsabilidade
              </h2>
              <p className="mb-3">
                <strong>9.1. Fornecimento "No Estado em que se Encontra":</strong> O Serviço é disponibilizado sem
                garantias de qualquer espécie, incluindo adequação a expectativas pedagógicas específicas.
              </p>
              <p className="mb-3">
                <strong>9.2. Responsabilidade por Conteúdos de Terceiros:</strong> A Plataforma não realiza edição
                prévia ou censura ativa dos conteúdos gerados por usuários. Contudo, atuará diligentemente para
                remover conteúdos ilícitos assim que tomar conhecimento, seja por ordem judicial ou por notificação
                extrajudicial fundamentada, conforme o Art. 21 do Marco Civil da Internet e a jurisprudência do STF
                (Temas 533 e 987). O procedimento de notificação e remoção observará os seguintes passos:
                (i) recebimento da denúncia via canal dedicado; (ii) análise de plausibilidade em até 48h; (iii)
                remoção cautelar, se cabível; (iv) notificação ao autor para contestação em até 5 dias; (v) decisão
                final fundamentada.
              </p>
              <p>
                <strong>9.3. Limitação de Responsabilidade:</strong> Na máxima extensão permitida pela lei, a
                responsabilidade civil da Plataforma e de seus mantenedores fica limitada a danos diretos
                comprovadamente causados por dolo ou culpa grave, excluídas perdas indiretas, lucros cessantes ou
                danos morais decorrentes de conteúdos de terceiros. Esta cláusula não exclui a responsabilidade por
                danos de proteção de dados (LGPD, Art. 42), nem por dolo ou culpa grave.
              </p>
            </section>

            {/* CLÁUSULA 10 */}
            <section id="privacidade" ref={registerRef("privacidade")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <UserCheck className="text-emerald-600 dark:text-emerald-500" /> 10. Privacidade e Proteção de
                Dados (LGPD)
              </h2>
              <p className="mb-3">
                <strong>10.1. Base Legal e Finalidades:</strong> O tratamento de dados pessoais fundamenta-se nas
                seguintes bases legais (Art. 7º da LGPD): (i) execução de contrato (inciso V), para gestão da conta
                e operação do duplo-cego; (ii) legítimo interesse (inciso IX), para segurança e prevenção a fraudes;
                (iii) estudos por órgão de pesquisa (inciso IV), para análises acadêmicas anonimizadas.
              </p>
              <p className="mb-3">
                <strong>10.2. Dados Coletados:</strong> Nome completo, e-mail, disciplina, instituição de ensino,
                senha criptografada, logs de acesso (IP, data e hora) e cookies essenciais da plataforma.
              </p>
              <p className="mb-3">
                <strong>10.3. Compartilhamento e Operadores:</strong> Os dados poderão ser compartilhados com
                operadores de hospedagem em nuvem e serviços de e-mail, sempre sob contrato de confidencialidade.
                Transferências internacionais observarão o Art. 33 da LGPD. Não há venda ou cessão a terceiros para
                marketing.
              </p>
              <p className="mb-3">
                <strong>10.4. Direitos do Titular:</strong> O Usuário pode exercer os direitos previstos no Art. 18
                da LGPD (confirmação, acesso, correção, anonimização, portabilidade, eliminação) por meio do e-mail{" "}
                <a href="mailto:ishikawa@unb.br" className="underline text-[#1565C0]">
                  ishikawa@unb.br
                </a>
                . O prazo de resposta é de até 15 dias.
              </p>
              <p className="mb-3">
                <strong>10.5. Eliminação e Anonimização:</strong> O Usuário pode solicitar a exclusão da conta a
                qualquer momento. Seus dados pessoais diretos (nome, e-mail) serão eliminados. As produções
                públicas permanecerão no acervo, passando por processo de <strong>anonimização irreversível</strong>{" "}
                (Art. 12 da LGPD), dissociando definitivamente o nome e e-mail do conteúdo. Contudo, informações
                como escola, disciplina e relato de experiência podem permitir reidentificação indireta; nesses
                casos, a Plataforma empregará técnicas adicionais de supressão ou generalização.
              </p>
              <p className="mb-3">
                <strong>10.6. Segurança e Incidentes:</strong> A Plataforma adota medidas técnicas e
                administrativas (criptografia, controle de acesso, backups) para proteger os dados. Em caso de
                incidente de segurança relevante, comunicará os titulares e a ANPD, nos termos dos Arts. 46 e 48 da
                LGPD.
              </p>
            </section>

            {/* CLÁUSULA 11 */}
            <section id="pesquisa" ref={registerRef("pesquisa")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <FileText className="text-indigo-600 dark:text-indigo-400" /> 11. Pesquisa Acadêmica
              </h2>
              <p className="mb-3">
                <strong>11.1. Uso de Dados para Pesquisa:</strong> Dados agregados e anonimizados poderão ser
                utilizados em pesquisas acadêmicas vinculadas à UnB, mediante aprovação do Comitê de Ética em
                Pesquisa (CEP/Plataforma Brasil) e observância da Resolução CNS 510/2016.
              </p>
              <p>
                <strong>11.2. TCLE:</strong> Quando a pesquisa envolver dados identificáveis, será obtido
                Termo de Consentimento Livre e Esclarecido (TCLE) específico, ou justificada a dispensa pelo CEP.
              </p>
            </section>

            {/* CLÁUSULA 12 */}
            <section id="geral" ref={registerRef("geral")} className="scroll-mt-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <ScrollText className="text-slate-700 dark:text-slate-300" /> 12. Disposições Gerais
              </h2>
              <p className="mb-3">
                <strong>12.1. Alterações Contratuais:</strong> A Plataforma poderá modificar estes Termos mediante
                publicação de aviso na Plataforma e envio de e-mail com antecedência mínima de 30 dias para
                alterações que afetem dados pessoais. O uso continuado após as modificações implica aceitação.
              </p>
              <p className="mb-3">
                <strong>12.2. Legislação Aplicável:</strong> Este contrato rege-se pelas leis da República
                Federativa do Brasil.
              </p>
              <p>
                <strong>12.3. Foro Competente:</strong> Fica eleito o Foro da Comarca de Brasília, Distrito
                Federal, para dirimir quaisquer litígios.
              </p>
            </section>
          </div>

          {/* RODAPÉ COM CONTATOS */}
          <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              Dúvidas sobre nossas diretrizes jurídicas?
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Nossa equipe de suporte acadêmico e jurídico está à disposição.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:suporte.ianaeducacaobasica.unb@gmail.com"
                className="bg-[#1565C0] hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-sm no-underline flex items-center gap-2"
              >
                <Mail size={18}/> Entrar em Contato
              </a>
              <button
                onClick={() => navigate("/privacidade")}
                className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-8 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
              >
                <UserCheck size={18} /> Política de Privacidade
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}