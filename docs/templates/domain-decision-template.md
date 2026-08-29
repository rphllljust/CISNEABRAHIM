# Template — decisão de domínio pendente (DDP)

## Campos obrigatórios

| Campo                        | Obrigatório                          |
| ---------------------------- | ------------------------------------ |
| ID (`DDP-NNN`)               | Sim                                  |
| Question                     | Sim                                  |
| Context                      | Sim                                  |
| Status                       | Sim                                  |
| Blocking for implementation? | Sim                                  |
| Options considered           | Opcional; **não** escolher sem fonte |
| Answer                       | Somente quando `ANSWERED`            |
| SOURCE-ID da resposta        | Obrigatório se `ANSWERED`            |
| Date                         | Sim                                  |

## Status permitidos

```text
OPEN
BLOCKING
ANSWERED
DEFERRED
SUPERSEDED
```

`BLOCKING` pode coexistir com `OPEN`.

## Como citar fontes

A **pergunta** pode nascer de SRC-000 ou de lacuna. A **resposta** não pode nascer só de preferência técnica. Citar SRC da validação empresarial.

## Como registrar incerteza

Deixar Answer vazio. Escrever “UNKNOWN”. Não preencher opções como se fossem decisão.

## Como preservar histórico

Se a pergunta mudar, `SUPERSEDED` + novo DDP. Resposta errada: não apagar; nova entrada ou emenda datada com fonte.

## Quando bloqueia implementação

Se `Blocking for implementation?` = sim e status não `ANSWERED` (com fonte): `NOT_READY_FOR_IMPLEMENTATION` para o tema.
