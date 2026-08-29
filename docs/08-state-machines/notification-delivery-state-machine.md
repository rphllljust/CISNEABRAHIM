# SM-CAND-010 — NOTIFICATION_DELIVERY

| Campo    | Valor                  |
| -------- | ---------------------- |
| ID       | SM-CAND-010            |
| Ciclo    | NOTIFICATION_DELIVERY  |
| BC owner | BC-CAND-015            |
| Fonte    | SRC-001 (EV-045 fraco) |
| Status   | PARTIALLY_SUPPORTED    |

## Diagrama candidato

```text
[CRIADA] --> [PENDENTE] --enviar--> [ENVIADA] --entregar--> [ENTREGUE]*
                |                        |
                +--descartar--> [DESCARTADA]*     +--falhar--> [FALHOU]
```

## Separação crítica

| Provedor diz              | Humano faz                                        |
| ------------------------- | ------------------------------------------------- |
| ENTREGUE (STATE-CAND-049) | VIEWED / ACKNOWLEDGED = timestamp/audit (DDP-032) |
| Não promove OS            | Não é aceite empresarial                          |

## Estados

### STATE-CAND-046 — CRIADA

| Campo     | Valor                              |
| --------- | ---------------------------------- |
| Nome      | Criada                             |
| Definição | Notificação instanciada no sistema |
| Status    | CANDIDATE                          |

### STATE-CAND-047 — PENDENTE

| Campo     | Valor                     |
| --------- | ------------------------- |
| Nome      | Pendente                  |
| Definição | Aguardando envio ao canal |
| Status    | CANDIDATE                 |

### STATE-CAND-048 — ENVIADA

| Campo     | Valor                        |
| --------- | ---------------------------- |
| Nome      | Enviada                      |
| Definição | Handoff ao provedor de canal |
| Status    | CANDIDATE                    |

### STATE-CAND-049 — ENTREGUE

| Campo       | Valor                                |
| ----------- | ------------------------------------ |
| Nome        | Entregue                             |
| Definição   | Confirmação de entrega pelo provedor |
| Terminal    | Sim (candidato)                      |
| Não implica | Visualizada ou aceita                |
| Status      | CANDIDATE                            |

### STATE-CAND-050 — FALHOU

| Campo      | Valor                           |
| ---------- | ------------------------------- |
| Nome       | Falhou                          |
| Definição  | Envio ou entrega não concluídos |
| Reversível | Retry candidato — SDD-006       |
| Status     | CANDIDATE                       |

### STATE-CAND-051 — DESCARTADA

| Campo     | Valor                              |
| --------- | ---------------------------------- |
| Nome      | Descartada                         |
| Definição | Notificação abandonada sem entrega |
| Terminal  | Sim (candidato)                    |
| Status    | CANDIDATE                          |

## Transições

TR-CAND-047..048 em [state-transition-register.md](./state-transition-register.md).
