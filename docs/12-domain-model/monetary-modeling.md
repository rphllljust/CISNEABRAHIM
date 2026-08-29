# DM-MONEY-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Modelagem monetária          |
| TERM        | TERM-020, TERM-021, TERM-022 |
| Prompt      | 11                           |

## Value object MoneyAmount (VO-CAND-006)

```text
MoneyAmount
├── amount: (rational — não escolher tipo coluna)
└── currency: CurrencyCode (VO-CAND-007)
```

## Onde aparece

| Aggregate                   | Campo VO           | Visibilidade        |
| --------------------------- | ------------------ | ------------------- |
| AGG-011 CommercialReference | custo, preço       | FINANCIAL_SCOPE     |
| AGG-002 ItemPlanejado       | preço ref (cópia?) | Operacional parcial |
| AGG-007 ItemFaturável       | valor              | Financeiro          |
| AGG-008 InformedInvoice     | total              | Financeiro          |
| AGG-009 PaymentRegistration | valor recebido     | Financeiro          |

## Margem (TERM-022)

| Opção                      | Status    |
| -------------------------- | --------- |
| VO MarginSnapshot derivado | CANDIDATE |
| Entidade                   | REJEITADO |
| Calculado read-model       | RM-CAND   |

DDP-031 — fórmula pendente.

## Moeda

| Decisão                       | Status                          |
| ----------------------------- | ------------------------------- |
| Single currency BRL candidato | PENDING — sem fonte multi-moeda |
| ISO 4217 code                 | VO-CAND-007                     |

## Precisão

| Tópico                    | Pendência                       |
| ------------------------- | ------------------------------- |
| Casas decimais            | MDDP-003 — 2 para BRL candidato |
| Arredondamento            | MDDP-008 — half-up candidato    |
| Soma linhas vs total nota | INV-011                         |

## Proibições

- `float`/`number` JS nu para dinheiro em domínio
- Coluna `DECIMAL(19,4)` — decisão persistência Prompt 12+

## Custo vs preço

INV-005 — VOs separados; nunca mesmo campo.
