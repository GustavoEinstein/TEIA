# Avaliação de Impacto à Proteção de Dados (DPIA)
**Conforme Art. 38-40 da LGPD e Guia da ANPD**

---

## 1. Identificação do Tratamento

| Campo | Informação |
|-------|------------|
| **Controlador** | Universidade de Brasília (UnB) — Projeto T.E.I.A. |
| **DPO** | Prof. Edison Ishikawa (ishikawa@unb.br) |
| **Descrição Resumida** | Plataforma colaborativa para professores catalogarem, revisarem (duplo-cego) e compartilharem práticas pedagógicas com apoio de IA, com gamificação (XP/níveis) e exportação PDF |
| **Sistemas Envolvidos** | Backend Django 5.2 (API REST), Frontend React 19 (SPA), PostgreSQL/SQLite, Ollama/UnB LiteLLM/Gemini (IA), WeasyPrint (PDF) |
| **Data da Avaliação** | Novembro 2026 |
| **Versão** | 1.0 |
| **Necessidade de DPIA** | **SIM** — Perfilamento automatizado (gamificação/XP), larga escala esperada (professores rede pública), inovação tecnológica (IA generativa) |

---

## 2. Descrição Detalhada do Tratamento

### 2.1 Fluxo de Dados Principais

```
[Professor] → Cadastro (nome, email, disciplina, escola) → Conta "Em análise"
                                    ↓
                            [Admin aprova] → Conta "Aprovada"
                                    ↓
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
       [Criar Prática]         [Revisar Prática]        [Fórum/Interação]
       - Texto livre           - Notas 6 critérios      - Tópicos/Comentários
       - IA cataloga           - Feedback textual       - Anexos
       - PDF export            - Anônimo (duplo-cego)   - Categorias
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                    ▼
                         [Acervo Público]
                         - Filtros: disciplina, nível, IA
                         - Autor: exibir_autor (opt-in)
                         - Licença: CC BY-NC-SA 4.0
                                    │
                                    ▼
                         [Gamificação]
                         - XP por ações
                         - Níveis/títulos
                         - Conquistas/badges
                         - Ranking (opt-out)
```

### 2.2 Categorias de Dados Pessoais

| Categoria | Dados | Sensível? | Justificativa |
|-----------|-------|-----------|---------------|
| Identificação | Nome completo, e-mail | Não | Execução contrato (cadastro, comunicação) |
| Profissional | Disciplina, escola/instituição | Não | Execução contrato (filtros, contexto pedagógico) |
| Autenticação | Senha (hash PBKDF2), JWT tokens | Não | Segurança, legítimo interesse |
| Navegação/Segurança | IP, timestamp, user-agent, endpoint | Não | Legítimo interesse (Art. 15 MCI: 6 meses), segurança |
| Conteúdo Gerado | Práticas, avaliações, fórum, prompts IA | Não* | Execução contrato (finalidade principal) |
| Gamificação | XP, nível, conquistas, histórico | Não | Execução contrato (engajamento) |
| Consentimentos | Versão termos, timestamps, cookies | Não | Art. 8 LGPD (comprovação consentimento) |

> *Conteúdo pode indiretamente revelar opinião política/filosófica/religiosa se professor incluir em relatos. **Mitigação**: orientação na Política de Privacidade e Termos para não incluir dados sensíveis; moderação reativa.

### 2.3 Bases Legais por Finalidade

| Finalidade | Base Legal (Art. 7º LGPD) | Necessidade/Proporcionalidade |
|------------|---------------------------|-------------------------------|
| Cadastro e autenticação | V — Execução de contrato | Estrita: sem conta, sem serviço |
| Catalogação IA | V — Execução de contrato | Funcionalidade core; opcional (professor escolhe usar) |
| Revisão duplo-cego | V — Execução de contrato | Essencial para qualidade; anonimato protege ambos |
| Publicação no acervo | V + I (consentimento `exibir_autor`) | Opt-in para nome público; conteúdo licenciado CC BY-NC-SA |
| Gamificação (XP/nível) | V — Execução de contrato | Parte do serviço; ranking opt-out |
| Segurança/Logs | IX — Legítimo interesse + II (Art. 15 MCI) | Proporcional: apenas IP/timestamp, 6 meses, PII masking |
| Pesquisa anonimizada | IV — Estudos por órgão pesquisa + IX | Dados agregados/k-anonymity; CEP quando identificáveis |
| Cookies não essenciais | I — Consentimento (Art. 8) | Granular, revogável, banner informativo |

