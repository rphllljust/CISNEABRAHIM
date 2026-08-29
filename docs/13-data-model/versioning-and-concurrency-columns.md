# DM-VER-001

| Campo | Valor |
| --- | --- |
| Document ID | Versionamento e colunas de concorrência |
| Prompt | 12 |

## Concorrência otimista

| Tabela | Coluna | Tipo candidato | INV |
| --- | --- | --- | --- |
| so.service_order | row_version | bigint NOT NULL DEFAULT 0 | INV-019 |
| po.purchase_order | row_version | bigint | INV-012 saldo |
| msr.measurement | row_version | bigint | INV-009 |
| com.commercial_reference | row_version | bigint | INV-022 |

## Padrão de uso (aplicação)

1. Leitura traz `row_version`
2. UPDATE incrementa `WHERE id = ? AND row_version = ?`
3. Zero rows → conflito → retry ou erro empresarial

## Versionamento documental

| Entidade | Mecanismo |
| --- | --- |
| logical_document | Identidade estável |
| document_version | `version_number` monotônico por documento (UNQ-CAND-009) |
| superseded_at | Marca versão anterior — não DELETE |

## Versionamento de domínio vs audit

| Tipo | Onde |
| --- | --- |
| Versão de arquivo | doc.document_version |
| Histórico de estado OS | aud.domain_history_entry + SM |
| row_version | Lost update prevention |

## Não usar

- `xmin` do PostgreSQL como API de concorrência
- Version column em todas tabelas — só aggregates com UPDATE concorrente esperado

## Pendente

Estratégia de lock pessimista em alocação de recurso (INV-004) — app-level ou advisory lock — **PENDING**.
