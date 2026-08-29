# Template — regra de negócio (BR)

## Campos obrigatórios

| Campo                                               | Obrigatório                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| ID (`BR-NNN`)                                       | Sim                                                                         |
| Title                                               | Sim                                                                         |
| Statement (texto normativo candidato ou confirmado) | Sim                                                                         |
| Status                                              | Sim                                                                         |
| SOURCE-ID + localizador                             | Sim para `CONFIRMED`; para `CANDIDATE` pode ser SRC de governança com aviso |
| Actor / contexto                                    | Sim quando conhecido; senão `TBD`                                           |
| Exceptions                                          | Sim ou `TBD`                                                                |
| Financial / external effects                        | Sim ou `N/A` / `TBD`                                                        |
| Blocks implementation?                              | Sim                                                                         |

## Status permitidos

```text
CANDIDATE
PENDING_VALIDATION
CONFIRMED
CONFLICT
REJECTED
DEPRECATED
SUPERSEDED
```

`CONFIRMED` exige fonte empresarial adequada. SRC-000 **não** basta para regra operacional.

## Como citar fontes

`BR-NNN` ← `SRC-NNN` (cláusula/página) ← `EVD-NNN` se existir.

Múltiplas fontes: listar todas. Divergência → status `CONFLICT` + `SC-*`.

## Como registrar incerteza

Usar `CANDIDATE` ou `PENDING_VALIDATION`. Não usar `CONFIRMED` “por enquanto”. Marcar hipóteses no statement.

## Como preservar histórico

Mudança de status com data. Texto antigo permanece (seção History). `SUPERSEDED` aponta `BR` sucessor. Nunca apagar `BR-001` etc.

## Quando bloqueia implementação

- Status ≠ `CONFIRMED` para regra crítica do incremento → `NOT_READY_FOR_IMPLEMENTATION`.
- `CONFLICT` → bloqueio até resolução documentada.
