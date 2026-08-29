# Definition of Ready (DoR)

| Campo | Valor |
| --- | --- |
| Document ID | DOR-001 |
| Source | SRC-000 |
| Applies when | Um item será implementado em software |

Esta política **não** declara nenhum item de produto como pronto. Na fase FOUNDATION, o estado padrão de implementação é:

```text
NOT_READY_FOR_IMPLEMENTATION
```

## Critérios exigidos quando aplicável

Um incremento só é `READY_FOR_IMPLEMENTATION` se os itens aplicáveis abaixo estiverem satisfeitos com fonte ou decisão registrada:

| # | Critério | Notas |
| --- | --- | --- |
| 1 | Problema definido | Qual decisão ou operação o incremento cobre |
| 2 | Fonte registrada | `SOURCE-ID` no source-registry |
| 3 | Regra confirmada | `BR-*` em `CONFIRMED` quando a regra for crítica para o incremento |
| 4 | Ator | Quem inicia / quem é afetado |
| 5 | Autorização | Quem pode; contexto; o que é negado |
| 6 | Entrada | Dados e documentos necessários |
| 7 | Saída | Resultado observável |
| 8 | Pré-condições | Estado exigido antes |
| 9 | Pós-condições | Estado exigido depois, inclusive persistência |
| 10 | Invariantes | O que não pode ser violado |
| 11 | Estados | Máquina de estados do contexto, se existir |
| 12 | Exceções | Recusas, erros, compensações |
| 13 | Efeitos financeiros | Se há impacto em valor, medição, fatura ou pagamento |
| 14 | Efeitos externos | Integrações, comunicações, obrigações |
| 15 | Concorrência | O que acontece com edição simultânea |
| 16 | Idempotência | Reenvio / reprocessamento |
| 17 | Auditoria | O que entra no audit trail |
| 18 | Histórico | O que o domínio deve conservar |
| 19 | Segurança | Ameaças relevantes e controles |
| 20 | Privacidade | Dados pessoais e retenção aplicável |
| 21 | Critérios de aceite | Observáveis e testáveis |
| 22 | Decisões bloqueantes resolvidas | DDPs/EDs marcados como bloqueantes em `OPEN` impedem Ready |

Se faltar informação crítica para o incremento:

```text
NOT_READY_FOR_IMPLEMENTATION
```

Falta “não crítica” (cosmético, copy, detalhe de UI sem regra) pode ser débito explícito, nunca silêncio.

## Itens não Ready nesta fase

Todo módulo empresarial citado no contexto preliminar está `NOT_READY_FOR_IMPLEMENTATION`. Não há FR, UC nem modelo de domínio finalizado.
