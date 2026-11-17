# Plano de Resposta a Incidentes de Segurança e Privacidade
**Conforme Arts. 46, 48 LGPD e Boas Práticas (NIST SP 800-61, ISO 27035)**

---

## 1. Visão Geral

| Item | Detalhamento |
|------|--------------|
| **Documento** | Plano de Resposta a Incidentes (PRI) — T.E.I.A. |
| **Versão** | 1.0 |
| **Data** | Novembro 2026 |
| **Classificação** | Interno — Restrito à Equipe de Resposta e DPO |
| **Revisão** | Semestral ou após incidente maior |
| **Aprovado por** | DPO (Prof. Edison Ishikawa) + Coordenação T.E.I.A. |

### 1.1 Objetivo
Estabelecer procedimentos padronizados para **detectar, responder, conter, erradicar, recuperar e comunicar** incidentes de segurança da informação e violações de dados pessoais, garantindo conformidade com LGPD (Arts. 46, 48), Marco Civil da Internet e políticas internas da UnB.

### 1.2 Escopo
Aplica-se a todos os sistemas, dados e processos do projeto T.E.I.A.:
- Backend API (Django) + Banco de Dados (PostgreSQL/SQLite)
- Frontend (React/Vite) + CDN/Static files
- Infraestrutura (VPS, Docker, Redis, Nginx)
- Provedores de IA (Ollama local, UnB LiteLLM, Gemini)
- E-mail transacional (SMTP/Gmail)
- Backups e logs

### 1.3 Definições

| Termo | Definição |
|-------|-----------|
| **Evento de Segurança** | Qualquer ocorrência observável em sistema/redes (ex: login falho, erro 500) |
| **Incidente de Segurança** | Evento que **compromete** confidencialidade, integridade ou disponibilidade (CIA) |
| **Incidente de Privacidade (Vazamento)** | Acesso não autorizado, destruição, perda, alteração ou divulgação de **dados pessoais** (Art. 46 LGPD) |
| **Incidente Crítico** | Afeta >100 titulares, dados sensíveis, sistemas core, ou exige notificação ANPD |
| **SLA ANPD** | **72 horas** após ciência do incidente (Art. 48 LGPD) |
| **SLA Titulares** | **Sem demora injustificada** após notificação ANPD (Art. 48 §1º LGPD) |

---

## 2. Equipe de Resposta a Incidentes (CSIRT)

| Papel | Responsável | Contato | Backup |
|-------|-------------|---------|--------|
| **Coordenador de Incidente (IC)** | [Líder Técnico T.E.I.A.] | [Telefone/WhatsApp] | [Dev Sênior] |
| **Encarregado de Dados (DPO)** | Prof. Edison Ishikawa | ishikawa@unb.br | [Suplente DPO] |
| **Analista de Segurança** | [Dev/Infra Segurança] | [Contato] | [Dev] |
| **Comunicação/ Jurídico** | [Assessoria Jurídica UnB] | [Contato] | [DPO] |
| **Infraestrutura/DevOps** | [Responsável Infra] | [Contato] | [Cloud Admin] |
| **Desenvolvimento Backend** | [Dev Backend] | [Contato] | [Outro Dev] |
| **Desenvolvimento Frontend** | [Dev Frontend] | [Contato] | [Outro Dev] |

> **Escalação**: IC → DPO → Reitoria/UnB (se crítico) → ANPD (se vazamento confirmado)

---

## 3. Classificação de Severidade

| Nível | Critérios | Exemplos | Tempo Resposta Inicial | Notificação ANPD |
|-------|-----------|----------|------------------------|------------------|
| **P1 — Crítico** | Vazamento confirmado dados pessoais; indisponibilidade core >1h; comprometimento admin; ransomware | DB exposto, credenciais admin vazadas, SQLi massivo, ransomware | **15 min** | **SIM (≤72h)** |
| **P2 — Alto** | Tentativa ativa de exploração; acesso não autorizado contido; PII em logs exposta; falha autenticação | Brute-force ativo, IDOR, XSS armazenado, PII em log >1h | **1 hora** | Avaliar (se confirmado vazamento) |
| **P3 — Médio** | Vulnerabilidade conhecida não explorada; erro configuração sem exposição; phishing reportado | CVE em dependência, CSP misconfig, phishing usuário | **4 horas** | Não (salvo evolução) |
| **P4 — Baixo** | Evento anômalo sem evidência de comprometimento; false positive | Scan de portas, login falho isolado, erro 500 genérico | **24 horas** | Não |

