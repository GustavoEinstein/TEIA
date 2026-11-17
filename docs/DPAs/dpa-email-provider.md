# DPA — Provedor de E-mail Transacional (Google Workspace / Gmail SMTP / SendGrid / AWS SES)

**CONTRATO DE TRATAMENTO DE DADOS PESSOAIS**
**Entre Controlador e Operador — Conforme Art. 33 LGPD / Art. 28 GDPR**

---

## 1. PARTES

| **CONTROLADOR** | **OPERADOR** |
|-----------------|--------------|
| **Nome**: Universidade de Brasília (UnB) | **Nome**: `[Google LLC / SendGrid (Twilio) / Amazon Web Services]` |
| **CNPJ**: 00.038.174/0001-19 | **CNPJ/Entidade**: `[CNPJ Brasil se aplicável / Entidade Estrangeira]` |
| **Endereço**: Campus Darcy Ribeiro, Asa Norte, Brasília/DF, CEP 70910-900 | **Endereço**: `[SEDE GLOBAL]` |
| **DPO**: Prof. Edison Ishikawa (ishikawa@unb.br) | **Contato Privacidade**: `[privacy@ / dpo@ / trust@]` |
| **Projeto**: T.E.I.A. | **Serviço**: `[Gmail SMTP / Google Workspace / SendGrid API / AWS SES]` |

---

## 2. OBJETO E ESCOPO

### 2.1 Serviços
Envio de e-mails **transacionais** (não marketing) da plataforma T.E.I.A.:
- Confirmação de cadastro / boas-vindas
- Reset de senha (token single-use, 1h)
- Notificação de aprovação de conta
- Notificação de revisão de prática (atribuída/concluída)
- Alerta de alterações nos Termos/Política (30 dias antecedência)
- Comunicação de incidente de segurança (se necessário)

### 2.2 Dados Pessoais Tratados
| Dado | Finalidade | Retenção Operador |
|------|------------|-------------------|
| E-mail do destinatário | Entrega da mensagem | Logs de entrega: 30-90 dias (padrão provedor) |
| Nome (personalização) | "Olá, [Nome]" | Apenas no payload da API/SMTP; não armazenado separadamente |
| Token de reset (no link) | Link único de recuperação | No corpo do e-mail; logs de clique (se tracking habilitado) |
| IP / User-Agent / Timestamp (metadados) | Segurança, anti-spam, entrega | Conforme política provedor (tipicamente 30-365 dias) |

> **Não são enviados**: CPF, RG, endereço, telefone, dados sensíveis, senhas, tokens JWT completos.

### 2.3 Titulares
Usuários cadastrados na T.E.I.A. (professores >18 anos). Volume: ~`[N]` e-mails/mês.

### 2.4 Finalidade Restrita
**Exclusivamente**: entrega de e-mails transacionais solicitados pela API/SMTP do Controlador.
**Vedado**: uso para marketing próprio, perfilamento, treinamento IA, publicidade, revenda, enriquecimento de base.

### 2.5 Duração
Conforme contrato principal. Pós-término: eliminação de logs em até 30 dias.

---

## 3. OBRIGAÇÕES DO OPERADOR

### 3.1 Medidas de Segurança Específicas para E-mail
| Medida | Requisito |
|--------|-----------|
| **TLS Forçado** | STARTTLS obrigatório (porta 587) ou TLS implícito (465); recusar se não suportado |
| **Autenticação** | SPF, DKIM, DMARC (p=reject/quarantine) configurados no domínio `teia.unb.br` |
| **Supressão de Logs Sensíveis** | Não logar corpo do e-mail, tokens, PII em logs de auditoria acessíveis a terceiros |
| **Retenção Mínima** | Logs de entrega (sucesso/falha, timestamp, IP destinatário): máx. 90 dias |
| **Acesso Restrito** | Apenas engenheiros de delivery/abuse; MFA obrigatório no console admin |
| **Certificações** | ISO 27001, SOC 2 Type II, CSA STAR (comprovação anual) |

### 3.2 Transferência Internacional (Google / AWS / Twilio — sedes EUA)
| Salvaguarda | Status |
|-------------|--------|
| **SCC (Cláusulas Padrão)** | ✅ Google Workspace DPA / AWS DPA / Twilio DPA incluem SCC 2021 |
| **Medidas Suplementares** | Criptografia em trânsito (TLS 1.2+), token reset single-use (baixo risco), pseudonimização não aplicável (e-mail é identificador direto) |
| **Decisão Adequação** | Não (EUA sem adequação plena LGPD) |

> **Nota**: Controlador opta por provedor com DPA público robusto (Google/AWS/Twilio) e SCC incorporadas.

### 3.3 Subprocessadores Comuns (já cobertos no DPA principal do provedor)
- Google: Subprocessadores listados em `workspace.google.com/terms/dpa_subprocessors.html`
- AWS: Subprocessadores em `aws.amazon.com/compliance/gdpr-center/`
- Twilio/SendGrid: Subprocessadores em `twilio.com/legal/gdpr`

