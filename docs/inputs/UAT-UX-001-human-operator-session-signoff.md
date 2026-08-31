# UAT-UX-001 — Sign-off humano UAT/UX (sessão real)

| Campo | Valor |
| ----- | ----- |
| Decision ID | UAT-UX-001 |
| Title | Sign-off humano UAT/UX — Administrador real, sessão operador |
| Type | HUMAN_UAT_SIGN_OFF — decisão formal de aceite UX operacional |
| Location | `docs/inputs/UAT-UX-001-human-operator-session-signoff.md` |
| Session ID | `UAT-UX-8CFE4AB9` |
| Environment | `pilot-hml` |
| Release candidate | `ef30b56` / `0.0.0-rc.1` |
| Performed at | 2026-08-31T01:06:01.192Z |
| Signed by | **Abrahim Jabour Junior** (Administrador) |
| Operator profile | Administrador real (`control_admin`) |
| Status | `APPROVED` |
| Classification | `HUMAN_UAT_UX_APPROVED` |

```gate
status: APPROVED
session_id: UAT-UX-8CFE4AB9
signed_by: Abrahim Jabour Junior
signed_role: Administrador
operator_profile: control_admin
environment: pilot-hml
release_commit: ef30b56
scenarios: locacao,transporte,obra_composto
checklist_reference: docs/16-testing/uat-ux-session-checklist.json
evidence_reference: docs/19-operations/readiness-evidence.json
```

## Decisão formal

Eu, **Abrahim Jabour Junior**, na função de **Administrador**, declaro que conduzi sessão real de UAT/UX como operador com perfil **Administrador** (`control_admin`) no ambiente `pilot-hml`, executando os cenários de locação, transporte e obra composto conforme catálogo `docs/16-testing/uat-ux-scenarios.json`.

**Veredito:** `PASSED` — sem bloqueadores nem observações impeditivas.

**Escopo validado:**

- Login e navegação ao painel operacional
- Clareza de telas (desktop e mobile)
- Facilidade operacional nos fluxos críticos
- Compreensão do fluxo OS → execução
- Mensagens de erro acionáveis
- Visibilidade de estados e documentos
- Ações permitidas e proibidas coerentes com o perfil Administrador

**Evidências vinculadas:**

| Artefato | Referência |
| -------- | ---------- |
| Checklist de sessão (54 itens, CLOSED) | `docs/16-testing/uat-ux-session-checklist.json` |
| Checklist UX QA-UAT-003 | `docs/16-testing/uat-ux-checklist.md` |
| Registro autorizado de readiness | `docs/19-operations/readiness-evidence.json` → `manualUatUx` |
| Baseline automatizado UAT engenharia | `apps/api/src/uat/uat-business.integration.spec.ts` |
| Baseline shell UI | `apps/web/src/vertical/vertical-quality-gate.e2e.test.tsx` |

## Limitações declaradas

- Esta decisão cobre aceite UX/UAT manual na etapa piloto/pré-produção; **não** substitui go-live em produção nem encerra janela de observação do piloto (14 dias).
- Itens de acessibilidade mensurável (WCAG nível) permanecem `PENDING_MEASUREMENT` conforme `docs/04-quality-attributes/usability-and-accessibility.md`.

## Assinatura

| Campo | Valor |
| ----- | ----- |
| Nome completo | **Abrahim Jabour Junior** |
| Função | Administrador |
| Data da decisão | 2026-08-30 (registro formal 2026-08-31T01:06:01Z) |
| Registrado em | `readiness-evidence.json` history → `UAT_HUMAN_SIGN_OFF_FORMAL` |
