# DPA — Provedor de Hospedagem / Cloud (AWS, DigitalOcean, VPS, etc.)

**CONTRATO DE TRATAMENTO DE DADOS PESSOAIS**
**Entre Controlador e Operador — Conforme Art. 33 LGPD / Art. 28 GDPR**

---

## 1. PARTES

| **CONTROLADOR** | **OPERADOR** |
|-----------------|--------------|
| **Nome**: Universidade de Brasília (UnB) | **Nome**: `[NOME DO PROVEDOR]` |
| **CNPJ**: 00.038.174/0001-19 | **CNPJ/CPF**: `[CNPJ DO PROVEDOR]` |
| **Endereço**: Campus Darcy Ribeiro, Asa Norte, Brasília/DF, CEP 70910-900 | **Endereço**: `[ENDEREÇO COMPLETO]` |
| **Representante**: `[NOME REITOR/PROCURADOR]` | **Representante**: `[NOME REPRESENTANTE LEGAL]` |
| **DPO**: Prof. Edison Ishikawa (ishikawa@unb.br) | **Contato Privacidade**: `[E-MAIL DPO/POC OPERADOR]` |
| **Projeto**: T.E.I.A. (Tecendo a Educação com Inteligência Artificial) | **Serviço**: `[EX: AWS EC2/RDS/S3, DigitalOcean Droplets/Spaces, VPS Dedicado]` |

---

## 2. OBJETO E ESCOPO DO TRATAMENTO

### 2.1 Descrição dos Serviços
O Operador fornecerá infraestrutura de hospedagem para a plataforma T.E.I.A., incluindo, mas não se limitando a:
- Servidores de aplicação (backend Django + frontend React)
- Banco de dados gerenciado (PostgreSQL) ou VM com PostgreSQL/SQLite
- Armazenamento de arquivos estáticos e mídia (S3-compatível, volumes block, object storage)
- Rede, balanceamento de carga, DNS, certificados TLS
- Backup gerenciado / snapshots / point-in-time recovery (PITR)

### 2.2 Categorias de Dados Pessoais Tratados
| Categoria | Exemplos | Sensível? |
|-----------|----------|-----------|
| Identificação | Nome completo, e-mail | Não |
| Profissional | Disciplina, escola/instituição | Não |
| Autenticação | Hash senha (PBKDF2), tokens JWT (em trânsito) | Não |
| Navegação/Segurança | IP, timestamp, user-agent, logs de acesso | Não |
| Conteúdo Gerado | Práticas pedagógicas, avaliações, fórum, prompts IA | Não* |
| Gamificação | XP, nível, conquistas, histórico | Não |
| Consentimentos | Versão termos, timestamps, cookies | Não |

> *Podem conter opiniões indiretas. Não são coletados dados sensíveis intencionalmente (Art. 5º LGPD).

### 2.3 Categorias de Titulares
Profissionais da educação (professores, coordenadores, gestores) maiores de 18 anos, cadastrados na plataforma T.E.I.A. Estimativa: `[NÚMERO]` titulares ativos.

### 2.4 Finalidades do Tratamento pelo Operador
Exclusivamente: **hospedamento, armazenamento, processamento, backup e disponibilidade** dos sistemas do Controlador. **Vedado** uso para: analytics próprio, marketing, treinamento de IA, perfilamento, venda/cessão a terceiros.

### 2.5 Duração
Vigência: `[DATA INÍCIO]` a `[DATA FIM]` ou enquanto durar o contrato principal de prestação de serviços. Pós-término: 30 dias para devolução/eliminação certificada.

### 2.6 Localização do Tratamento (Data Centers)
| Região | Provedor | Justificativa Art. 33 LGPD |
|--------|----------|----------------------------|
| `[EX: São Paulo - GRU]` | `[AWS sa-east-1 / DO SFO3 / VPS BR]` | **Brasil** — adequação automática |
| `[EX: Virgínia - IAD]` | `[AWS us-east-1]` | **Transferência Internacional** — Requer SCC/Cláusulas Padrão (Anexo B) |

> **Obrigatório**: Operador deve notificar Controlador **com 30 dias de antecedência** de qualquer mudança de região/data center que envolva transferência internacional.

---

## 3. OBRIGAÇÕES DO OPERADOR

### 3.1 Instruções Documentadas
O Operador tratará dados **apenas** conforme:
- Este DPA
- Contrato principal de serviços
- Instruções escritas do Controlador (e-mail DPO ou ticket oficial)
- Leis aplicáveis (LGPD, Marco Civil, normas ANPD)

