# Política de Retenção e Eliminação de Dados
**T.E.I.A. — Universidade de Brasília (UnB)**
**Versão 1.0 — Novembro 2026**

---

## 1. Objetivo

Estabelecer regras claras, objetivas e auditáveis para **retenção, arquivamento e eliminação** de dados pessoais e operacionais da plataforma T.E.I.A., em conformidade com:
- **LGPD** (Lei 13.709/2018) — Arts. 6º, 12, 15, 16, 37, 46
- **Marco Civil da Internet** (Lei 12.965/2014) — Art. 15
- **Código de Defesa do Consumidor** (Lei 8.078/1990) — Art. 27
- **Normas da ANPD** — Guias de Boas Práticas, Retenção

---

## 2. Princípios Norteadores

| Princípio | Aplicação |
|-----------|-----------|
| **Necessidade** | Manter apenas pelo tempo estritamente necessário à finalidade |
| **Proporcionalidade** | Prazo proporcional à sensibilidade e risco do dado |
| **Finalidade** | Não reter para finalidades incompatíveis com a coleta original |
| **Minimização** | Eliminar ou anonimizar assim que a finalidade for atingida |
| **Transparência** | Prazos divulgados na Política de Privacidade e ROPA |
| **Segurança** | Proteção adequada durante todo o ciclo de vida (incluindo eliminação) |
| **Auditabilidade** | Registros de eliminação (logs, certificados) rastreáveis |

---

## 3. Tabela Mestra de Retenção

| Categoria | Dados Específicos | Período de Retenção | Base Legal | Ação Fim do Prazo | Responsável |
|-----------|-------------------|---------------------|------------|-------------------|-------------|
| **CONTA E AUTENTICAÇÃO** | | | | | |
| Dados cadastrais (nome, e-mail, disciplina, escola) | `auth_user`, `kipo_playground_profile` | **Enquanto conta ativa** + 30 dias pós-exclusão (auditoria) | Art. 7º, V (contrato) | **Eliminação** (anonymize → delete) | Backend (job conta excluída) |
| Hash de senha (PBKDF2) | `auth_user.password` | Enquanto conta ativa | Art. 7º, V + Segurança | Eliminação com conta | Backend |
| Tokens JWT (access/refresh) | Redis / Cookie HttpOnly | Access: 45 min / Refresh: 7 dias (rotação) | Art. 7º, IX (legítimo interesse) | Expiração automática / Blacklist | SIMPLE_JWT |
| Tokens reset senha (cache) | `cache:password_reset:{uid}:{token}` | **1 hora** (TTL) | Art. 7º, IX | Expiração automática (cache) | Backend |
| **LOGS E SEGURANÇA** | | | | | |
| Logs de acesso (Nginx/Django) | IP, timestamp, método, path, status, user-agent | **6 meses** (180 dias) | Art. 15 MCI + Art. 7º, IX | **Eliminação automática** (job cron) | Infra/Backend (`cleanup_old_logs`) |
| Logs de erro (5xx, exceptions) | Stack trace, request data (sanitizado) | **12 meses** | Art. 7º, IX (debug/segurança) | Eliminação automática | Infra |
| Logs de auditoria admin | Quem, ação, objeto, timestamp, IP | **2 anos** | Art. 7º, IX + Auditoria | Arquivamento frio → Eliminação | Backend (audit log) |
| Logs de segurança (WAF, fail2ban, CSP violations) | IP, regra, payload, timestamp | **12 meses** | Art. 7º, IX | Eliminação automática | Infra |
| **PRODUÇÕES PEDAGÓGICAS** | | | | | |
| Produções públicas (aprovadas) | `producao` (status Aprovado/Concluído) | **Permanente** (acervo histórico/pedagógico) | Art. 7º, V + Interesse público/Art. 4º LGPD | **Anonimização irreversível** ao excluir conta do autor | Backend (`api_delete_my_account`) |
| Produções em revisão / rascunho | `producao` (status Em revisão, Rascunho) | Enquanto conta ativa + 90 dias inatividade | Art. 7º, V | Eliminação se conta excluída; arquivo se inativo | Backend (job limpeza rascunhos) |
| Arquivos anexos (PDF, DOCX, imagens) | `producao.arquivo`, `topico.arquivo`, `diario.foto` | Mesmo prazo da produção/tópico pai | Art. 7º, V | Eliminação junto ao registro pai | Backend |
| **REVISÃO DUPLO-CEGA** | | | | | |
| Avaliações (notas, feedback) | `avaliacao` | **Permanente** (vinculada à produção) | Art. 7º, V | Anonimização (`revisor=NULL`) ao excluir conta revisor | Backend |
| **FÓRUM COMUNITÁRIO** | | | | | |
| Tópicos e comentários | `topico`, `comentario` | Enquanto conta ativa / **Permanente anonimizado** | Art. 7º, V | Anonimização (`autor=NULL`) ao excluir conta | Backend |
| **GAMIFICAÇÃO** | | | | | |
| XP, histórico, nível | `registroxp`, `profile.pontos` | Enquanto conta ativa | Art. 7º, V | **Eliminação** com exclusão de conta | Backend |
| Conquistas/badges | `conquistausuario` | Enquanto conta ativa | Art. 7º, V | Eliminação com exclusão de conta | Backend |
| Notificações | `notificacao` | **90 dias** (lidas) / **1 ano** (não lidas) | Art. 7º, IX | Eliminação automática (job) | Backend |
| **CONSENTIMENTOS LGPD** | | | | | |
| Termos de Uso (versão, timestamp) | `profile.terms_version`, `terms_accepted_at` | **5 anos** após última versão aceita | Art. 7º, II (obrigação legal) + Art. 8 (comprovação) | Arquivamento frio → Eliminação | Backend |
| Política de Privacidade (timestamp) | `profile.privacy_accepted_at` | **5 anos** após última versão aceita | Art. 7º, II + Art. 8 | Arquivamento frio → Eliminação | Backend |
| Cookies (consentimento, timestamp) | `profile.cookies_consent`, `cookies_accepted_at` | Enquanto consentimento válido + **2 anos** após revogação | Art. 7º, I (consentimento) | Eliminação | Backend |
| **DIÁRIO OPERACIONAL (CRM Interno)** | | | | | |
| Registros de interações | `diariooperacao`, `notadiario` | **5 anos** (auditoria institucional) | Art. 7º, II (obrigação legal UnB) | Arquivamento frio → Eliminação | Admin/Equipe |
| **BACKUPS** | | | | | |
| Backup completo (BD + mídia) | `pg_dump` / `sqlite` + `media/` | **Diário**: 7 dias / **Semanal**: 4 semanas / **Mensal**: 12 meses / **Anual**: 5 anos | Art. 7º, IX (resiliência) + Obrigação legal | Eliminação automática (política rotação) | Infra (`backup_db.py`) |
| Backup de configs / secrets | `.env`, `nginx.conf`, `docker-compose.yml` | **Permanente** (versionado em Git privado) | Art. 7º, IX | Versionamento Git (não elimina) | DevOps |

