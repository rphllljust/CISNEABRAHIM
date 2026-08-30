# QA-UAT-001 — Cenários UAT empresarial

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | QA-UAT-001               |
| Prompt      | 89                       |
| Status      | **ACTIVE**               |

## Objetivo

Validar que o sistema resolve a operação real com dados fictícios realistas — **sem novas funcionalidades** salvo correção de defeito aprovado.

## Cenários automatizados

Implementação: `apps/api/src/uat/uat-scenarios.ts` + `uat-vertical-runner.ts`

| ID | Operação | Archetype | Recursos | Cliente fictício |
| -- | -------- | --------- | -------- | -------------- |
| `locacao` | Locação diária de escavadeira | RENTAL | EXCAVATOR | Mineração Vale do Madeira LTDA |
| `transporte` | Transporte de carga municipal | TRANSPORT | TRUCK | Agroindustrial Rondônia LTDA |
| `obra_composto` | Terraplenagem + umidificação | CIVIL_WORK | EXCAVATOR + WATER_TRUCK | Construtora Porto Velho Infraestrutura LTDA |

## Fluxo end-to-end (cada cenário)

```
Cliente → Solicitação → Proposta → PO → OS → Planejamento → Alocação →
Execução → Evidência → Medição → Faturamento → Nota Fatura → Documentos
```

## Perfis testados

| Perfil | Grants | Verificações |
| ------ | ------ | ------------ |
| Controle/Admin | `control_admin` | criação de cliente permitida |
| Executor | `executor` | lê OS; **não** prepara faturamento; **não** cria cliente |
| Financeiro | `finance` | prepara faturamento; **não** inicia execução |

Evidência: `uat-profile-checks.ts` + `uat-business.integration.spec.ts`

## Severidade de defeitos

| Severidade | Go-live |
| ---------- | ------- |
| BLOCKER | Impede |
| CRITICAL | Impede |
| MAJOR | Não impede sozinho |
| MINOR | Não impede |

Registro: [uat-defect-register.md](./uat-defect-register.md)

## Regressão

Cada correção relevante de UAT deve:

1. Ganhar teste automatizado quando possível (`uat-business.integration.spec.ts`)
2. Reexecutar vertical completa (`pnpm test:uat`)

## Veredito

| Camada | Status | Evidência |
| ------ | ------ | --------- |
| UAT engenharia (automatizado) | **APPROVED** | testes integração PASS |
| Aceite empresarial (patrocinador) | **PENDING** | não falsificado — sign-off manual requerido |
| Go-live formal | **BLOCKED** | `BUSINESS_STAKEHOLDER_SIGN_OFF_PENDING`, RPO/RTO `TARGET_NOT_DEFINED` |

## Execução

```bash
pnpm test:uat
pnpm --filter @cisne/api test:uat:unit
pnpm --filter @cisne/web test -- src/vertical/vertical-quality-gate.e2e.test.tsx
```
