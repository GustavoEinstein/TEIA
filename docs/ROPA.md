# Registro de Atividades de Tratamento (ROPA)
**Conforme Art. 37 da LGPD (Lei nº 13.709/2018)**

---

## 1. Identificação do Controlador

| Campo | Informação |
|-------|------------|
| **Nome/Razão Social** | Universidade de Brasília (UnB) |
| **CNPJ** | 00.038.174/0001-19 |
| **Endereço** | Campus Darcy Ribeiro, Asa Norte, Brasília/DF, CEP 70910-900 |
| **Representante Legal** | Reitor da UnB |
| **Encarregado (DPO)** | Prof. Edison Ishikawa |
| **Contato DPO** | ishikawa@unb.br |
| **Canal de Atendimento ao Titular** | suporte.ianaeducacaobasica.unb@gmail.com |

---

## 2. Atividades de Tratamento

### 2.1 Gestão de Conta e Autenticação de Usuários

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Criar, autenticar e gerenciar contas de professores na plataforma T.E.I.A. |
| **Base Legal** | **Art. 7º, V** — Execução de contrato (termos de uso aceitos no cadastro) |
| **Categoria de Dados** | Dados de identificação (nome, e-mail), dados profissionais (disciplina, escola), credenciais (senha hasheada), logs de acesso (IP, timestamp) |
| **Categoria de Titulares** | Profissionais da educação (maiores de 18 anos) |
| **Compartilhamento** | Nenhum (dados mantidos internamente) |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Enquanto a conta estiver ativa. Após exclusão: eliminação imediata de dados pessoais diretos; anonimização irreversível de produções públicas (Art. 12 LGPD) |
| **Medidas de Segurança** | Hash PBKDF2 (senha), JWT com rotação/blacklist, cookies HttpOnly/Secure/SameSite, HTTPS/TLS 1.2+, rate limiting (10 req/min login), CSP, headers de segurança |

---

### 2.2 Catalogação e Publicação de Práticas Pedagógicas

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Permitir que professores submetam, revisem (duplo-cego) e publiquem práticas pedagógicas com apoio de IA |
| **Base Legal** | **Art. 7º, V** — Execução de contrato (funcionalidade principal do serviço) |
| **Categoria de Dados** | Conteúdo didático (título, disciplina, nível, BNCC, metodologia, experiência, resultados), metadados de IA (modelo, prompts), arquivos anexos (PDF, DOCX, imagens), status de revisão |
| **Categoria de Titulares** | Professores autores e revisores |
| **Compartilhamento** | Público: produções aprovadas no Acervo (com opção de anonimato `exibir_autor=False`). Revisores: acesso cego ao conteúdo para avaliação |
| **Transferência Internacional** | Não se aplica (IA via provedores nacionais: Ollama local, UnB LiteLLM, Gemini com DPA) |
| **Retenção** | Produções públicas: permanentes no acervo (interesse histórico/pedagógico), anonimizadas após exclusão de conta. Rascunhos: enquanto usuário mantiver conta |
| **Medidas de Segurança** | Validação rigorosa de upload (magic bytes, MIME, 10MB), SSRF protection (WeasyPrint/Ollama), double-blind review (anonimato autor/revisor), controle de exibição de autor |

---

### 2.3 Sistema de Revisão Duplo-Cego e Gamificação

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Validar qualidade pedagógica via pares; engajar comunidade via XP/níveis/conquistas |
| **Base Legal** | **Art. 7º, V** — Execução de contrato (funcionalidade do serviço) |
| **Categoria de Dados** | Avaliações (notas 0-10 em 6 critérios, feedback), revisor (FK anonimizada durante processo), XP/histórico, conquistas, notificações |
| **Categoria de Titulares** | Professores autores e revisores |
| **Compartilhamento** | Avaliações: visíveis apenas ao autor após aprovação (sem identificação do revisor). Ranking: opcional (pseudônimo ou exclusão) |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Avaliações: permanentes vinculadas à produção. XP/histórico: eliminados com exclusão de conta |
| **Medidas de Segurança** | Anonimato duplo-cego enforceado no backend (`exibir_autor` + status), anti-fraude no XP (throttling, validação server-side) |