---

## 4. Fases de Resposta

### FASE 1 — DETECÇÃO E ANÁLISE (T0 a T+1h)

#### 4.1 Fontes de Detecção
| Fonte | Exemplos | Responsável |
|-------|----------|-------------|
| **Monitoramento Automático** | Alertas: rate limit excedido, 5xx spike, login falho em massa, CPU/RAM anômalo | Infra/DevOps |
| **Logs de Aplicação** | Erros de validação upload, SSRF block, CSP violations, JWT inválido | Backend Dev |
| **Relato Externo** | Usuário reporta conta acessada, pesquisador reporta vuln, e-mail security@ | DPO/Suporte |
| **Varreduras/Threat Intel** | Dependabot alert, CVE em dependência, scanner externo | Dev/Segurança |
| **Auditoria Interna** | Revisão de logs, code review, pentest | Equipe Técnica |

#### 4.2 Triagem Inicial (Checklist IC)
- [ ] **Confirmar**: É um incidente real ou false positive?
- [ ] **Classificar**: P1/P2/P3/P4 (ver seção 3)
- [ ] **Escopo**: Quais sistemas/dados/usuários afetados?
- [ ] **Evidências**: Preservar logs, screenshots, dumps (chain of custody)
- [ ] **Notificar**: DPO imediatamente se P1/P2 ou dados pessoais envolvidos
- [ ] **Registrar**: Abrir ticket no tracker (GitHub Issues/Jira) com tag `security-incident`

#### 4.3 Ferramentas de Investigação
```bash
# Logs aplicação (Django)
tail -f /var/log/teia/django.log | jq '.'

# Logs Nginx (acesso/erro)
tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Logs banco (PostgreSQL)
tail -f /var/log/postgresql/postgresql-*.log

# Auditoria admin (se implementado)
grep "ADMIN_AUDIT" /var/log/teia/audit.log

# Verificar integridade BD
pg_dump --schema-only teia_db | head -100
```

---

### FASE 2 — CONTEIMENTO (T+1h a T+4h)

#### 4.4 Conteimento Imediato (Curto Prazo)
| Ação | Comando/Procedimento | Quando Usar |
|------|---------------------|-------------|
| **Bloquear IP malicioso** | `ufw deny from <IP>` ou Nginx `deny <IP>;` | Brute-force, scraping, ataque ativo |
| **Revogar tokens JWT** | `python manage.py shell -c "from rest_framework_simplejwt.token_blacklist.models import OutstandingToken; OutstandingToken.objects.filter(user__id=<id>).delete()"` | Conta comprometida, token vazado |
| **Desabilitar usuário** | Admin → Usuários → Status "Rejeitado" ou `is_active=False` | Conta hackeada, insider threat |
| **Rotacionar segredos** | Novo `SECRET_KEY`, `JWT_SIGNING_KEY`, `EMAIL_HOST_PASSWORD`, `UNB_API_KEY`, `GEMINI_API_KEY` | Vazamento de credenciais |
| **Isolar servidor** | Security Group / Firewall: bloquear todo tráfego exceto IP admin | Comprometimento total (root/RCE) |
| **Parar serviço IA** | `docker-compose stop ollama` ou bloquear `ia-router.unb.br` | SSRF confirmado via IA |
| **Modo manutenção** | Nginx: `return 503` + página estática | Indisponibilidade crítica, investigação forense |

