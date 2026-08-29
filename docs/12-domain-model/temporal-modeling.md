# DM-TEMP-001

| Campo       | Valor              |
| ----------- | ------------------ |
| Document ID | Modelagem temporal |
| Prompt      | 11                 |

## Tipos de tempo

| Tipo                | VO / atributo | Uso                                         |
| ------------------- | ------------- | ------------------------------------------- |
| Business timestamp  | VO-CAND-018   | Liberado em, concluído em                   |
| Audit timestamp     | Sistema       | SECURITY_AUDIT                              |
| Technical timestamp | Infra         | created_at DB — **não** substituir business |
| Validity period     | Pendente      | Delegação, contrato                         |

## Por conceito

| Conceito         | Timestamps candidatos                | SM / DE        |
| ---------------- | ------------------------------------ | -------------- |
| Solicitação      | registradoEm, decididoEm             | DE-001, DE-002 |
| OS               | liberadoEm, concluídoEm, canceladoEm | DE-004, DE-011 |
| Execução         | iniciadoEm, progressoEm              | DE-009, DE-010 |
| Medição          | submetidoEm, decididoEm              | DE-014, DE-015 |
| Documento versão | publicadoEm, substituídoEm           | DE-019         |
| Pagamento        | registradoEm                         | DE-018         |

## VIEWED / ACKNOWLEDGED

**Não** estado de aggregate — timestamps/audit em AGG-002 contexto (DDP-032).

## Fuso horário

TARGET_NOT_DEFINED — MDDP-006. Armazenar UTC candidato + offset exibição.

## Temporal API (Node 26)

Não decisão de modelagem de domínio — implementação futura.

## Bi-temporal

Não adotado sem requisito — MDDP-007.
