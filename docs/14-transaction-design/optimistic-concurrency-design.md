# TXN-OPT-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Concorrência otimista |
| Prompt      | 13                    |
| Herda       | DM-VER-001            |

## Padrão

1. SELECT inclui `row_version`
2. Domínio valida regras
3. UPDATE `SET row_version = row_version + 1 WHERE id = ? AND row_version = ?`
4. `affectedRows === 0` → conflito — **não** merge silencioso

## Tabelas com row_version

| Tabela                   | CMD                | INV     |
| ------------------------ | ------------------ | ------- |
| so.service_order         | 005, 010, 011, 013 | INV-019 |
| msr.measurement          | 017, 018           | INV-009 |
| po.purchase_order        | PO-CONSUME, 005    | INV-012 |
| com.commercial_reference | alteração ref      | INV-022 |

## Resposta ao conflito

| Camada           | Comportamento candidato                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| API              | HTTP 409 ConcurrencyConflict + versão atual?                                       |
| Cliente          | Recarregar e reapresentar (FR-022)                                                 |
| Retry automático | **Não** para comandos UNIQUE_BUSINESS — só leitura-escrita idempotente documentada |

## Quando OPT é preferido

| Critério                          | Exemplo                     |
| --------------------------------- | --------------------------- |
| Contenção baixa-média             | Alteração OS                |
| Conflito recuperável pelo usuário | Edição planejamento         |
| Aggregate com histórico audit     | OS, medição                 |
| Sem corrida financeira crítica    | Progresso execução (append) |

## Quando OPT **não** basta sozinho

| Cenário                    | Motivo              | Ver                             |
| -------------------------- | ------------------- | ------------------------------- |
| Alocação recurso exclusivo | Check-then-act race | pessimistic-locking-analysis.md |
| Saldo PO decremento        | Read-modify-write   | financial-race-analysis.md      |
| Dupla liberação simultânea | SM + estado         | idempotência + OPT              |

## Comparação com pessimistic (resumo)

|                                 | Optimistic         | Pessimistic  |
| ------------------------------- | ------------------ | ------------ |
| Throughput alto contenção baixa | ✓                  | ✗ locks      |
| Garantia exclusão imediata      | ✗ retry            | ✓            |
| Deadlock risk                   | Baixo              | Médio        |
| UX                              | Conflito explícito | Espera/block |

## Testes futuros

TXN-TEST-003, TXN-TEST-007 — dois updates simultâneos OS.