---

## 3. Necessidade e Proporcionalidade

### 3.1 Princípios Aplicados

| Princípio | Como é Atendido |
|-----------|-----------------|
| **Finalidade** | Cada dado vinculado a finalidade explícita no ROPA e Política |
| **Adequação** | Dados mínimos para cadastro (nome, email, disciplina, escola) |
| **Necessidade** | Escola torna-se opcional (v4.1); sem dados sensíveis obrigatórios |
| **Livre Acesso** | Exportação JSON completa via `/api/user/export-data/` |
| **Qualidade** | Validação frontend/backend; correção via PUT `/api/user/me/` |
| **Transparência** | Política de Privacidade (11 seções), Termos (12 cláusulas), Landing page |
| **Segurança** | JWT HttpOnly, CSP, rate limiting, upload validation, SSRF protection |
| **Prevenção** | Throttling, MFA admins (planejado), audit log (planejado) |
| **Não Discriminação** | Acesso igualitário; moderação baseada em conduta, não perfil |
| **Responsabilização** | DPO designado, ROPA, DPIA, runbook incidentes, testes segurança |

### 3.2 Análise de Proporcionalidade — Gamificação/Perfilamento

**Risco**: Sistema de XP/níveis cria perfil comportamental do professor (frequência, tipo de contribuição, qualidade avaliações).

**Mitigações Implementadas**:
- XP apenas para ações explícitas (submeter, revisar, comentar) — não tracking passivo
- Ranking **opt-out** (pseudônimo ou exclusão total)
- Histórico XP acessível apenas ao próprio usuário + admins (auditoria)
- Eliminação completa com exclusão de conta
- **Não** usado para: scoring de crédito, decisões automatizadas com efeito legal, marketing

**Conclusão**: Proporcional à finalidade de engajamento pedagógico. Não se enquadra em "decisão automatizada com efeito jurídico" (Art. 20 LGPD). **Adicionado em Termos v4.1**: cláusula explícita de direito de oposição ao perfilamento.

---

## 4. Riscos à Privacidade e Medidas de Mitigação

### 4.1 Matriz de Riscos

| ID | Risco | Probabilidade | Impacto | Nível | Medidas Existentes | Medidas Planejadas |
|----|-------|---------------|---------|-------|-------------------|-------------------|
| R1 | Vazamento de dados pessoais (BD) | Média | Alto | **ALTO** | HTTPS, PBKDF2, JWT rotation, CSP, headers, CORS allowlist | Criptografia campos sensíveis, backup criptografado, pentest anual |
| R2 | Reidentificação de produções anonimizadas | Baixa | Alto | **MÉDIO** | Anonimização irreversível (`user=NULL`), supressão/generalização escola/disciplina | K-anonymity check periódico, DPIA revisão anual |
| R3 | Perfilamento excessivo via gamificação | Média | Médio | **MÉDIO** | Opt-out ranking, eliminação na exclusão, sem tracking passivo | Dashboard direitos: oposição ao perfilamento (v4.1), relatório transparência |
| R4 | Exposição de dados de alunos em relatos | Baixa | Muito Alto | **ALTO** | Termos cláusula 7.3 (proibido), Política seção 8, moderação reativa | Validação IA detecta nomes/CPF? (futuro), canal denúncia destacado |
| R5 | IA generativa vazando PII nos prompts/respostas | Média | Alto | **ALTO** | Provedores nacionais (UnB, Ollama local), sem logs de prompts no provedor | Sanitização prompts (futuro), DPA com provedores, opção só local |
| R6 | SSRF via WeasyPrint/Ollama | Baixa | Muito Alto | **MÉDIO** | Allowlist IPs, validação URL, base_url=None no WeasyPrint | Testes contínuos, WAF (futuro) |
| R7 | Acesso não autorizado a conta admin | Baixa | Muito Alto | **ALTO** | MFA planejado, admin audit log planejado, throttling login | MFA obrigatório (django-mfa2), alertas login suspeito |
| R8 | Não conformidade LGPD (multas/anpd) | Baixa | Alto | **MÉDIO** | ROPA, DPIA, Política, Termos, DPO, direitos implementados | Auditoria externa anual, compliance checklist CI |
| R9 | Dependência de terceiros (Gemini, UnB LL) | Média | Médio | **MÉDIO** | Provedor local (Ollama) como fallback, DPA pendentes | DPAs assinados, SLA contratual, plano contingência |
| R10 | Logs expostos com PII | Baixa | Alto | **MÉDIO** | PII masking CRM, logs estruturados planejados | JSON logs centralizados, retenção 6 meses automática |

