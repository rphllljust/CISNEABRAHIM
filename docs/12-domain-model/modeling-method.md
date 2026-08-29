# DM-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de modelagem de domínio |
| Prompt | 11 |

## Tipos de artefato

| Tipo | ID | Significado |
| --- | --- | --- |
| ENTITY | ENTITY-CAND-NNN | Identidade estável; mutável |
| VALUE_OBJECT | VO-CAND-NNN | Igualdade por valor; imutável candidato |
| AGGREGATE | AGG-CAND-NNN | Cluster transacional |
| AGGREGATE_ROOT | Root de AGG-CAND | Único ponto de entrada mutação |
| REFERENCE | REF por ID | Ligação entre aggregates |
| READ_MODEL_CANDIDATE | RM-CAND | Projeção BC-016 — sem write |
| EXTERNAL_RECORD | EXT-REC | SoT externo; ACL BC-018 |

## Status

`CANDIDATE` · `ACCEPTED_FOR_LOGICAL_MODELING` · `PENDING_BUSINESS_DECISION` · `REJECTED`

**Proibido:** `FINAL` sem fonte primária validada.

## Regras

1. Não toda tabela futura = entidade de domínio.
2. Referências entre aggregates **por identificador** — não objeto aninhado mutável.
3. Aggregate pequeno; boundary transacional explícita.
4. Solicitação ≠ OS; medição ≠ faturamento ≠ nota ≠ pagamento.
5. Documento lógico ≠ versão ≠ arquivo binário.
6. Planejado ≠ alocado ≠ realizado (EP-011..013).
7. Sem ORM, SQL, código, enum definitivo.

## Campos por AGG-CAND

Propósito · root · membros · invariantes · comandos · eventos · ciclo de vida · boundary · refs externas · concorrência · volume · riscos · evidências · status.

## Fontes upstream

Prompts 04–10: TERM, BC-CAND, INV, CMD, DE, SM-CAND, AUTHZ, ADR-003.
