# DM-AUDIT-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Separação audit vs dados de domínio |
| Prompt      | 12                                  |
| BC          | BC-017                              |

## Três camadas

| Camada                 | Propósito              | Tabela candidata                |
| ---------------------- | ---------------------- | ------------------------------- |
| Domínio operacional    | Estado atual + filhos  | TBL-CAND 001-022, 024-025       |
| Histórico empresarial  | Append-only transições | aud.domain_history_entry        |
| Security / infra audit | Login, API abuse       | **Fora** deste modelo — app log |

## domain_history_entry

| Coluna          | Função                               |
| --------------- | ------------------------------------ |
| aggregate_type  | Nome do aggregate (ex. ServiceOrder) |
| aggregate_id    | UUID do aggregate                    |
| event_type      | Evento de domínio candidato          |
| payload_summary | Texto resumido — não JSON blob       |
| occurred_at     | Quando ocorreu                       |
| actor_id        | Quem — NULL sistema                  |

## INV-014

Histórico OS append-only — sem UPDATE/DELETE em linhas de histórico.

## Separação de progress_entry vs history

| Artefato                 | Conteúdo                                  |
| ------------------------ | ----------------------------------------- |
| exe.progress_entry       | Dado operacional de execução (quantidade) |
| aud.domain_history_entry | "OS liberada", "Medição aprovada"         |

## Sem FK rígida no audit

Referência polimórfica (type + id) evita cascade acidental e permite registrar eventos cross-aggregate.

## Retenção

Histórico empresarial: retenção longa — ver data-retention-pending.md.

## Não duplicar

Evitar espelhar estado completo do aggregate em cada linha de audit — summary + link ao aggregate.
