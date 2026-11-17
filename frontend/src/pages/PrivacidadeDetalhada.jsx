import React from "react";
import { ShieldCheck, UserCheck, Database, Shield, Scale, Globe, LockKeyhole, MonitorCheck, CheckCircle2, RefreshCw, GitBranch, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacidadeDetalhada = () => {
  const direitos = [
    {
      icon: UserCheck,
      title: "Confirmação e Acesso",
      desc: "Saiba se tratamos seus dados e acesse uma cópia completa (Perfil → Baixar meus dados).",
      color: "blue",
      lgpd: "Art. 18, I e II",
    },
    {
      icon: Database,
      title: "Portabilidade",
      desc: "Exporte seus dados em formato estruturado (JSON) para levar para onde quiser.",
      color: "emerald",
      lgpd: "Art. 18, V",
    },
    {
      icon: Shield,
      title: "Correção e Eliminação",
      desc: "Corrija dados incompletos ou solicite a exclusão definitiva da conta (Perfil → Excluir conta).",
      color: "amber",
      lgpd: "Art. 18, III e VI",
    },
    {
      icon: Scale,
      title: "Revogação e Oposição",
      desc: "Retire o consentimento a qualquer momento e oponha-se ao tratamento não essencial.",
      color: "purple",
      lgpd: "Art. 18, § 1º e IX",
    },
  ];

  const conformidade = [
    {
      icon: Shield,
      title: "LGPD Compliance",
      color: "green",
      items: [
        "Base legal clara (Art. 7 LGPD)",
        "Consentimento granular (Art. 8) - Analytics & Marketing opt-in",
        "Direitos do titular (Art. 18) - Portal no Perfil",
        "Anonimização irreversível (Art. 12)",
        "DPO designado + LIA documentado",
        "Direito de Arrependimento (CDC Art. 49) - 7 dias",
      ],
    },
    {
      icon: LockKeyhole,
      title: "Segurança da Informação",
      color: "blue",
      items: [
        "JWT HttpOnly + Refresh Rotation (30min/7d)",
        "CSRF Protection (Double Submit Cookie)",
        "Rate Limiting + Throttling por endpoint",
        "SSRF Protection (WeasyPrint allowlist)",
        "PII Masking em Logs (e-mail, telefone, IP)",
        "bcrypt cost 12 + TLS 1.2+",
        "CSP com Nonces, HSTS, X-Frame-Options",
      ],
    },
    {
      icon: Scale,
      title: "Ética e Transparência",
      color: "purple",
      items: [
        "Código de Defesa do Consumidor (Art. 49)",
        "Marco Civil da Internet (Art. 15, 21)",
        "Double-blind Peer Review",
        "IA como apoio, não substituição (LDA Art. 11)",
        "Auditoria de segurança contínua",
        "Legitimate Interest Assessment (LIA) documentado",
      ],
    },
    {
      icon: MonitorCheck,
      title: "Testes e Pipeline Seguro",
      color: "emerald",
      items: [
        "Testes E2E (Playwright/Cypress)",
        "CSP com Nonces (sem 'unsafe-inline')",
        "Dependabot / Renovate automático",
        "CI Security Gates",
        "pip-audit · bandit · semgrep · npm audit",
      ],
    },
  ];

  const badges = [
    { icon: ShieldCheck, label: "LGPD Compliant", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800", iconColor: "text-green-600 dark:text-green-400" },
    { icon: LockKeyhole, label: "JWT Secure", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: Scale, label: "CDC / MCI", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800", iconColor: "text-purple-600 dark:text-purple-400" },
    { icon: Globe, label: "Projeto UnB", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: MonitorCheck, label: "Testes E2E", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: CheckCircle2, label: "CSP Nonces", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800", iconColor: "text-teal-600 dark:text-teal-400" },
    { icon: RefreshCw, label: "Dependabot", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800", iconColor: "text-cyan-600 dark:text-cyan-400" },
    { icon: GitBranch, label: "CI Security Gates", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800", iconColor: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#1565C0] transition-colors no-underline">
              <ArrowRight size={20} className="rotate-180" />
              <span className="font-medium">Voltar</span>
            </Link>
            <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">Privacidade & Conformidade — Detalhado</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Hero */}
        <section className="mb-16 text-center max-w-3xl mx-auto">
          <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-4">Transparência Total</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
            Seus dados, <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">seu controle.</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            A T.E.I.A respeita a Lei Geral de Proteção de Dados (Lei 13.709/2018).
            Esta página detalha todos os seus direitos, nossas práticas de segurança e as certificações técnicas que mantemos.
          </p>
        </section>

        {/* Seus Direitos (LGPD Art. 18) */}
        <section id="direitos" className="mb-16">
          <div className="mb-10 max-w-2xl mx-auto text-center">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">Seus Direitos (LGPD Art. 18)</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Controle total sobre suas informações
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {direitos.map((right, i) => (
              <article key={i} className="relative p-6 rounded-2xl border bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className={`absolute -top-3 -right-3 text-[10px] font-bold uppercase text-slate-300 dark:text-slate-700 opacity-50`}>
                  {right.lgpd}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform hover:scale-110 ${
                  right.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  right.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  right.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  <right.icon size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-2">{right.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{right.desc}</p>
              </article>
            ))}
          </div>

          {/* Como exercer */}
          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-full shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Como exercer seus direitos</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Todas as solicitações são processadas diretamente na plataforma: acesse <strong className="text-slate-900 dark:text-white">Perfil → Conta</strong>
                    para baixar seus dados (JSON) ou excluir a conta. Para dúvidas, fale com nosso DPO.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link to="/login" className="flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors no-underline">
                  Acessar minha conta
                </Link>
                <a href="mailto:suporte.ianaeducacaobasica.unb@gmail.com" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold text-sm transition-colors">
                  Contatar DPO
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Conformidade e Segurança */}
        <section id="conformidade" className="mb-16">
          <div className="text-center mb-12">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">Conformidade e Segurança</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Construída com <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">responsabilidade técnica.</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {conformidade.map((cat, i) => (
              <article key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                  cat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  cat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  cat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <cat.icon size={28} />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mb-4 text-center">{cat.title}</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5 text-left">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <ShieldCheck size={14} className={`text-${cat.color}-600 dark:text-${cat.color}-400`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Badges de conformidade */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">Certificações e Selos</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Validação técnica independente
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {badges.map((badge, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-full border ${badge.color} ${badge.iconColor}`}>
                <badge.icon size={16} />
                <span className="text-sm font-bold">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cookies Detalhados */}
        <section id="cookies" className="mb-16">
          <div className="text-center mb-12">
            <p className="text-[#1565C0] dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">Cookies e Rastreamento</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Transparência sobre <span className="font-serif italic text-[#1565C0] dark:text-blue-400 font-normal">tecnologias de rastreamento.</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                id: 'essential',
                name: 'Essenciais',
                description: 'Necessários para login, segurança (CSRF, sessão) e funcionamento básico. Não podem ser desativados.',
                required: true,
                cookies: [
                  { name: 'refresh_token', purpose: 'Sessão JWT (7 dias), HttpOnly, Secure, SameSite=Strict — proteção XSS' },
                  { name: 'access_token', purpose: 'Token JWT (30 min), apenas em memória — não é cookie' },
                  { name: 'csrftoken', purpose: 'Proteção CSRF em formulários stateful' },
                  { name: 'sessionid', purpose: 'Sessão Django admin (se aplicável)' },
                ],
                color: 'green',
                icon: Shield,
              },
              {
                id: 'analytics',
                name: 'Análise e Desempenho',
                description: 'Nos ajudam a entender como a plataforma é usada para melhorar a experiência (páginas visitadas, tempo, erros). Dados anonimizados.',
                required: false,
                cookies: [
                  { name: '_ga, _gid', purpose: 'Google Analytics (futuro) — métricas anônimas de uso' },
                  { name: 'teia_analytics', purpose: 'Analytics próprio (futuro) — sem dados pessoais' },
                ],
                color: 'blue',
                icon: Database,
              },
              {
                id: 'marketing',
                name: 'Marketing e Personalização',
                description: 'Permitem exibir conteúdo relevante e comunicados sobre novidades da comunidade T.E.I.A.',
                required: false,
                cookies: [
                  { name: 'teia_prefs', purpose: 'Preferências de UI (tema, layout) — futuro' },
                  { name: 'teia_notifs', purpose: 'Permissão para notificações push — futuro' },
                ],
                color: 'purple',
                icon: Globe,
              },
            ].map((cat, i) => (
              <article key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  cat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  cat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  <cat.icon size={24} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={`font-extrabold text-lg ${cat.color === 'green' ? 'text-green-800 dark:text-green-300' : cat.color === 'blue' ? 'text-blue-800 dark:text-blue-300' : 'text-purple-800 dark:text-purple-300'}`}>
                    {cat.name}
                  </h4>
                  {cat.required && <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Obrigatório</span>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{cat.description}</p>
                <div className="space-y-2">
                  {cat.cookies.map((cookie, j) => (
                    <div key={j} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono block mb-1">{cookie.name}</code>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{cookie.purpose}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-2xl mx-auto">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Você pode alterar suas preferências a qualquer momento no banner de cookies (canto inferior)
              ou acessando <Link to="/perfil" className="text-[#1565C0] underline hover:text-blue-700 font-medium">Perfil → Conta → Preferências de Privacidade</Link>.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Consulte nossa <a href="/privacidade" className="text-[#1565C0] underline hover:text-blue-700">Política de Privacidade</a> completa e
              <a href="/termos" className="text-[#1565C0] underline hover:text-blue-700">Termos de Uso</a>.
            </p>
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center p-8 md:p-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h3 className="text-2xl md:text-3xl font-extrabold mb-4">
            Ainda tem dúvidas?
          </h3>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Nossa equipe está à disposição para esclarecer qualquer ponto sobre privacidade, segurança ou seus direitos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:suporte.ianaeducacaobasica.unb@gmail.com" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm no-underline">
              Contatar DPO
            </a>
            <Link to="/login" className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-sm transition-colors no-underline">
              Acessar minha conta <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer simples */}
      <footer className="bg-slate-900 text-slate-300 py-8 border-t-4 border-[#1565C0]">
        <div className="max-w-[1200px] mx-auto px-6 text-center text-sm">
          <p className="text-slate-500">© {new Date().getFullYear()} Universidade de Brasília (UnB) — Projeto T.E.I.A</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacidadeDetalhada;