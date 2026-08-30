# Prompt 55 — Execução operacional responsiva (frontend)

## Escopo

Interface mobile-first para execução de OS em campo, separada do shell administrativo.

Rota: `/app/service-orders/:serviceOrderId/execution`

Layout: `ExecutionShellLayout` — sem navegação lateral; foco operacional.

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `ExecutionHeader` | OS, status, cliente, serviço, local, horário, equipamento, função |
| `RequirementChecklist` | Requisitos do snapshot + resumo de pendências obrigatórias |
| `EvidenceUploader` | Upload com fila, progresso, retry e liberação de preview |
| `ExecutionTimeline` | Entradas, evidências e ocorrências em ordem cronológica |
| `ExecutionActivityPanel` | Registro de observação, quantidade, hodômetro, horímetro |
| `OccurrenceForm` | Registro de ocorrência operacional |
| `OperationalActionBar` | Uma ação primária dominante + ações secundárias |

## Ação primária por estado

| Status | Ação primária |
|--------|----------------|
| `RELEASED` | Confirmar e começar |
| `IN_EXECUTION` (requisitos pendentes) | Registrar atividade |
| `IN_EXECUTION` (requisitos completos) | Concluir OS |
| `PAUSED` | Retomar execução |

Confirmação modal: concluir e pausar.

## API consumida

`apps/web/src/service-orders/api/service-order-execution-api.ts` — espelha Prompt 54.

- Transições com `rowVersion` + `idempotencyKey` opcional
- Retry de rede preserva chave de idempotência em transições
- Mutações de registro usam nova chave por tentativa (sem reenvio cego)

## Responsividade

CSS mobile-first em `index.css` (breakpoint 40rem / 64rem):

- safe areas (`env(safe-area-inset-*)`)
- touch targets ≥ ~44px
- bottom action bar fixa em mobile; sticky em desktop
- tipografia legível, sem dependência de hover

## Testes

```bash
cd apps/web
npm run typecheck
npm run lint
npm test
```

Cobertura E2E: `service-order-execution.e2e.test.tsx` — start, pause/resume, activity, occurrence, missing requirement, 403, version conflict, network failure, double submit, acessibilidade básica.

## Nota de stack

O prompt menciona Tailwind; o repositório web usa CSS utilitário em `index.css` (padrão existente). Novos estilos seguem essa convenção.
