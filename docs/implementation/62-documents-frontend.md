# Prompt 62 — Documentos (frontend GED)

## Escopo

Experiência unificada para documentos anexados a registros de negócio, consumindo a API `/api/v1/documents` (Prompt 45).

## Componentes reutilizáveis

| Componente | Função |
|------------|--------|
| `DocumentManagementPanel` | Orquestração por escopo (listagem + upload + versões) |
| `DocumentList` | Lista desktop (tabela) + mobile (cards) |
| `DocumentUpload` | Drag/drop + botão, fila com progresso e retry |
| `DocumentVersionHistory` | Versão atual, histórico preservado, nova versão |
| `DocumentDownloadAction` | Download via endpoint autorizado (`/content`) |

## Escopos suportados

`CLIENT`, `SERVICE_REQUEST`, `PROPOSAL`, `PURCHASE_ORDER`, `SERVICE_ORDER`, `EXECUTION`, `MEASUREMENT`, `BILLING`

Vinculação pós-upload disponível quando o backend expõe endpoint de link (implementado: **SERVICE_REQUEST**).

## Segurança

- Nunca exibe `storage_key` ou URL interna de objeto
- Download somente por `/versions/:n/content` ou URL assinada emitida pelo backend
- Mensagem explícita na UI sobre endpoints autorizados

## Integração

- `ServiceOrderBillingDocumentPage` — não alterada (BillingDocument é fluxo fiscal interno)
- `ServiceRequestDetailPage` — painel de documentos integrado

## Testes

```bash
cd apps/web
npm run typecheck
npm run lint
npm run test
```

- `document-validation.test.ts`
- `DocumentManagementPanel.test.tsx` — upload, progress, invalid, retry, version, download, unauthorized, responsive, a11y

## Commit

`feat(web): implement secure document management experience`