---

### 2.4 Fórum de Rascunhos e Interação Comunitária

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Permitir discussão pedagógica, dúvidas BNCC, sugestões entre professores |
| **Base Legal** | **Art. 7º, V** — Execução de contrato |
| **Categoria de Dados** | Tópicos (título, conteúdo, categoria), comentários, anexos, autor (FK nullable para anonimização) |
| **Categoria de Titulares** | Usuários autenticados |
| **Compartilhamento** | Público entre usuários logados |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Enquanto conta ativa; anonimização (`autor=NULL`) na exclusão de conta |
| **Medidas de Segurança** | Sanitização de entrada, validação de upload, rate limiting |

---

### 2.5 Segurança, Prevenção a Fraudes e Auditoria

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Proteger integridade da plataforma, detectar abusos, cumprir obrigações legais |
| **Base Legal** | **Art. 7º, IX** — Legítimo interesse (segurança, prevenção a fraudes) + **Art. 7º, II** — Obrigação legal (Art. 15 MCI: logs 6 meses) |
| **Categoria de Dados** | Logs de acesso (IP, timestamp, endpoint, user-agent), tentativas de login, ações administrativas, tokens de reset de senha (cache 1h) |
| **Categoria de Titulares** | Todos os usuários (autenticados e anônimos) |
| **Compartilhamento** | Autoridades competentes mediante ordem judicial |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Logs de acesso: **6 meses** (Art. 15 Marco Civil da Internet). Tokens reset: 1 hora (cache). Auditoria admin: 2 anos |
| **Medidas de Segurança** | Logs estruturados (JSON), PII masking em CRM, headers de segurança, CSP, HSTS, COOP/COEP |

---

### 2.6 Pesquisa Acadêmica (Dados Anonimizados)

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Estudos sobre práticas pedagógicas com IA, adoção tecnológica, eficácia duplo-cego |
| **Base Legal** | **Art. 7º, IV** — Estudos por órgão de pesquisa (UnB) + **Art. 7º, IX** — Legítimo interesse (dados agregados/anonimizados) |
| **Categoria de Dados** | Dados **agregados e anonimizados**: estatísticas de uso, disciplinas, modelos IA, notas de revisão (sem identificadores) |
| **Categoria de Titulares** | Usuários da plataforma (dados dissociados) |
| **Compartilhamento** | Pesquisadores UnB vinculados ao projeto, mediante aprovação CEP/Plataforma Brasil (Res. CNS 510/2016) |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Dados anonimizados: permanentes para série histórica |
| **Medidas de Segurança** | Anonimização irreversível (k-anonymity, supressão/generalização), TCLE quando dados identificáveis |

---

### 2.7 Comunicação com Usuários (E-mail Transacional)

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Enviar: confirmação de cadastro, reset de senha, notificações de aprovação/revisão, alterações contratuais |
| **Base Legal** | **Art. 7º, V** — Execução de contrato + **Art. 7º, IX** — Legítimo interesse (comunicação essencial) |
| **Categoria de Dados** | E-mail, nome (para personalização), token de reset (single-use, 1h) |
| **Categoria de Titulares** | Usuários cadastrados |
| **Compartilhamento** | Operador de e-mail (SMTP/Gmail) — sob DPA |
| **Transferência Internacional** | Gmail (Google) — cláusulas contratuais padrão (Art. 33 LGPD) |
| **Retenção** | E-mails não armazenados pela plataforma; logs de envio: 6 meses |
| **Medidas de Segurança** | TLS 1.2+ no SMTP, tokens single-use com blacklist, rate limiting (3/h request, 5/h confirm) |

---

### 2.8 Consentimento de Cookies e Preferências