### 4.2 Riscos Residuais Aceitos

| Risco Residual | Justificativa de Aceitação |
|----------------|----------------------------|
| Reidentificação indireta via escola+disciplina+relato | Probabilidade baixa; base de professores grande; anonimização remove nome/email; interesse público pedagógico prevalece (Art. 7º, IV) |
| Metadados de acesso (IP) por 6 meses | Obrigação legal (Art. 15 MCI); necessário para segurança; não cruza com conteúdo sensível |

---

## 5. Medidas de Segurança Técnicas e Organizacionais

### 5.1 Técnicas (Implementadas)

| Camada | Medida | Status |
|--------|--------|--------|
| **Rede** | HTTPS/TLS 1.2+, HSTS 1 ano, CSP estrita, COOP/COEP, CORS allowlist | ✅ |
| **Aplicação** | Django ORM (anti-SQLi), validação upload (magic bytes/MIME/10MB), SSRF protection (Ollama/WeasyPrint), throttling por escopo | ✅ |
| **Autenticação** | JWT access 45min + refresh 7d HttpOnly cookie, rotação + blacklist, PBKDF2, validadores senha forte | ✅ |
| **Autorização** | RBAC (user/admin/superuser), `IsAuthenticated`, duplo-cego enforceado no backend | ✅ |
| **Dados** | Anonimização irreversível (FK NULL), PII masking CRM, consentimento granular cookies | ✅ |
| **Monitoramento** | Testes security automatizados (`tests_security.py`), rate limiting logs | ✅ |
| **IA** | Provedores nacionais, allowlist URLs, timeout 90s, sem armazenamento prompts no provedor | ✅ |

### 5.2 Organizacionais (Implementadas/Planejadas)

| Medida | Status |
|--------|--------|
| DPO designado e contatos públicos | ✅ |
| ROPA documentado e versionado | ✅ |
| DPIA realizada e revisada anualmente | ✅ (v1.0) |
| Política de Privacidade e Termos claros, acessíveis, versionados | ✅ |
| Canal de atendimento ao titular (e-mail DPO + suporte) | ✅ |
| Treinamento equipe técnica em LGPD/Segurança | 🔄 Contínuo |
| Plano de resposta a incidentes (runbook) | ✅ `docs/INCIDENT_RESPONSE.md` |
| Contratos DPAs com operadores | 🔄 Em andamento (`docs/DPAs/`) |
| Backup automatizado testado | 🔄 Planejado (`backup_db.py`) |
| Auditoria de código (CI security gates) | 🔄 Planejado (GitHub Actions) |
| Pentest / Auditoria externa | 🔄 Anual (planejado) |

---

## 6. Direitos dos Titulares — Operacionalização

| Direito | Endpoint/Frontend | Tempo Resposta | Automatizado? |
|---------|-------------------|----------------|---------------|
| Confirmação/Acesso | `GET /api/user/export-data/` + Perfil → "Baixar dados" | < 1 min (auto) / 15 dias (manual) | ✅ Sim |
| Correção | `PUT /api/user/me/` + Perfil → Editar | Imediato (auto) | ✅ Sim |
| Eliminação/Anonimização | `DELETE /api/user/delete-account/` + Perfil → "Excluir conta" (2 etapas) | Imediato (auto) | ✅ Sim |
| Portabilidade | `GET /api/user/export-data/` (JSON estruturado) | < 1 min | ✅ Sim |
| Revogação Consentimento | `PATCH /api/user/consent/` + Banner cookies + Perfil | Imediato | ✅ Sim |
| Oposição Perfilamento | DPO e-mail + Termos v4.1 cláusula | 15 dias | 🔄 Manual (dashboard v4.1) |
| Informação Compartilhamento | DPO e-mail + Política seção 4 | 15 dias | 🔄 Manual |