---

## 4. Regras de Anonimização Irreversível (Art. 12 LGPD)

Aplicável quando: **exclusão de conta** pelo titular ou **fim da finalidade** com obrigação de manter conteúdo (acervo público).

### 4.1 Produções Didáticas (`producao`)
| Campo | Ação |
|-------|------|
| `user` (FK) | `SET NULL` (dissociação completa) |
| `exibir_autor` | `FALSE` (nunca exibir) |
| `escola` | **Generalização**: substituir por `"Escola não informada"` ou `"[REDACTED]"` |
| `disciplina` | **Manter** (necessária para filtros pedagógicos; não identifica diretamente) |
| `titulo`, `bncc`, `experiencia`, `resultados`, `metodologia` | **Manter** (conteúdo pedagógico; risco reidentificação baixo) |
| `prompts_ia`, `modelo_ia` | **Manter** (metadados técnicos) |

> **Validação**: Após anonimização, rodar script de **k-anonymity check** (k≥5) nos campos quasi-identificadores (disciplina + nível + escola generalizada).

### 4.2 Avaliações (`avaliacao`)
| Campo | Ação |
|-------|------|
| `revisor` (FK) | `SET NULL` |

### 4.3 Fórum (`topico`, `comentario`)
| Campo | Ação |
|-------|------|
| `autor` (FK) | `SET NULL` |

### 4.4 Perfil e Gamificação
| Tabela | Ação |
|--------|------|
| `profile` | `DELETE` (CASCADE remove `registroxp`, `conquistausuario`, `notificacao`) |
| `auth_user` | `DELETE` (elimina `username`, `email`, `password`, `first_name`, `last_name`) |

---

## 5. Processos Automatizados (Jobs Cron)

### 5.1 `cleanup_old_logs` — Limpeza Logs 6 Meses (Art. 15 MCI)
```bash
# Frequência: Diária (02:00 UTC)
# Comando: python manage.py cleanup_old_logs
# Ação: DELETE de logs de acesso > 180 dias
# Log: Registra quantidade eliminada em audit log
```

### 5.2 `cleanup_inactive_drafts` — Rascunhos Inativos 90 Dias
```bash
# Frequência: Semanal (Domingo 03:00 UTC)
# Comando: python manage.py cleanup_inactive_drafts
# Critério: Producao.status IN ('Rascunho', 'Em revisão') AND updated_at < 90 dias AND user.is_active=False
# Ação: Soft-delete (status='Arquivado') → notifica autor se conta ativa
```

### 5.3 `cleanup_old_notifications` — Notificações Antigas
```bash
# Frequência: Diária
# Comando: python manage.py cleanup_old_notifications
# Critério: lida=True AND created_at > 90 dias OR lida=False AND created_at > 1 ano
# Ação: DELETE
```

### 5.4 `rotate_backups` — Rotação Backups (Política 7/4/12/5)
```bash
# Frequência: Diária (após backup diário)
# Comando: python manage.py rotate_backups
# Política:
#   - Manter últimos 7 backups diários
#   - Manter 4 backups semanais (domingos)
#   - Manter 12 backups mensais (dia 1)
#   - Manter 5 backups anuais (01/01)
#   - Eliminar demais
```

### 5.5 `anonymize_deleted_accounts` — Anonimização Pós-Exclusão (Já implementado em `api_delete_my_account`)
```bash
# Trigger: Imediato ao DELETE /api/user/delete-account/
# Verificação: Job semanal confere se há contas excluídas com produções não anonimizadas (failsafe)
```

---

## 6. Eliminação Segura (Destruição)

| Mídia | Método | Padrão | Certificado |
|-------|--------|--------|-------------|
| **Banco de Dados (PostgreSQL/SQLite)** | `DELETE` + `VACUUM FULL` / `DROP TABLE` + sobrescrita espaço livre | NIST SP 800-88 Rev. 1 (Clear) | Log de auditoria com hash SHA256 pré/pós |
| **Arquivos de Mídia (S3/Volume/Disco)** | `DELETE` object + versioning purge / `shred -n 3` (disco físico) | NIST SP 800-88 (Clear/Purge) | Relatório S3 lifecycle / `shred` log |
| **Backups (Dump SQL, Tarball)** | Expiração lifecycle policy (S3/Glacier) / `shred` (arquivo local) | NIST SP 800-88 | Relatório lifecycle / log eliminação |
| **Logs (Arquivos Texto, JSON)** | `shred -n 3` + `rm` / Rotação logrotate com `shred` | NIST SP 800-88 | Logrotate config + audit log |
| **Secrets / Chaves (.env, JWT keys)** | Rotação + `shred` arquivo antigo / Revogação KMS | NIST SP 800-88 (Destroy para HSM) | Log rotação + certificado KMS |

> **Regra**: Nenhum dado eliminado em produção sem **duplo comando** (confirmação) e **registro em audit log imutável**.

---

## 7. Exceções e Retenção Estendida

| Situação | Prazo Estendido | Autorização |
|----------|-----------------|-------------|
| **Litígio / Contencioso / Inquérito** | Até trânsito em julgado + 2 anos | Jurídico UnB + DPO (ordem escrita) |
| **Investigação Incidente Segurança** | Até conclusão + 1 ano | DPO + IC (Incident Commander) |
| **Auditoria Externa / ANPD** | Conforme escopo solicitado | DPO |
| **Pesquisa Acadêmica (dados anonimizados)** | Permanente (série histórica) | CEP/Plataforma Brasil + DPO |
| **Obrigação Legal Específica** | Conforme lei (ex: tributária 5 anos) | Jurídico + DPO |

**Procedimento**: Solicitação formal → Análise DPO/Jurídico → Decisão documentada → Marcação `legal_hold=True` nos registros → Liberação automática ao fim.

---

## 8. Monitoramento e Conformidade

| Indicador | Meta | Frequência Verificação | Responsável |
|-----------|------|------------------------|-------------|
| % Jobs de limpeza executados com sucesso | 100% | Diária (alertas falha) | DevOps/Backend |
| Tempo médio eliminação pós-exclusão conta | < 5 min | Por evento | Backend |
| Backups testados (restore) com sucesso | 100% mensal | Mensal | DevOps |
| Registros com `legal_hold` ativos | 0 (exceto justificados) | Trimestral | DPO |
| Auditoria k-anonymity produções anonimizadas | k ≥ 5 | Semestral | DPO + Técnica |

---

## 9. Responsabilidades

| Papel | Responsabilidade |
|-------|------------------|
| **DPO** | Aprovar política, autorizar exceções, auditar conformidade, reportar ANPD |
| **Equipe Técnica (Backend/DevOps)** | Implementar jobs, garantir execução, testar restores, documentar procedimentos |
| **Jurídico UnB** | Validar base legal, autorizar `legal_hold`, revisar contratos operadores |
| **Coordenação T.E.I.A.** | Garantir recursos, priorizar correções, comunicar partes interessadas |

---

## 10. Revisão e Versionamento

| Versão | Data | Autor | Alterações | Aprovação |
|--------|------|-------|------------|-----------|
| 1.0 | Nov/2026 | [Autor] | Criação inicial | DPO + Coordenação |

**Próxima revisão obrigatória**: **Novembro 2027** (anual) ou antes se:
- Mudança significativa no tratamento (novas finalidades, dados, operadores)
- Nova orientação ANPD / jurisprudência
- Incidente de retenção/eliminação
- Alteração legislativa relevante

---

## 11. Anexos Referenciados

- `docs/ROPA.md` — Registro de Atividades (tabela detalhada por atividade)
- `docs/DPIA.md` — Avaliação de Impacto (riscos retenção)
- `docs/INCIDENT_RESPONSE.md` — Retenção logs incidente
- `backend/kipo_playground/management/commands/cleanup_old_logs.py` — Implementação job logs
- `backend/kipo_playground/management/commands/backup_db.py` — Backup/rotação
- `backend/kipo_playground/views.py` — `api_delete_my_account` (anonimização)

---

**Aprovação:**

________________________________________________________
Prof. Edison Ishikawa — DPO / Encarregado de Proteção de Dados  
Data: ____/____/________

________________________________________________________
[Coordenador Técnico T.E.I.A.] — Responsável Técnico  
Data: ____/____/________