| Aspecto | Detalhamento |
|---------|--------------|
| **Finalidade** | Gerenciar consentimento granular para cookies não essenciais (analytics, marketing futuro) |
| **Base Legal** | **Art. 7º, I** — Consentimento (Art. 8 LGPD: livre, informado, inequívoco) |
| **Categoria de Dados** | Categoria de consentimento (essential/analytics/marketing), timestamp, versão da política |
| **Categoria de Titulares** | Visitantes e usuários |
| **Compartilhamento** | Não se aplica (armazenado localmente + backend) |
| **Transferência Internacional** | Não se aplica |
| **Retenção** | Enquanto consentimento válido; renovação a cada mudança de versão/política |
| **Medidas de Segurança** | Banner com categorias detalhadas, sincronização localStorage→backend no login, revogação a qualquer momento |

---

## 3. Operadores (Subcontratados)

| Operador | Finalidade | Base Legal Compartilhamento | DPA Status |
|----------|------------|----------------------------|------------|
| Provedor de Hospedagem (ex: AWS, DigitalOcean, VPS) | Infraestrutura, banco de dados, armazenamento | Art. 7º, IX (legítimo interesse) + Art. 33 (transferência) | **PENDENTE** — Template em `docs/DPAs/` |
| Provedor de E-mail (Gmail/SMTP) | Envio de e-mails transacionais | Art. 7º, V + IX | **PENDENTE** |
| Google Fonts / CDN (fonts.googleapis.com, fonts.gstatic.com) | Carregamento de fontes | Art. 7º, IX | **PENDENTE** (avaliar self-host) |
| Google Analytics (futuro) | Métricas de uso anonimizadas | Art. 7º, I (consentimento) | **PENDENTE** |
| UnB LiteLLM Router (`ia-router.unb.br`) | Inferência IA (modelos abertos) | Art. 7º, V (execução contrato) | **PENDENTE** |
| Google Gemini API (opcional) | Inferência IA (modelo comercial) | Art. 7º, V | **PENDENTE** |

---

## 4. Medidas Técnicas e Organizacionais de Segurança (Art. 46 LGPD)

| Medida | Implementação |
|--------|---------------|
| **Criptografia em trânsito** | TLS 1.2+ (HTTPS), HSTS 1 ano, Secure cookies |
| **Criptografia em repouso** | Senhas: PBKDF2 (Django). BD: criptografia de disco (infra). *Pendente: campos sensíveis* |
| **Controle de acesso** | RBAC (user/admin/superuser), JWT stateless, refresh rotation + blacklist, MFA admins (planejado) |
| **Minimização** | Coleta apenas dados necessários. Escola opcional (planejado). Anonimização em exclusão |
| **Pseudonimização/Anonimização** | Duplo-cego (FK nullable), anonimização irreversível Art. 12 na exclusão |
| **Logs e Auditoria** | Logs estruturados JSON (planejado), PII masking CRM, admin audit log (planejado) |
| **Backup e Recuperação** | Script automatizado + restore testado (planejado) |
| **Resposta a Incidentes** | Runbook documentado (planejado), canal DPO, SLA 72h ANPD |
| **Treinamento** | Equipe técnica ciente de LGPD/Segurança. Documentação interna |
| **Desenvolvimento Seguro** | Validação upload (magic bytes/MIME), SSRF protection, CSP, throttling, testes security |

---

## 5. Direitos dos Titulares — Como São Atendidos

| Direito (Art. 18 LGPD) | Canal | Prazo | Implementação |
|------------------------|-------|-------|---------------|
| Confirmação e Acesso | Perfil → "Baixar meus dados" / DPO e-mail | 15 dias | `GET /api/user/export-data/` (JSON completo) |
| Correção | Perfil → Editar dados / DPO e-mail | 15 dias | `PUT /api/user/me/` |
| Anonimização/Bloqueio/Eliminação | Perfil → "Excluir conta" / DPO e-mail | 15 dias | `DELETE /api/user/delete-account/` (anonimização Art. 12) |
| Portabilidade | Perfil → "Baixar meus dados" | 15 dias | JSON estruturado, legível por máquina |
| Revogação Consentimento | Perfil → Conta (cookies) / DPO e-mail | Imediato | `PATCH /api/user/consent/` + banner cookies |
| Oposição | DPO e-mail | 15 dias | Processo manual via DPO (perfilamento XP) |
| Informação Compartilhamento | DPO e-mail / Política Privacidade | 15 dias | Seção 4 da Política de Privacidade |

