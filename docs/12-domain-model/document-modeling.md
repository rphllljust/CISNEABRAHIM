# DM-DOC-001

| Campo | Valor |
| --- | --- |
| Document ID | Modelagem documental |
| TERM | TERM-031, TERM-032, TERM-033 |
| Prompt | 11 |

## Três níveis — três responsabilidades

| Nível | Entidade | Mutabilidade | Storage |
| --- | --- | --- | --- |
| Lógico | ENTITY-CAND-015 DocumentoLógico | Metadados negócio | PG |
| Versão | ENTITY-CAND-016 VersãoDocumental | Append + supersede | PG meta |
| Arquivo | VO-CAND-020 FileDescriptor | Imutável por versão | Object storage |

## AGG-CAND-013 LogicalDocument

| Membro | Regra |
| --- | --- |
| Root DocumentoLógico | classificação, vínculo negócio (OSId?, tipo) |
| VersãoDocumental | número VO-CAND-005; uma vigente |
| FileDescriptor | pointer storage — não blob no aggregate |

## CMD-022 Substituir

Nova VersãoDocumental; anterior → substituída (DE-019); INV-013.

## Evidência (AGG-005)

EvidenceLink referencia DocumentId — **não** duplica arquivo.

## Nota fiscal (AGG-008)

DocumentoFaturamentoInformado **distinto** de LogicalDocument genérico — podem compartilhar padrão versão futuro (MDDP-010).

## Classificação

OPERACIONAL, RESTRITO, FINANCEIRO — AUTHZ document policy.

## Anti-padrão rejeitado

Uma entidade `Document` com `bytea content` no mesmo aggregate OS.