### 3.4 Auxílio a Direitos dos Titulares
| Direito | Como Operador Atende |
|---------|---------------------|
| Acesso / Portabilidade | Exportar logs de entrega do usuário (API/Console) — formato CSV/JSON |
| Eliminação / Supressão | Delete logs via API/Console (GDPR/CCPA delete request) |
| Retificação | N/A (dados vêm do Controlador a cada envio) |
| Oposição / Restrição | Controlador para de enviar (unsubscribe/suppression list) |

**SLA Resposta**: ≤ 10 dias úteis após solicitação Controlador.

### 3.5 Notificação de Incidentes
| Evento | Prazo | Exemplo |
|--------|-------|---------|
| Vazamento de logs de e-mail com PII | ≤ 24h | Acesso não autorizado a painel/admin, exfiltração logs |
| Falha entrega em massa (não segurança) | ≤ 48h | Blacklist, reputação IP, configuração DKIM/SPF |
| Vulnerabilidade crítica (ex: RCE em API) | ≤ 24h | CVE explorável no serviço |

---

## 4. CONFIGURAÇÕES TÉCNICAS REQUERIDAS (Controlador → Operador)

### 4.1 Domínio e Autenticação
```dns
; SPF (TXT @)
v=spf1 include:_spf.google.com ~all          ; Google
v=spf1 include:sendgrid.net ~all             ; SendGrid
v=spf1 include:amazonses.com ~all            ; AWS SES

; DKIM (CNAME ou TXT)
google._domainkey   →  google.com (Google gerencia)
s1._domainkey       →  sendgrid.net
ses._domainkey      →  amazonses.com

; DMARC (TXT _dmarc)
v=DMARC1; p=reject; rua=mailto:dmarc@teia.unb.br; ruf=mailto:dmarc@teia.unb.br; fo=1; adkim=s; aspf=s
```

### 4.2 Supression List / Unsubscribe
- Controlador mantém **lista de supressão** (opt-out, bounce, complaint, conta excluída)
- Sincronização: API `/v3/suppression/bounces` (SendGrid) / `ListUnsubscribed` (SES) / Groups (Google)
- **Não enviar** para: contas excluídas, e-mails com bounce hard, spam complaint

### 4.3 Rate Limits e Boas Práticas
- Respeitar limites do provedor (ex: SES sandbox → produção, SendGrid 100k/mês)
- Warm-up IP dedicado se volume > 50k/mês
- Monitorar: delivery rate > 98%, bounce < 2%, complaint < 0.1%

---

## 5. TRANSFERÊNCIA INTERNACIONAL — ANEXO SCC

Como o Operador é entidade estrangeira (Google EUA, AWS EUA, Twilio EUA), aplicam-se as **Cláusulas Contratuais Padrão (SCC) da Comissão Europeia 2021 / ANPD**, incorporadas por referência no DPA público do provedor.

**Link DPA Público do Provedor** (deve ser anexado):
- Google Workspace: `https://workspace.google.com/terms/dpa.html`
- AWS: `https://aws.amazon.com/pt/agreements/gdpr-data-processing-addendum/`
- Twilio/SendGrid: `https://www.twilio.com/legal/gdpr/data-processing-addendum`

---

## 6. DEVOLUÇÃO/ELIMINAÇÃO (FIM DO CONTRATO)

| Ação | Prazo |
|------|-------|
| Exportar logs de entrega (últimos 12 meses) para Controlador | ≤ 15 dias |
| Eliminar todos os logs, supression lists, templates, configurações do domínio | ≤ 30 dias |
| Confirmar eliminação por escrito (certificado) | ≤ 30 dias |

---

## 7. RESPONSABILIDADE

- Operador indeniza Controlador por: vazamento logs, falha entrega crítica (reset senha não chega), violação DPA/LGPD
- Multas ANPD / indenizações titulares / custos notificação / honorários
- Seguro Cyber: mínimo **R$ 2.000.000,00** (apólice anexa)

---

## 8. LEI E FORO

Lei brasileira. **Foro de Brasília/DF**. Mediação prévia (Câmara FGV).

---

## 9. ANEXOS

| Anexo | Descrição |
|-------|-----------|
| **Anexo A** | DPA Público do Provedor (Google/AWS/Twilio) — incorporado por referência |
| **Anexo B** | SCC (Cláusulas Padrão) — se não cobertas no DPA público |
| **Anexo C** | Configuração DNS (SPF/DKIM/DMARC) — print console |
| **Anexo D** | Certificados Segurança (ISO 27001, SOC 2) |
| **Anexo E** | Apólice Seguro Cyber |
| **Anexo F** | Lista Subprocessadores (link público do provedor) |

---

## 10. ASSINATURAS

**CONTROLADOR — Universidade de Brasília (UnB)**

________________________________________________________
`[REITOR/PROCURADOR]` — Representante Legal  
Data: ____/____/________

________________________________________________________
Prof. Edison Ishikawa — DPO  
Data: ____/____/________

---

**OPERADOR — `[NOME PROVEDOR]`**

________________________________________________________
`[REPRESENTANTE LEGAL]`  
Data: ____/____/________

________________________________________________________
`[DPO/POC PRIVACIDADE]`  
Data: ____/____/________