import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowRight, BookOpen, Network, LockKeyhole, ChevronDown,
  Mail, MessageCircle, X, Menu, ShieldCheck, FileText
} from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"

// Ícone Oficial
const SpiderWebIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20" /> <path d="M2 12h20" /> <path d="M4.93 4.93l14.14 14.14" /> <path d="M19.07 4.93L4.93 19.07" />
    <path d="M12 7 L15.53 8.47 L17 12 L15.53 15.53 L12 17 L8.47 15.53 L7 12 L8.47 8.47 Z" />
    <path d="M12 3 L18.36 5.64 L21 12 L18.36 18.36 L12 21 L5.64 18.36 L3 12 L5.64 5.64 Z" />
  </svg>
)

const LandingPage = () => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const faqs = [
    { q: "O que é o T.E.I.A?", a: "O T.E.I.A é um espaço para professores compartilharem práticas, materiais e aprendizados sobre o uso consciente da tecnologia na educação." },
    { q: "Preciso entender de inteligência artificial?", a: "Não. A plataforma foi desenhada justamente para quem está começando. Nossas ferramentas e a comunidade auxiliam nas melhores práticas." },
    { q: "Quem pode revisar as atividades?", a: "Apenas professores da mesma área de conhecimento. O sistema duplo-cego garante a tecnicidade e a qualidade pedagógica da avaliação." },
    { q: "Meus materiais ficam públicos?", a: "Você escolhe o que compartilhar. Seus rascunhos permanecem privados até que você decida enviá-los para a comunidade." },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      
      {/* NAVBAR CLARA E MODERNA */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 transition-colors">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full">
              <SpiderWebIcon size={28} className="text-[#1565C0] dark:text-blue-400" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">T.E.I.A</span>
          </div>

          {/* Nav Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a href="#sobre" className="hover:text-[#1565C0] dark:hover:text-blue-400 transition-colors">Como funciona</a>
              <a href="#comunidade" className="hover:text-[#1565C0] dark:hover:text-blue-400 transition-colors">Para professores</a>
              <a href="#duvidas" className="hover:text-[#1565C0] dark:hover:text-blue-400 transition-colors">Dúvidas</a>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6">
              <ThemeToggle />
              <Link to="/login" className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-[#1565C0] transition-colors no-underline">Entrar</Link>
              <Link to="/register" className="flex items-center bg-[#1565C0] hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm no-underline">
                Criar conta
              </Link>
            </div>
          </div>

          {/* Nav Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-600 dark:text-slate-300 bg-transparent border-none">
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {mobileOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col px-6 py-4 shadow-lg">
            <a href="#sobre" onClick={() => setMobileOpen(false)} className="py-3 font-semibold border-b border-slate-100 dark:border-slate-800">Como funciona</a>
            <a href="#comunidade" onClick={() => setMobileOpen(false)} className="py-3 font-semibold border-b border-slate-100 dark:border-slate-800">Para professores</a>
            <a href="#duvidas" onClick={() => setMobileOpen(false)} className="py-3 font-semibold mb-4">Dúvidas</a>
            <Link to="/login" className="w-full bg-slate-100 dark:bg-slate-800 py-3 rounded-lg font-bold mb-3 text-center no-underline text-slate-800 dark:text-white">Entrar</Link>
            <Link to="/register" className="w-full bg-[#1565C0] text-white py-3 rounded-lg font-bold text-center no-underline">Criar conta gratuita</Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-200/50 dark:border-blue-800/50">
              <span className="w-2 h-2 rounded-full bg-[#1565C0] dark:bg-blue-400"></span>
              Feito para professores
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.15] tracking-tight text-slate-900 dark:text-white mb-6">
              A educação fica mais forte quando a gente <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">tece junto.</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              A T.E.I.A aproxima professores, ideias e práticas para que a tecnologia faça sentido dentro — e não no lugar — da sala de aula.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-sm border-none no-underline">
                Quero fazer parte <ArrowRight size={18} />
              </Link>
              <a href="#sobre" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-8 py-3.5 rounded-xl font-bold text-base transition-all no-underline">
                Conhecer a proposta
              </a>
            </div>
          </div>

          {/* Visual Tangível */}
          <div className="relative hidden md:block w-full max-w-[450px] mx-auto lg:ml-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl rotate-[-2deg] relative z-10 transition-transform hover:rotate-0 duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded">Plano de Aula</span>
                <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div><div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div></div>
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xl mb-3 leading-tight">A Revolução Industrial através de simulações com IA</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">Uso de prompts para criar um debate histórico em sala, onde os alunos assumem papéis da época...</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="w-6 h-6 rounded-full bg-[#1565C0] text-white flex items-center justify-center">M</div>
                Prof. Mariana • História
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl shadow-lg rotate-[5deg] z-20 flex items-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">Duplo-Cego</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Validado por pares</p>
              </div>
            </div>
            
            <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10"></div>
          </div>

        </div>
      </section>

      {/* PRINCÍPIOS (SOBRE) */}
      <section id="sobre" className="py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">A ideia por trás da T.E.I.A</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Não é sobre ter todas as respostas. É sobre construir <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">melhores perguntas.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-16">
            <article className="relative">
              <span className="text-slate-300 dark:text-slate-700 font-black text-5xl absolute -top-6 -left-4 -z-10 opacity-50">01</span>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <BookOpen size={24} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-3">Prática antes da teoria</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Materiais e relatos que nascem da rotina real de quem está na escola. Esqueça os tutoriais complexos, foque no que funciona com os alunos.
              </p>
            </article>

            <article className="relative">
              <span className="text-slate-300 dark:text-slate-700 font-black text-5xl absolute -top-6 -left-4 -z-10 opacity-50">02</span>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Network size={24} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-3">Conhecimento em circulação</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Uma boa ideia não precisa ficar sozinha. Compartilhe sua aula, adapte a de um colega e faça a inteligência coletiva crescer.
              </p>
            </article>

            <article className="relative">
              <span className="text-slate-300 dark:text-slate-700 font-black text-5xl absolute -top-6 -left-4 -z-10 opacity-50">03</span>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <LockKeyhole size={24} className="text-[#1565C0] dark:text-blue-400" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-3">Tecnologia com cuidado</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                A IA atua como apoio para o trabalho docente, eliminando a burocracia, mas mantendo a sua autonomia e transparência pedagógica.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* COMUNIDADE */}
      <section id="comunidade" className="py-24">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">O lugar para começar</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
              O que você está <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">tecendo hoje?</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              Na T.E.I.A, você pode organizar sua própria produção, buscar inspiração para a próxima aula e descobrir como outros professores de todo o país estão superando desafios parecidos.
            </p>
            <Link to="/register" className="hidden md:flex w-fit items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-md border-none no-underline">
              Entrar na comunidade <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex gap-5 items-start shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-400 p-3 rounded-full shrink-0"><FileText size={24} /></div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Compartilhe uma prática</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Mostre o caminho, não só o resultado final. O que deu certo? Quais prompts geraram as melhores respostas?</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex gap-5 items-start shadow-sm">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-full shrink-0"><BookOpen size={24} /></div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Encontre novas ideias</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Filtre o Acervo da Comunidade por disciplina, etapa de ensino ou até mesmo pelo modelo de IA utilizado.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex gap-5 items-start shadow-sm">
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-3 rounded-full shrink-0"><MessageCircle size={24} /></div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Faça parte da conversa</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Aprenda avaliando no sistema duplo-cego ou deixe comentários construtivos no Fórum de Rascunhos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">Dúvidas Frequentes</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Antes de entrar, <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">pode perguntar.</span>
            </h2>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800">
            {faqs.map((item, index) => (
              <button 
                key={index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full py-6 flex flex-col items-start border-b border-slate-200 dark:border-slate-800 text-left transition-colors group bg-transparent"
              >
                <div className="w-full flex justify-between items-center gap-4">
                  <span className="font-bold text-slate-800 dark:text-white text-[17px] group-hover:text-[#1565C0] dark:group-hover:text-blue-400 transition-colors">
                    {item.q}
                  </span>
                  <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform duration-300 ${openFaq === index ? "rotate-180 text-[#1565C0] dark:text-blue-400" : ""}`} />
                </div>
                {openFaq === index && (
                  <p className="mt-4 text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed pr-8 animate-in slide-in-from-top-2 fade-in duration-200">
                    {item.a}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t-4 border-[#1565C0]">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <SpiderWebIcon size={24} className="text-blue-400" />
              <span className="font-black text-xl tracking-tight">T.E.I.A</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              Tecendo a educação com inteligência artificial.<br />
              Um projeto acadêmico focado em colaboração e qualidade pedagógica.
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Universidade de Brasília (UnB).
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Navegação</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              <a href="#sobre" className="hover:text-white transition-colors no-underline">Como funciona</a>
              <Link to="/login" className="text-left hover:text-white transition-colors no-underline">Entrar na Conta</Link>
              <Link to="/register" className="text-left hover:text-white transition-colors no-underline">Cadastre-se</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Suporte e Legal</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              <button onClick={() => setShowContactModal(true)} className="text-left hover:text-white transition-colors flex items-center gap-2 bg-transparent border-none p-0"><Mail size={14}/> Fale com a equipe</button>
              <Link to="/termos" className="text-left hover:text-white transition-colors no-underline">Termos de Uso</Link>
              <Link to="/privacidade" className="text-left hover:text-white transition-colors no-underline">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL: Contato */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors bg-transparent border-none"><X size={20}/></button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Como podemos ajudar?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Escolha o canal mais adequado para a sua necessidade.</p>
            
            <div className="flex flex-col gap-4">
              <button onClick={() => window.open("https://chat.whatsapp.com/EEcyH5dEb4l0WKziyBVSqU", "_blank")} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition-all group bg-transparent">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-full group-hover:scale-110 transition-transform"><MessageCircle size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Suporte Rápido</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dúvidas pontuais via WhatsApp.</p>
                </div>
              </button>
              
              <button onClick={() => window.location.href = "mailto:suporte.ianaeducacaobasica.unb@gmail.com"} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group bg-transparent">
                <div className="bg-blue-100 dark:bg-blue-900/40 text-[#1565C0] dark:text-blue-400 p-3 rounded-full group-hover:scale-110 transition-transform"><Mail size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Canal Oficial</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">E-mail para parcerias e sugestões.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage