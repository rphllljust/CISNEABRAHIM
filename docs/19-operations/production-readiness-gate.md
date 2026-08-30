# OPS-READINESS-001 — Production readiness gate

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | OPS-READINESS-001        |
| Prompt      | 92                       |
| Status      | **EVALUATED**            |
| Decisão     | **NO-GO**                |

## Objetivo

Último gate antes do go-live. **Não implementa feature** — consolida evidência de prompts anteriores e bloqueia liberação se qualquer blocker real estiver aberto.

**Classificação:** decisão de engenharia honesta; não alterada para cumprir cronograma.

---

## Decisão

```
PRODUCTION READINESS: NO-GO
```

### Blockers reais

| ID | Tipo | Evidência |
| -- | ---- | --------- |
| `BUSINESS_STAKEHOLDER_SIGN_OFF_PENDING` | Aceite empresarial | `uat-business-scenarios.md`; `uat-verdict.ts` |
| `RPO_RTO_TARGET_NOT_DEFINED (DDP-016)` | Continuidade | `backup-strategy.md`; `RPO_RTO_PRODUCTION_BLOCKER` |
| `PILOT_NOT_EXIT_READY` | Piloto | `pilot-program.md` — fase `ACTIVE`; janela mínima 14d não cumprida |
| `UAT_MANUAL_UX_CHECKLIST_PENDING` | UX/A11y manual | `uat-ux-checklist.md` — sessão com operador pendente |

---

## Matriz de verificação

| Verificação | Status | Evidência |
| ----------- | ------ | --------- |
| CI PASS | **PASS** | `.github/workflows/ci.yml` |
| CD PASS | **PASS** | Prompt 87 — `cd-pipeline.spec.ts` |
| UAT APPROVED | **FAIL** | Engenharia APPROVED; patrocinador PENDING |
| Pilot APPROVED | **FAIL** | Fase ACTIVE ≠ EXIT_READY |
| Security PASS | **PASS** | Prompt 81 |
| Load tests PASS | **PASS** | Prompt 82 |
| Backup PASS | **PASS** | Prompt 84 |
| Restore PASS | **PASS** | Prompt 85 |
| DR PASS | **PASS** | Prompt 85 |
| Observability PASS | **PASS** | Prompt 79 |
| Alerts PASS | **PASS** | Prompt 80 |
| Rollback PASS | **PASS** | Prompt 91 |
| TLS PASS | **PASS** | Prompt 88 |
| Secrets PASS | **PASS** | Prompt 88/81 |
| Migrations PASS | **PASS** | Prompt 87 + `gate:database` |
| E2E PASS | **PASS** | CI + UAT 89 + vertical gate |
| Mobile PASS | **CONDITIONAL** | Shell responsivo web; app nativo DDP-025 OPEN |
| Accessibility acceptable | **CONDITIONAL** | Auto PASS; manual PENDING |
| No critical vulnerability | **PASS** | `pnpm audit:deps` high+ em CI |
| No blocker defect | **PASS** | Zero BLOCKER/CRITICAL aberto em UAT auto |

### Database

| Item | Status | Detalhe |
| ---- | ------ | ------- |
| Migration plan validado | **PASS** | expand/contract; breaking bloqueado |
| Backup pré-release | **PASS** | política CD + backup monitorado (84) |

### Storage

| Item | Status | Detalhe |
| ---- | ------ | ------- |
| Private | **PASS** | `prod-object-storage.ts` |
| Backup/recovery | **PASS** | Prompts 84/85 |

### External integrations

| Regra | Status |
| ----- | ------ |
| Somente adapters confirmados ativos | **PASS** — ERP/tracking bloqueados até confirmação |
| Integração bloqueada não impede core | **PASS** — Prompt 69/70-A |

---

## Suporte (definido)

| Papel | Definição |
| ----- | --------- |
| **Responsável técnico** | Principal SRE / Release Engineer — atribuição nominal via `PROD_TECHNICAL_OWNER` antes do GO |
| **Canal de incidente** | Alertas CRITICAL (`/api/v1/observability/alerts`) + canal humano `PROD_INCIDENT_CHANNEL` (definir antes do GO) |
| **Rollback authority** | Release Engineer + on-call SRE — aprovação dupla para produção (`release-rollback-strategy.md`) |
| **Escalation** | CRITICAL → on-call SRE → Release Engineer → patrocinador empresarial |

---

## Comandos

```bash
pnpm --filter @cisne/api test:readiness
pnpm readiness:gate
```

Para simular GO (somente após resolução real dos blockers):

```env
READINESS_BUSINESS_SIGN_OFF=APPROVED
READINESS_RPO_RTO_APPROVED=true
UAT_MANUAL_UX_COMPLETED=true
PILOT_PROGRAM_ENABLED=true
PILOT_STARTED_AT=<data início piloto>
PILOT_MIN_OBSERVATION_DAYS=14
```

**Atenção:** definir env vars sem resolver blockers reais viola governança.

---

## Próximo passo

| Condição | Prompt |
| -------- | ------ |
| `NO-GO` (atual) | Resolver blockers; **não** executar Prompt 93 |
| `GO` | Prompt 93 autorizado |
