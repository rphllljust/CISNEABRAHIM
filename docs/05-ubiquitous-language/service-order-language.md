# UL-SO-001

| Campo   | Valor            |
| ------- | ---------------- |
| Domínio | Ordem de Serviço |
| Prompt  | 04               |

## Termos

| TERM     | Papel                  |
| -------- | ---------------------- |
| TERM-002 | OS — artefato central  |
| TERM-009 | Rascunho               |
| TERM-010 | Liberação              |
| TERM-044 | Histórico              |
| TERM-003 | Serviço descrito na OS |

## Ciclo de vida lexical (candidato, não máquina de estados)

```text
Rascunho → (preparar conteúdo/itens/recursos) → Liberada → Em execução → Concluída
         ↘ Cancelada / Reaberta (DDP-004, DDP-005)
```

Estados definitivos: **não** criados nesta etapa (Prompt 07).

## Distinções

- Preparar ≠ Liberar (DDP-022)
- Liberar ≠ Iniciar execução
- Rascunho OS ≠ Versão documental (TERM-032)

## FRs

FR-010..FR-022
