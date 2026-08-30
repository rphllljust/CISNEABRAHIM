# Prompt 59 — Faturamento: administração (frontend)

## Escopo

Interface de administração de faturamento operacional com legibilidade financeira, alinhada ao backend do Prompt 58.

Rotas:

- `/app/billing` — painel do processo (estados reais)
- `/app/service-orders/:serviceOrderId/billing` — detalhe e preparação

## Estados exibidos (somente reais)

| Coluna / status | Origem |
|-----------------|--------|
| Pronto para faturar | Medição `APPROVED` sem preparação ativa |
| Em preparação | `BillingRecord` `PREPARED` |
| Com divergência | Condição declarada ≠ fonte autoritativa (PO/proposta/contrato) |

Etapas **Emitido**, **Enviado**, **Aguardando pagamento** e **Pago** aparecem como indisponíveis (fora do escopo do Prompt 58).

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `BillingProcessBoard` | Colunas do painel operacional |
| `BillingCommercialTermsMismatchPanel` | Divergência fonte A × fonte B + ação administrativa |
| `BillingItemsTable` / `BillingItemsCards` | Itens financeiros desktop/mobile |
| `BillingSummaryPanel` | Total, condição, vencimento estimado |
| `BillingPrepareDialog` / `BillingVoidDialog` | Ações de preparação e anulação |
| `ServiceOrderBillingPage` | Detalhe completo por OS |
| `BillingDashboardPage` | Painel agregado |

## UX financeira

- `font-variant-numeric: tabular-nums` em tabelas e totais
- Formatação `pt-BR` / `R$` via `billing-format.ts`
- Campo de condição comercial como texto (não `input type=number`)
- Mobile: cards em vez de tabela horizontal

## API consumida

`apps/web/src/billing/api/billing-api.ts` — espelha Prompt 58.

## Testes

```bash
cd apps/web
npm run typecheck
npm run lint
npm test
```

Cobertura: list, detail, mismatch, amount, forbidden, stale, responsive, a11y, E2E.
