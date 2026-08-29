# AUTHZ-DOC-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de acesso a documentos |
| BC | BC-CAND-014 |
| Prompt | 08 |

## Níveis documentais (SM-CAND-006)

| Nível | Controle de acesso candidato |
| --- | --- |
| Documento lógico | DOCUMENT_SCOPE; vínculo a OS/execução |
| Versão documental | Herda lógico; versão substituída = leitura histórica restrita |
| Arquivo binário | Download separado de metadados |

## Classificações candidatas (não confirmadas)

| Classe | Exemplos | ROLE-CAND leitura | ROLE-CAND escrita |
| --- | --- | --- | --- |
| OPERACIONAL | Evidência campo, foto | 004, 005, 003 | 004, 014 |
| RESTRITO | Contrato, PO | 002, 012, 014 | 014 |
| FINANCEIRO | Nota, boleto | 010, 011, 013 | 010 |
| PESSOAL | Dados identificáveis | Mínimo necessário | ADP-005 |

## CMD-016 — Anexar evidência

| AUTHZ | AUTHZ-019 |
| Condição | OS em execução ou concluída candidata |
| Dados | Binário + metadados |
| Audit | DOMAIN_HISTORY |

## CMD-022 — Substituir documento

| AUTHZ | AUTHZ-025 |
| SOD | SOD-008 — aprovador ≠ substituidor |
| Histórico | Versão anterior preservada (DE-019) |
| SEC-REQ | SEC-REQ-010 |

## Regras

1. URL direta ao arquivo **não** bypassa autorização (cenário TSC-AUTH-003).
2. Substituir ≠ excluir — exclusão física não modelada como rotina.
3. Admin técnico: backup/infra apenas; não leitura empresarial de RESTRITO sem mandato — ADP-007.

## DDP

DDP-013 — tipos obrigatórios e emissor.