---

## 6. Transferência Internacional de Dados

| Destino | Finalidade | Salvaguarda (Art. 33 LGPD) |
|---------|------------|----------------------------|
| Google (Gmail SMTP, Fonts, Gemini API) | E-mail, fontes, IA opcional | Cláusulas contratuais padrão (SCC) + decisão de adequação parcial |
| UnB LiteLLM Router | IA (modelos abertos) | Infraestrutura nacional UnB, contrato institucional |

---

## 7. Retenção e Eliminação — Resumo por Categoria

| Categoria de Dados | Período de Retenção | Base Legal | Destinação Final |
|--------------------|---------------------|------------|------------------|
| Dados de conta (nome, e-mail, perfil) | Conta ativa | Art. 7º, V | Eliminação na exclusão |
| Senha (hash) | Conta ativa | Art. 7º, V | Eliminação na exclusão |
| Logs de acesso (IP, timestamp) | **6 meses** | Art. 15 MCI | Eliminação automática (job cron) |
| Produções didáticas (conteúdo) | Permanente (anonimizada) | Art. 7º, V + Interesse histórico | Anonimização irreversível (Art. 12) |
| Avaliações/Revisões | Permanente (anonimizada) | Art. 7º, V | Anonimização (`revisor=NULL`) |
| Fórum (tópicos/comentários) | Conta ativa / Permanente anonimizado | Art. 7º, V | Anonimização (`autor=NULL`) |
| XP/Conquistas/Notificações | Conta ativa | Art. 7º, V | Eliminação na exclusão |
| Tokens reset senha (cache) | **1 hora** | Art. 7º, IX | Expiração automática (TTL) |
| Consentimentos (termos, privacidade, cookies) | Conta ativa + 5 anos auditoria | Art. 7º, I + Obrigação legal | Arquivamento pós-exclusão |

---

## 8. Controle e Atualização deste Registro

| Item | Detalhamento |
|------|--------------|
| **Versão** | 1.0 |
| **Data de Criação** | Novembro 2026 |
| **Responsável pela Atualização** | DPO (Prof. Edison Ishikawa) + Equipe Técnica T.E.I.A. |
| **Frequência de Revisão** | Anual ou quando houver mudança significativa no tratamento |
| **Próxima Revisão** | Novembro 2027 |
| **Local de Arquivamento** | Repositório do projeto (`docs/ROPA.md`) + cópia física/digital na DPO |

---

## 9. Anexos Referenciados

- `docs/DPIA.md` — Avaliação de Impacto à Proteção de Dados
- `docs/INCIDENT_RESPONSE.md` — Plano de Resposta a Incidentes
- `docs/RETENTION_POLICY.md` — Política de Retenção Detalhada
- `docs/DPAs/` — Contratos com Operadores (templates)
- `frontend/src/pages/PaginaDePrivacidade.jsx` — Política de Privacidade (versão 1.0)
- `frontend/src/pages/TermosDeUso.jsx` — Termos de Uso (versão 4.0)
- `backend/kipo_playground/security.py` — Utilitários de segurança (PII masking, SSRF, upload validation)
- `backend/kipo_playground/security_middleware.py` — Headers de segurança HTTP
- `backend/kipo_playground/tests_security.py` — Testes de segurança automatizados

---

**Assinatura do Encarregado (DPO):**

________________________________________________________
Prof. Edison Ishikawa  
Encarregado de Proteção de Dados — T.E.I.A. / UnB  
Data: ____/____/________