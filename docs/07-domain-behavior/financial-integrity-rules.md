# DBEH-FIN-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Regras de integridade financeira |
| Prompt      | 06                               |

| Regra                            | INV     | CMD             | DE          | Notas            |
| -------------------------------- | ------- | --------------- | ----------- | ---------------- |
| Origem obrigatória para faturar  | INV-007 | CMD-019         | DE-016      | BR-014           |
| Sem emissão fiscal pelo sistema  | INV-018 | —               | —           | BR-015; TERM-018 |
| Custo ≠ preço                    | INV-005 | —               | —           | BR-018           |
| Margem derivada, não inventada   | —       | —               | —           | DDP-031          |
| Medição → faturamento encadeado  | INV-008 | CMD-017..019    | DE-014..016 | DDP-011          |
| Nota duplicada bloqueada         | INV-011 | CMD-020         | DE-017      | NFR-011          |
| Pagamento duplicado bloqueado    | INV-010 | CMD-021         | DE-018      | DDP-012          |
| PO saldo respeitado              | INV-012 | CMD-005, FR-033 | —           | DDP-009          |
| Divergência comercial registrada | —       | FR-034          | —           | TERM-042         |
| SoD medição                      | INV-017 | CMD-018         | DE-015      | BR-009           |

Efeito financeiro CRITICAL em CMD-019, CMD-020, CMD-021.

Nenhuma fórmula de margem ou imposto inventada.