---

## 7. Transferência Internacional

| Destino | Dados | Salvaguarda Art. 33 | Status DPA |
|---------|-------|---------------------|------------|
| Google (Gmail SMTP) | E-mail, nome (transacional) | SCC + Decisão Adequação Parcial | 🔄 Pendente |
| Google (Fonts CDN) | IP, user-agent (passivo) | Legítimo interesse; avaliar self-host | 🔄 Pendente |
| Google (Gemini API - opcional) | Prompts, respostas IA | SCC + Cláusulas contratuais | 🔄 Pendente |
| UnB LiteLLM (`ia-router.unb.br`) | Prompts, respostas IA | Infra nacional, contrato institucional | 🔄 Pendente |

**Mitigação**: Provedor local (Ollama) como padrão (`LLM_PROVIDER=local`); Gemini/UnB opcionais.

---

## 8. Conclusão e Aprovação

### 8.1 Resultado da DPIA

> **O tratamento de dados pessoais na plataforma T.E.I.A. apresenta riscos residuais ACEITÁVEIS**, considerando:
> 1. Finalidades legítimas, proporcionais e transparentes (educação, pesquisa, colaboração)
> 2. Bases legais adequadas para cada finalidade (predominantemente execução de contrato + legítimo interesse)
> 3. Medidas técnicas robustas já implementadas (JWT seguro, anonimização, SSRF protection, throttling, CSP)
> 4. Direitos dos titulares plenamente operacionalizados (export, delete, consent granular)
> 5. Governança LGPD estabelecida (DPO, ROPA, runbook, políticas versionadas)

### 8.2 Plano de Ação Pós-DPIA (Próximos 90 dias)

| Ação | Responsável | Prazo | Prioridade |
|------|-------------|-------|------------|
| Assinar DPAs com operadores (hospedagem, e-mail, IA) | Jurídico/UnB + DPO | 30 dias | ALTA |
| Implementar MFA obrigatório para admins | Equipe Técnica | 30 dias | ALTA |
| Job cron limpeza logs 6 meses | Equipe Técnica | 15 dias | ALTA |
| Backup automatizado + restore testado | Equipe Técnica/Infra | 30 dias | ALTA |
| Logs JSON centralizados (Loki/Graylog) | Equipe Técnica/Infra | 60 dias | MÉDIA |
| Dashboard oposição ao perfilamento (Termos v4.1) | Equipe Técnica | 30 dias | MÉDIA |
| Auditoria externa / Pentest | Terceiro/UnB | 90 dias | MÉDIA |
| Revisão anual DPIA/ROPA | DPO + Técnica | Nov 2027 | CONTÍNUA |

---

### 8.3 Assinaturas

**Encarregado de Proteção de Dados (DPO):**

________________________________________________________
Prof. Edison Ishikawa  
Data: ____/____/________

**Responsável Técnico (Projeto T.E.I.A.):**

________________________________________________________
[Nome do Responsável Técnico]  
Data: ____/____/________

**Representante Legal (UnB):**

________________________________________________________
[Nome/Reitoria]  
Data: ____/____/________

---

## 9. Anexos

- `docs/ROPA.md` — Registro de Atividades de Tratamento
- `docs/INCIDENT_RESPONSE.md` — Plano de Resposta a Incidentes
- `docs/RETENTION_POLICY.md` — Política de Retenção Detalhada
- `docs/DPAs/` — Templates de Contratos com Operadores
- `backend/kipo_playground/tests_security.py` — Testes de Segurança Automatizados
- `frontend/src/pages/PaginaDePrivacidade.jsx` — Política de Privacidade v1.0
- `frontend/src/pages/TermosDeUso.jsx` — Termos de Uso v4.0 (v4.1 planejada)