### 3.2 Confidencialidade
- Garantir que **pessoas autorizadas** (funcionários, subcontratados) assinem termo de confidencialidade
- Treinamento obrigatório em proteção de dados (anual, comprovado)
- Acesso por **menor privilégio** (need-to-know)

### 3.3 Medidas Técnicas e Organizacionais de Segurança (Mínimas)
| Medida | Requisito | Evidência/Comprovação |
|--------|-----------|----------------------|
| **Criptografia em trânsito** | TLS 1.2+ em todas as conexões (API, DB, Storage, Painel) | Relatório SSL Labs A+, configuração Nginx/ALB |
| **Criptografia em repouso** | AES-256 (volumes, BD, backups, object storage) | Print console KMS/CMK, policy encryption |
| **Controle de acesso** | IAM/RBAC, MFA obrigatório para console/admin, SSH keys apenas | Política IAM exportada, logs CloudTrail/Audit |
| **Segmentação de rede** | VPC privada, Security Groups restritivos, sem IP público no DB | Diagrama arquitetura, SG rules export |
| **Monitoramento e Alertas** | SIEM/CloudTrail/GuardDuty, alertas em <15min para anomalias | Dashboard monitoramento, runbook alertas |
| **Gestão de Vulnerabilidades** | Patch automático SO (managed), scan semanal, CVE critical ≤48h | Relatório scanner (Qualys/Tenable/Trivy) |
| **Backup e Recuperação** | Backup diário + PITR (RPO <1h, RTO <4h), teste restore mensal | Relatório restore test, policy backup |
| **Resposta a Incidentes** | Runbook próprio, notificação Controlador **≤24h** após ciência | Runbook compartilhado, SLA contratual |
| **Eliminação Segura** | NIST SP 800-88 (crypto-shred para cloud, degauss/físico para on-prem) | Certificado destruição ao fim do contrato |

### 3.4 Subprocessadores
| Subprocessador | Finalidade | Localização | DPA Assinado? |
|----------------|------------|-------------|---------------|
| `[EX: AWS]` | Infraestrutura base | `[Regiões]` | Sim (AWS DPA) |
| `[EX: Datadog]` | APM/Logs/Metrics | `[Região]` | 🔄 Pendente |
| `[EX: PagerDuty]` | Alerting/On-call | `[Região]` | 🔄 Pendente |

**Regra**: Novo subprocessador → **autorização prévia por escrito** do Controlador (30 dias para objeção). Lista atualizada anexa (Anexo A).

### 3.5 Auxílio aos Direitos dos Titulares (Art. 18 LGPD)
O Operador deverá, **em até 5 dias úteis** após solicitação do Controlador:
- Fornecer cópia de dados (portabilidade) — formato estruturado (JSON/CSV/SQL dump)
- Aplicar correção/eliminação/anomimização em bases/backups
- Restringir processamento (se tecnicamente viável)
- Confirmar ação realizada

### 3.6 Notificação de Incidentes de Segurança
| Evento | Prazo Notificação Controlador | Canal |
|--------|------------------------------|-------|
| Incidente confirmado (vazamento, acesso não autorizado, perda, alteração) | **≤ 24 horas** | E-mail DPO (ishikawa@unb.br) + Telefone emergência + Ticket crítico |
| Suspeita fundamentada | ≤ 48 horas | E-mail DPO |
| Vulnerabilidade crítica explorável (CVE critical no ambiente) | ≤ 24 horas | E-mail DPO + Ticket |

**Conteúdo mínimo**: natureza, dados afetados, titulares estimados, consequências, medidas adotadas, contato POC operador.

### 3.7 Auditoria e Inspeção
Controlador (ou auditor terceirizado independente) poderá:
- Solicitar relatórios SOC 2 Type II / ISO 27001 / PCI DSS (anual)
- Realizar **auditoria remota** (questionário + evidências) — 1x/ano
- Realizar **auditoria in loco** (se risco alto) — mediante 30 dias aviso prévio
- Operador coopera integralmente, sem custo adicional

---

## 4. OBRIGAÇÕES DO CONTROLADOR

- Fornecer instruções claras e documentadas
- Garantir base legal para todo tratamento (ROPA atualizado)
- Responder solicitações do Operador em tempo hábil (máx. 10 dias úteis)
- Notificar Operador sobre alterações na finalidade/escopo
- Manter DPO acessível para coordenação