#### 4.5 Conteimento de Longo Prazo (Erradicação)
| Ação | Descrição |
|------|-----------|
| **Patch da vulnerabilidade** | Atualizar dependência, corrigir código, deploy hotfix |
| **Restaurar de backup limpo** | Se integridade BD comprometida: `./manage.py restore_backup <date>` |
| **Reimagem servidor** | Se rootkit/RCE: provisionar novo container/VM, restaurar dados limpos |
| **Revogar e reemitir certificados** | Se TLS comprometido: novo cert Let's Encrypt, atualizar Nginx |
| **Limpar sessões/cookies** | `flush_sessions` + rotacionar `SECRET_KEY` força re-login geral |

---

### FASE 3 — ERADICAÇÃO E RECUPERAÇÃO (T+4h a T+24h)

#### 4.6 Checklist de Erradicação
- [ ] Vulnerabilidade raiz corrigida e testada (teste de regressão + security test)
- [ ] Malware/backdoor removido (scan ClamAV, `rkhunter`, integridade arquivos)
- [ ] Credenciais rotacionadas (todas: DB, JWT, SMTP, IA, SSH, API keys)
- [ ] Patches de SO/dependências aplicados (`apt update && apt upgrade`, `pip-audit --fix`)
- [ ] Regras de firewall/WAF atualizadas
- [ ] Logs de auditoria revisados para atividades suspeitas remanescentes

#### 4.7 Checklist de Recuperação
- [ ] Sistema restaurado em ambiente limpo (staging → produção)
- [ ] Testes de fumaça: login, CRUD produções, revisão, PDF export, IA catalog
- [ ] Monitoramento ativo: alertas P1/P2 funcionando
- [ ] Comunicação aos usuários (se impacto visível): e-mail + banner no site
- [ ] Backup pós-incidente validado

---

### FASE 4 — COMUNICAÇÃO E NOTIFICAÇÃO (Conforme LGPD)

#### 4.8 Notificação à ANPD (Art. 48 LGPD) — **Obrigatório para P1/P2 com dados pessoais**

| Campo | Conteúdo Mínimo |
|-------|-----------------|
| **Natureza do incidente** | Tipo: vazamento, acesso não autorizado, perda, alteração |
| **Dados afetados** | Categorias: nome, e-mail, disciplina, escola, logs, conteúdo |
| **Titulares afetados** | Número estimado + categorias (professores, revisores) |
| **Consequências prováveis** | Risco de phishing, engenharia social, exposição profissional |
| **Medidas adotadas** | Contenção, erradicação, mitigação, prevenção futura |
| **Contato DPO** | ishikawa@unb.br |
| **Prazo** | **≤ 72 horas** após ciência |

