# Prompt 57 — Medição: conferência comparativa (frontend)

## Escopo

Interface de conferência de medição com comparação **Planejado · Realizado · Medido**, destaque semântico de divergências, fluxo de submissão/aprovação/rejeição e bloqueio em conflito de versão.

Rota: `/app/service-orders/:serviceOrderId/measurement`

Layout: `AppShellLayout` (painel administrativo / conferência).

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `MeasurementComparisonTable` | Tabela densa desktop (sticky header, colunas numéricas) |
| `MeasurementComparisonCards` | Cards mobile com a mesma informação |
| `MeasurementVarianceBadge` | Indicadores semânticos de divergência |
| `MeasurementSummaryPanel` | Resumo de itens, valor e divergências |
| `MeasurementApprovalDialog` | Confirmação com resumo + checkbox antes de aprovar |
| `MeasurementVersionConflictBanner` | Bloqueio e pedido de reload |
| `ServiceOrderMeasurementPage` | Orquestração, ações e estados |

## UX comparativa

Cada linha expõe: origem (`sourceExecutionEntryId`), quantidades (planejado / realizado / medido), UoM, valor e status de conferência.

Divergências destacadas com tokens CSS (não apenas vermelho/verde):

- quantidade divergente
- item adicional / ausente
- unidade divergente
- preço divergente
- evidência pendente

## API consumida

`apps/web/src/service-orders/api/measurement-api.ts` — espelha Prompt 56.

## Responsividade

Breakpoint `48rem`:

- **Desktop:** tabela com até 7 colunas, `tabular-nums`, header sticky
- **Mobile:** cards empilhados (`measurement-compare--mobile`)

## Aprovação

Botão primário abre diálogo com resumo (itens, valor, divergências). Aprovação exige checkbox de confirmação explícita.

## Conflito de versão

`MEASUREMENTS_VERSION_CONFLICT` bloqueia ações críticas e exibe banner com reload.

## Testes

```bash
cd apps/web
npm run typecheck
npm run lint
npm test
```

Cobertura:

- `measurement-variance.test.ts` — formatação monetária e variância
- `ServiceOrderMeasurementPage.test.tsx` — aligned, divergent, submit, approve, reject, stale, forbidden, responsive, a11y
- `service-order-measurement.e2e.test.tsx` — rota App, workflow, link da execução, version conflict

## Nota de stack

O prompt menciona Tailwind; o repositório web usa tokens CSS em `index.css` (padrão dos Prompts 53/55). Novos estilos usam prefixo `.measurement-*`.
