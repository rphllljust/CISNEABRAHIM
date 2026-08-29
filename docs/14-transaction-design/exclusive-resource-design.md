# TXN-EXCL-001

| Campo | Valor |
| --- | --- |
| Document ID | Design recurso exclusivo |
| Prompt | 13 |
| INV | INV-004 |
| CMD | CMD-015 |

## Problema

Dois operadores alocam o mesmo recurso físico/lógico simultaneamente. Check-then-act com OPT puro permite dupla alocação.

## Modelo candidato

| Elemento | Detalhe |
| --- | --- |
| Chave exclusão | `(resource_type_code, resource_ref_id)` |
| Estado ativo | `status_code = 'ACTIVE'` |
| UNQ parcial | UNQ-CAND-005 (Prompt 12) |
| Lock | **PESS** na verificação + insert |

## Fluxo transacional

```text
BEGIN
  LOCK recurso (FOR UPDATE em row existente OU advisory lock)
  VALIDAR OS liberada + planned_item
  IF alocação ativa EXISTS → REJ-005 + DE-008
  INSERT resource_allocation ACTIVE
  INSERT audit DE-007
COMMIT
```

## Relação com planejamento (CMD-014)

Planejamento **não** exige exclusividade (resource-exclusivity-rules.md). Apenas CMD-015.

## Conflito exposto

| Resultado | Comportamento |
| --- | --- |
| Sucesso | DE-007 |
| Conflito | REJ-005 — mensagem empresarial, não retry cego |
| Retry cliente | Idempotente se mesma OS+item+recurso |

## Desalocação (futuro)

Compensação TBD — não DELETE; status `RELEASED` + `released_at`.

## Volume

TARGET_NOT_DEFINED — índice parcial IDX-HYP-007.

## Não confundir com

| Conceito | Diferença |
| --- | --- |
| EXCLUSIVE_RESOURCE (NFR) | Classificação operação |
| OS lock | OPT row_version — não exclusão física |
| Serializable global | Overkill se PESS local |
