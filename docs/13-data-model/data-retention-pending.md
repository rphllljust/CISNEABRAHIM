# DM-RET-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Retenção de dados — pendente |
| Status      | PENDING_BUSINESS_DECISION    |
| Prompt      | 12                           |

## O que falta

| Área                 | Decisão necessária      | Fonte                  |
| -------------------- | ----------------------- | ---------------------- |
| Histórico OS / audit | Anos de retenção legal  | Stakeholder / jurídico |
| Documentos evidência | Prazo arquivo campo     | SRC-001 parcial        |
| Staging integração   | Dias após processamento | Engenharia + negócio   |
| Notificações         | TTL entrega             | BC-015                 |
| Logs segurança       | LGPD / política TI      | Fora escopo FOUNDATION |

## Classificação por tabela (hipótese)

| Tabela                      | Retenção candidata | Purge                  |
| --------------------------- | ------------------ | ---------------------- |
| aud.domain_history_entry    | Longa              | Não automático         |
| doc.document_version        | Longa              | Arquivamento SM        |
| int.integration_staging     | Curta técnica      | Job purge              |
| ntf.notification_delivery   | Média              | Após confirmação + TTL |
| Domínio core (so, msr, inv) | Indefinida         | Cancelamento ≠ delete  |

## RPO/RTO

Não definidos — ver NFR Prompt 03.

## Impacto em modelo

Sem colunas `retention_until` até decisão — evitar schema churn.

## Próximo passo

Prompt futuro ou decisão stakeholder registrada em domain-decisions-pending.md.