**Modelo de Comunicação ANPD** (enviar via [sistema ANPD](https://www.gov.br/anpd/pt-br/assuntos/notificacao-de-incidente) ou e-mail `incidentes@anpd.gov.br`):
```
ASSUNTO: Notificação de Incidente de Segurança — T.E.I.A. / UnB — [DATA]

Controlador: Universidade de Brasília (UnB) — CNPJ 00.038.174/0001-19
Projeto: T.E.I.A. (Tecendo a Educação com Inteligência Artificial)
DPO: Prof. Edison Ishikawa — ishikawa@unb.br

1. Data/hora da ciência: [DD/MM/AAAA HH:MM]
2. Data/hora do incidente: [DD/MM/AAAA HH:MM] (estimada)
3. Natureza: [Ex: Acesso não autorizado a banco de dados via SQL Injection]
4. Dados pessoais afetados: [Nome, e-mail, disciplina, escola, IP, logs de acesso]
5. Número de titulares afetados: [XXX] professores cadastrados
6. Probabilidade de risco alto: [Sim/Não] — Justificativa: [ex: senhas hasheadas PBKDF2, não expostas]
7. Medidas técnicas adotadas: [Contenção: WAF bloqueio, rotação tokens, patch SQLi, rotação segredos]
8. Medidas para titulares: [Recomendação troca senha, monitoramento phishing, canal suporte]
9. Prevenção futura: [WAF gerenciado, pen test, CI security gates, criptografia campos sensíveis]
```

#### 4.9 Comunicação aos Titulares (Art. 48 §1º LGPD)

| Critério | Ação |
|----------|------|
| **Risco ALTO aos direitos** (ex: senhas expostas, dados sensíveis) | **Obrigatório**: e-mail individual + banner plataforma + FAQ |
| **Risco MÉDIO/BAIXO** | **Recomendado**: banner plataforma + e-mail em lote + FAQ |
| **Prazo** | **Sem demora injustificada** após notificação ANPD (idealmente ≤ 24h pós-ANPD) |

**Template E-mail Titulares**:
```
ASSUNTO: Importante: Incidente de Segurança na Plataforma T.E.I.A. — Ação Requerida

Prezado(a) Professor(a) [Nome],

Informamos que a plataforma T.E.I.A. (UnB) identificou um incidente de segurança em [DATA].
Resumo do ocorrido: [Descrição clara, sem jargão técnico].

Dados seus que podem ter sido afetados:
- [Lista: nome, e-mail, disciplina, escola, NÃO inclui senha (hasheada)]

O que já fizemos:
✅ Contivemos o acesso não autorizado
✅ Corrigimos a vulnerabilidade
✅ Rotacionamos todas as chaves e tokens de acesso
✅ Notificamos a ANPD (Autoridade Nacional de Proteção de Dados)

O que recomendamos que você faça:
1. Troque sua senha na plataforma (se não usa gerenciador, crie uma forte e única)
2. Fique atento a e-mails suspeitos (phishing) usando seu nome/e-mail
3. Relate qualquer atividade estranha em sua conta para suporte.ianaeducacaobasica.unb@gmail.com

Seus direitos (LGPD Art. 18): acesso, correção, eliminação, portabilidade, oposição.
DPO: Prof. Edison Ishikawa — ishikawa@unb.br

Atenciosamente,
Equipe T.E.I.A. — Universidade de Brasília
```

#### 4.10 Comunicação Interna e Externa

| Audiência | Canal | Responsável | Timing |
|-----------|-------|-------------|--------|
| Equipe Técnica | Slack/Teams `#teia-incident` + call | IC | Imediato |
| DPO | E-mail + call | IC | Imediato (P1/P2) |
| Coordenação/Reitoria UnB | E-mail formal + relatório | DPO | ≤ 4h (P1) |
| ANPD | Sistema oficial / e-mail | DPO | ≤ 72h |
| Titulares | E-mail + banner site | DPO + Dev Frontend | ≤ 24h pós-ANPD |
| Imprensa/Público (se necessário) | Nota oficial UnB | Assessoria Imprensa UnB | Conforme orientação jurídica |

---

### FASE 5 — LIÇÕES APRENDIDAS E MELHORIA CONTÍNUA (Pós-Incidente)

#### 4.11 Relatório Pós-Incidente (Post-Mortem)
**Prazo**: 5 dias úteis após encerramento.

| Seção | Conteúdo |
|-------|----------|
| **Resumo Executivo** | O que aconteceu, impacto, tempo total de resolução |
| **Linha do Tempo** | T0 (detecção) → T+contain → T+eradicate → T+recover → T+communicate |
| **Causa Raiz** | Análise 5 Porquês / Fishbone |
| **Falhas de Controle** | O que não funcionou (ex: WAF não bloqueou, log não alertou) |
| **Ações Corretivas** | Curto prazo (já feito), Médio prazo (30 dias), Longo prazo (90 dias) |
| **Indicadores** | MTTR (Mean Time To Respond), MTTC (Contain), MTTD (Detect) |
| **Atualizações de Documentos** | ROPA, DPIA, Runbook, Políticas, Código |

#### 4.12 Métricas de Efetividade (KPIs)

| KPI | Meta | Frequência Medição |
|-----|------|-------------------|
| **MTTD** (Mean Time To Detect) | < 1 hora (automatizado) / < 24h (manual) | Mensal |
| **MTTC** (Mean Time To Contain) | < 4 horas (P1) | Por incidente |
| **MTTR** (Mean Time To Recover) | < 24 horas (P1) | Por incidente |
| **% Incidentes com notificação ANPD no prazo** | 100% | Trimestral |
| **% Incidentes reincidentes (mesma causa)** | 0% | Trimestral |
| **Cobertura de testes security no CI** | 100% critical/high | Por deploy |

---

## 5. Procedimentos Específicos por Tipo de Incidente

### 5.1 Vazamento de Banco de Dados (Exfiltration)
1. **Contenção**: Revogar credenciais DB, rotacionar `SECRET_KEY`, bloquear IP atacante
2. **Análise**: Verificar `pg_stat_activity`, logs query, `audit.log` admin
3. **Avaliação**: Quais tabelas? `auth_user`, `kipo_playground_profile`, `producao`, `avaliacao`?
4. **Notificação**: ANPD (sim), Titulares (sim — risco alto)
5. **Recuperação**: Restore backup point-in-time (PITR PostgreSQL) ou `pg_restore`
6. **Prevenção**: Criptografia colunas sensíveis, row-level security, WAF, audit log imutável

### 5.2 Comprometimento de Conta Admin
1. **Contenção**: `is_active=False` na conta, revogar todos tokens, rotacionar `SECRET_KEY`
2. **Análise**: `AdminAuditLog` → quais ações? `DELETE`, `UPDATE` users/produções?
3. **Recuperação**: Reverter ações maliciosas (soft-delete restore), notificar usuários afetados
4. **Prevenção**: **MFA obrigatório** (django-mfa2), alerta login novo device/IP, session recording

### 5.3 Injeção de Código / RCE (via Upload, SSRF, Deserialization)
1. **Contenção**: Isolar servidor, parar serviço vulnerável (IA, PDF, Upload)
2. **Análise**: Verificar integridade arquivos (`rpm -Va` / `debsums` / `pip check`), procurar webshells (`find / -name "*.php" -o -name "*.pyc" -newer <date>`)
3. **Erradicação**: Reimagem container/VM, deploy de imagem limpa
4. **Prevenção**: Validação magic bytes/MIME (já existe), `base_url=None` WeasyPrint (já existe), allowlist SSRF (já existe), CSP nonce (planejado)

### 5.4 Ransomware / Criptografia de Dados
1. **NÃO PAGUE RESGATE** — Política UnB/Governo Federal
2. **Contenção**: Isolar rede imediatamente (desconectar VPS/container)
3. **Recuperação**: Restore de backup offline/imutável (testado mensalmente)
4. **Notificação**: ANPD (sim), Polícia Federal (recomendado), Reitoria
5. **Prevenção**: Backup 3-2-1 (3 cópias, 2 mídias, 1 offsite/imutável), WAF, segmentação rede

### 5.5 Exposição Acidental de PII em Logs / Repositório / Frontend
1. **Contenção**: Rotacionar logs, remover do Git (`git filter-repo` / BFG), limpar CDN cache
2. **Análise**: Qual PII? Quantos registros? Tempo de exposição? Quem acessou?
3. **Notificação**: ANPD se risco alto (ex: CPF, senha em texto claro). Se só IP/email em log: avaliar.
4. **Prevenção**: `sanitize_crm_data` (já existe), `bandit` no CI, `truffleHog`/`git-secrets` no pre-commit, log structurado JSON sem PII

### 5.6 Ataque de Força Bruta / Credential Stuffing
1. **Contenção**: Rate limit já bloqueia (10/min login). Adicionar: block IP por 24h após 5 falhas, CAPTCHA (futuro)
2. **Análise**: Logs `login_attempts` → IPs, user-agents, contas alvo
3. **Notificação**: Usuários alvo (recomendar troca senha, MFA quando disponível)
4. **Prevenção**: `django-axes` ou similar, monitoramento geo-IP anômalo, alerta spike login falho

---

## 6. Checklists Rápidos (Runbooks de Bolso)

### 6.1 Checklist P1 — Primeiros 15 Minutos
```
[ ] 1. IC assume comando, abre canal #teia-incident
[ ] 2. Confirma incidente real (não false positive)
[ ] 3. Classifica P1, define escopo (sistemas/dados)
[ ] 4. Notifica DPO: "P1 CONFIRMADO — [resumo 1 linha]"
[ ] 5. Preserva evidências: cp logs /evidence/incident-<date>/
[ ] 6. Contenção IMEDIATA: bloqueio IP / revogação tokens / isolamento
[ ] 7. Inicia cronômetro MTTC
[ ] 8. Registra ticket: title="P1: <descrição>", labels=security,incident,p1
```

### 6.2 Checklist Notificação ANPD (Até 72h)
```
[ ] DPO preenche formulário oficial ANPD
[ ] Anexa: timeline, evidências, medidas adotadas, avaliação risco
[ ] Envia via sistema ANPD + cópia e-mail incidentes@anpd.gov.br
[ ] Guarda protocolo de recebimento
[ ] Inicia preparação comunicação titulares (paralelo)
```

### 6.3 Checklist Comunicação Titulares (Pós-ANPD)
```
[ ] DPO aprova texto final (jurídico revisa)
[ ] Dev Frontend: deploy banner site + página FAQ incidente
[ ] Backend: script envio e-mail em lote (respeitar rate limit SMTP)
[ ] Monitora: bounces, respostas, canal suporte
[ ] Atualiza FAQ conforme dúvidas recorrentes
```

---

## 7. Contatos de Emergência

| Órgão/Entidade | Contato | Quando Acionar |
|----------------|---------|----------------|
| **ANPD** | https://www.gov.br/anpd/pt-br/assuntos/notificacao-de-incidente / incidentes@anpd.gov.br | Vazamento dados pessoais confirmado (P1/P2) |
| **Polícia Federal** | 197 / https://www.gov.br/pf/ | Crime cibernético (invasão, ransomware, fraude bancária) |
| **CERT.br** | cert@cert.br / https://www.cert.br/ | Incidentes de segurança relevantes, coordenado |
| **UnB — Reitoria/Gabinete** | [Contato interno] | Incidentes P1, imprensa, decisões institucionais |
| **UnB — Assessoria Jurídica** | [Contato interno] | Todas notificações externas, termos comunicação |
| **UnB — Assessoria de Imprensa** | [Contato interno] | Se vazamento se tornar público / imprensa procura |
| **Provedor Cloud (AWS/DO/VPS)** | Support ticket / telefone emergência | Comprometimento infra, necessidade isolamento rede |
| **Provedor E-mail (Google/Gmail)** | Admin Console / Support | Comprometimento conta SMTP, spam/phishing em massa |

---

## 8. Anexos e Referências

- `docs/ROPA.md` — Registro de Atividades de Tratamento
- `docs/DPIA.md` — Avaliação de Impacto à Proteção de Dados
- `docs/RETENTION_POLICY.md` — Política de Retenção
- `backend/kipo_playground/security.py` — PII masking, SSRF protection, upload validation
- `backend/kipo_playground/security_middleware.py` — Headers HTTP segurança
- `backend/kipo_playground/tests_security.py` — Testes automatizados segurança
- `backend/kipo_playground/management/commands/cleanup_old_logs.py` — Limpeza logs 6 meses
- `backend/kipo_playground/management/commands/backup_db.py` — Backup/restore
- LGPD (Lei 13.709/2018) — Arts. 46, 48, 52-54
- Marco Civil da Internet (Lei 12.965/2014) — Art. 15
- ANPD — Guia de Notificação de Incidentes (2023)
- NIST SP 800-61 Rev. 2 — Computer Security Incident Handling Guide
- ISO/IEC 27035 — Information Security Incident Management

---

## 9. Controle de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | Nov/2026 | [Autor] | Criação inicial |

---

**Aprovação:**

________________________________________________________
Prof. Edison Ishikawa — DPO / Encarregado de Proteção de Dados  
Data: ____/____/________

________________________________________________________
[Coordenador Técnico T.E.I.A.] — Responsável Técnico  
Data: ____/____/________