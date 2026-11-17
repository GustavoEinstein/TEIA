# Contratos de Processamento de Dados (DPAs) — Templates

Esta pasta contém templates de **Data Processing Agreements (DPAs)** / **Contratos de Tratamento de Dados** para operadores do projeto T.E.I.A., conforme **Art. 33 LGPD** e **Art. 28 GDPR** (referência internacional).

---

## Lista de Operadores Identificados (ROPA)

| Operador | Tipo | Finalidade | Status DPA |
|----------|------|------------|------------|
| Provedor Cloud (AWS / DigitalOcean / VPS) | Hospedagem, BD, Storage | Infraestrutura core | 🔄 **Template: `dpa-cloud-provider.md`** |
| Provedor E-mail (Google Workspace / Gmail SMTP) | E-mail transacional | Reset senha, notificações, boas-vindas | 🔄 **Template: `dpa-email-provider.md`** |
| Google Fonts / CDN (fonts.googleapis.com, fonts.gstatic.com) | CDN fontes | Carregamento fontes web | 🔄 **Template: `dpa-cdn-fonts.md`** (avaliar self-host) |
| Google Analytics (futuro) | Analytics | Métricas anonimizadas | 🔄 **Template: `dpa-analytics.md`** |
| UnB LiteLLM Router (`ia-router.unb.br`) | IA (modelos abertos) | Catalogação IA, planejamento aula | 🔄 **Template: `dpa-unb-llm.md`** |
| Google Gemini API (opcional) | IA (modelo comercial) | Catalogação IA alternativa | 🔄 **Template: `dpa-gemini.md`** |

---

## Como Usar

1. **Copie o template** correspondente ao operador
2. **Preencha os campos** entre `[COLCHETES]`
3. **Revise com Jurídico/UnB** e DPO
4. **Assine** (duas vias: Controlador + Operador)
5. **Arquive** cópia física/digital na DPO e no repositório (privado)
6. **Revise anualmente** ou na renovação contratual

---

## Cláusulas Obrigatórias (Art. 33 LGPD / Art. 28 GDPR)

Todo DPA deve conter, no mínimo:

| Cláusula | Descrição |
|----------|-----------|
| **Objeto e Escopo** | Categorias de dados, titulares, finalidades, duração, natureza do tratamento |
| **Obrigações do Operador** | Só tratar sob instruções documentadas, confidencialidade, segurança, subcontratação só com autorização prévia |
| **Medidas Técnicas/Organizacionais** | Criptografia, controle acesso, pseudonimização, resiliência, testes regulares |
| **Direitos dos Titulares** | Auxílio ao controlador para atender Arts. 18 LGPD (acesso, correção, eliminação, portabilidade) |
| **Notificação de Incidentes** | Comunicar ao controlador **em até 24h** após ciência (para que controlador notifique ANPD em 72h) |
| **Transferência Internacional** | Se houver: cláusulas contratuais padrão (SCC), decisão de adequação, ou BCR |
| **Auditoria e Inspeção** | Direito do controlador auditar (ou auditor terceirizado) conformidade do operador |
| **Devolução/Eliminação** | Ao fim do contrato: devolver ou eliminar dados (certificado de destruição) |
| **Responsabilidade e Indenização** | Operador responde por danos por descumprimento; cláusula penal opcional |
| **Lei e Foro** | Lei brasileira, Foro de Brasília/DF |

---

## Checklist de Due Diligence (Antes de Assinar)

- [ ] Operador tem certificações (ISO 27001, SOC 2, PCI DSS)?
- [ ] Políticas de segurança públicas/acessíveis?
- [ ] Histórico de vazamentos/incidentes?
- [ ] Subprocessadores divulgados? (lista anexa ao DPA)
- [ ] Localização data centers (Brasil? EUA? UE?) — impacto Art. 33 LGPD
- [ ] SLA de disponibilidade e suporte a incidentes?
- [ ] Capacidade de atender direitos titulares (API, portal, processo manual)?
- [ ] Seguro cyber / responsabilidade civil?

---

## Arquivos nesta Pasta

| Arquivo | Descrição |
|---------|-----------|
| `dpa-cloud-provider.md` | Template para provedor de hospedagem/cloud (AWS, DO, VPS) |
| `dpa-email-provider.md` | Template para provedor de e-mail transacional (Google, SendGrid, AWS SES) |
| `dpa-cdn-fonts.md` | Template para CDN de fontes (Google Fonts) — **recomenda-se self-host** |
| `dpa-analytics.md` | Template para analytics (Google Analytics, Matomo, Plausible) |
| `dpa-unb-llm.md` | Template para UnB LiteLLM Router (infra nacional) |
| `dpa-gemini.md` | Template para Google Gemini API (comercial, transferência internacional) |
| `subprocessors-list.md` | Modelo de lista de subprocessadores (anexo obrigatório) |

---

## Próximos Passos (Prioridade)

| Prioridade | Operador | Ação | Prazo |
|------------|----------|------|-------|
| **ALTA** | Cloud Provider | Assinar DPA + anexar subprocessadores | 30 dias |
| **ALTA** | E-mail Provider | Assinar DPA (Google Workspace ou SMTP) | 30 dias |
| **MÉDIA** | UnB LiteLLM | Formalizar contrato institucional + DPA | 60 dias |
| **MÉDIA** | Google Fonts | **Migrar para self-host** (elimina necessidade DPA) | 60 dias |
| **BAIXA** | Gemini API | Assinar DPA se for usar (hoje opcional, fallback local) | Quando ativar |
| **BAIXA** | Analytics | Assinar DPA quando implementar (hoje não usa) | Quando implementar |

---

**Responsável**: DPO (Prof. Edison Ishikawa) + Jurídico UnB + Equipe Técnica