---

## 5. TRANSFERÊNCIA INTERNACIONAL DE DADOS (Art. 33 LGPD)

Se houver tratamento fora do Brasil (ex: região `us-east-1`, `eu-west-1`):

| Salvaguarda Aplicada | Detalhamento |
|----------------------|--------------|
| **Cláusulas Contratuais Padrão (SCC)** | Anexo B deste DPA — versão ANPD/Comissão Europeia 2021 |
| **Decisão de Adequação** | Não se aplica (EUA não tem adequação plena LGPD) |
| **BCR (Binding Corporate Rules)** | Se Operador possuir — anexar certificado |
| **Medidas Suplementares** | Criptografia client-side (chave Controlador), pseudonimização prévia, contratos adicionais |

> **Proibido**: Transferência para países sem adequação e sem salvaguardas contratuais válidas.

---

## 6. DEVOLUÇÃO E ELIMINAÇÃO DE DADOS (Fim do Contrato)

| Ação | Prazo | Comprovação |
|------|-------|-------------|
| **Devolução** (dump BD, export object storage, configs) | ≤ 30 dias após término | Link download criptografado (age/GPG) + hash SHA256 |
| **Eliminação** (todos os backups, snapshots, logs, caches) | ≤ 30 dias após devolução confirmada | **Certificado de Destruição** assinado por responsável técnico + DPO operador |
| **Confirmação Controlador** | ≤ 10 dias após recebimento | E-mail DPO confirmando integridade |

---

## 7. RESPONSABILIDADE E INDENIZAÇÃO

- Operador responde por **danos diretos e indiretos** decorrentes de descumprimento deste DPA, LGPD ou normas ANPD
- Inclui: multas ANPD, indenizações a titulares, custos de notificação, honorários advocatícios, danos reputacionais
- **Limitação de responsabilidade** do contrato principal **não se aplica** a violações de proteção de dados (Art. 42 LGPD)
- Seguro Cyber Responsabilidade Civil: **mínimo R$ [VALOR]** (ex: R$ 5.000.000,00) — apólice anexa

---

## 8. VIGÊNCIA, RESCISÃO E ALTERAÇÕES

| Evento | Regra |
|--------|-------|
| **Vigência** | Conforme Seção 2.5 |
| **Rescisão por descumprimento LGPD** | Controlador pode rescindir **imediatamente** (sem aviso prévio) se Operador violar cláusulas de segurança, notificação incidente, ou transferência internacional |
| **Rescisão por conveniência** | 90 dias aviso prévio; obrigações de devolução/eliminação sobrevivem |
| **Alterações** | Somente por aditivo assinado por ambas as partes; alterações LGPD/ANPD entram em vigor automaticamente |

---

## 9. LEI APLICÁVEL E FORO

- Lei brasileira (LGPD, Marco Civil, CDC, Código Civil)
- **Foro da Comarca de Brasília/DF** — eleito de comum acordo
- Mediação prévia obrigatória (Câmara FGV ou similar) antes de litígio judicial

---

## 10. ANEXOS

| Anexo | Descrição | Obrigatório? |
|-------|-----------|--------------|
| **Anexo A** | Lista de Subprocessadores (atualizada trimestralmente) | ✅ Sim |
| **Anexo B** | Cláusulas Contratuais Padrão (SCC) — Transferência Internacional | ✅ Se houver transferência |
| **Anexo C** | Medidas Técnicas Detalhadas (questionário CAIQ / SIG) | ✅ Sim |
| **Anexo D** | Certificados (ISO 27001, SOC 2, PCI DSS) | ✅ Se aplicável |
| **Anexo E** | Apólice Seguro Cyber | ✅ Sim |
| **Anexo F** | Runbook Resposta a Incidentes do Operador | ✅ Sim |

---

## 11. ASSINATURAS

**CONTROLADOR — Universidade de Brasília (UnB)**

________________________________________________________
`[NOME REITOR/PROCURADOR]` — Representante Legal  
Data: ____/____/________

________________________________________________________
Prof. Edison Ishikawa — Encarregado de Proteção de Dados (DPO)  
Data: ____/____/________

---

**OPERADOR — `[NOME DO PROVEDOR]`**

________________________________________________________
`[NOME REPRESENTANTE LEGAL]` — Representante Legal  
Data: ____/____/________

________________________________________________________
`[NOME DPO/POC PRIVACIDADE]` — Encarregado/POC Privacidade  
Data: ____/____/________