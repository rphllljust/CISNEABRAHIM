# Prompt 45 — Documentos, versionamento e object storage

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(documents): implement secure versioned document storage` |
| **Próximo passo autorizado** | Prompt 46 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Document ≠ arquivo | **SIM** — `doc.documents` (conceito) + `doc.stored_objects` (binário) |
| DocumentVersion com histórico | **SIM** — `superseded_at`; versões anteriores preservadas |
| Object storage privado | **SIM** — `storage_key` interno; filesystem local (S3-ready port) |
| Download autorizado | **SIM** — stream backend + token assinado de curta duração |
| Validação backend | **SIM** — MIME, extensão, tamanho, magic bytes, categoria, 1 arquivo/request |
| Hash SHA-256 | **SIM** — integridade por versão; sem dedup/autorização cruzada |
| Compensação storage↔DB | **SIM** — rollback de objeto em falha de persistência |
| Authz + IDOR | **SIM** — `documents:document:*` + escopo UNIT/DOCUMENT/GLOBAL |
| DTO sem storage key | **SIM** — assert em testes de serialização |
| Prompt 46 executado | **NÃO** |

## Schema (`0015_documents_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `doc.documents` | Título, categoria, classificação, unit_id, status |
| `doc.document_versions` | version_number, actor, timestamps, FK stored_object |
| `doc.stored_objects` | storage_key, sha256, mime, size, original_filename |

## API (`/api/v1/documents`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar documento + upload v1 (multipart) |
| POST | `/:documentId/versions` | Nova versão (multipart) |
| GET | `/` | Listar (escopo UNIT/GLOBAL/DOCUMENT) |
| GET | `/:documentId` | Metadado do documento |
| GET | `/:documentId/versions` | Listar versões |
| GET | `/:documentId/versions/:versionNumber` | Detalhe da versão |
| GET | `/:documentId/versions/:versionNumber/content` | Download stream autorizado |
| POST | `/:documentId/versions/:versionNumber/download-url` | URL assinada curta |
| GET | `/download?token=` | Download via token (sem JWT) |

## Configuração (`.env.example`)

- `OBJECT_STORAGE_PROVIDER=filesystem`
- `OBJECT_STORAGE_ROOT`, `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS`
- Variáveis S3 comentadas para ambiente S3-compatible

## Testes

- Unit: validação MIME/magic bytes, token de download, compensação storage
- Integration: upload, versão, fake mime, oversize, IDOR, cross-unit, hash, audit, compensação DB
- E2E HTTP: upload multipart, stream, signed URL, 403 cross-scope
- Persistence: migration `0015`

## Quality gate

- [x] lint, typecheck, test, test:integration, test:e2e — PASS
- [x] Prompt 46 não executado
