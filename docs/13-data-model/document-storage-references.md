# DM-DOC-REF-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Referências de armazenamento documental |
| Prompt      | 12                                      |
| BC          | BC-014                                  |

## Separação de responsabilidades

| Camada           | Tabela                         | Conteúdo                                 |
| ---------------- | ------------------------------ | ---------------------------------------- |
| Metadado lógico  | doc.logical_document           | Tipo, classificação, vínculo negócio     |
| Versão           | doc.document_version           | storage_object_key, checksum, mime, size |
| Binário          | Object storage (S3-compatible) | Bytes do arquivo                         |
| Vínculo execução | evd.evidence_link              | execution_record ↔ logical_document      |

## Colunas de referência

| Coluna             | Semântica                                 |
| ------------------ | ----------------------------------------- |
| storage_object_key | Caminho/opaco no bucket — não URL pública |
| checksum_sha256    | Verificação pós-upload                    |
| mime_type          | Tipo MIME declarado                       |
| byte_size          | Tamanho em bytes                          |

## Invariantes

| INV          | Aplicação                                        |
| ------------ | ------------------------------------------------ |
| INV-013      | Nova versão não apaga anterior — superseded_at   |
| CARD-DDP-012 | Evidence 1:1 vs N:1 versão — FK em evidence_link |

## Sensibilidade

`classification_code` guia bucket/política de acesso — RESTRICTED default para evidências de campo.

## O que não persistir no PostgreSQL

- Conteúdo binário (BYTEA) — exceção técnica pequena rejeitada por padrão
- URL pré-assinada — efêmera, gerada on read

## Integridade

Upload em duas fases candidata: staging key → confirma → versão publicada com checksum.

## FK candidata

evd.evidence_link.logical_document_id → doc.logical_document.id
