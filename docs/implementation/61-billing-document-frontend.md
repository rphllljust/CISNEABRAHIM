# Prompt 61 — Nota Fatura digital (frontend)

## Escopo

Workflow de preparação, revisão e emissão da **Nota Fatura** digital a partir de `BillingRecord` **PREPARED**.

Rota: `/app/service-orders/:serviceOrderId/billing/document`

## Fluxo (seções)

1. Resumo do faturamento  
2. Dados do cliente (snapshot, somente leitura)  
3. Referências comerciais (PO / contrato)  
4. Itens (tabela + cards responsivos)  
5. Pagamento e vencimento (`dueDate` opcional — único campo editável na emissão)  
6. Divergências comerciais (bloqueio se mismatch não resolvido)  
7. Pré-visualização fiel ao layout interno  
8. Confirmação e emissão (dialog)  
9. Lista de documentos emitidos + download PDF  

## Restrições

- Dados derivados de medição, cliente, PO e preparação **não** são editáveis como texto livre.
- Pré-visualização HTML **não** substitui o PDF oficial (gerado exclusivamente pelo backend).
- Emissão bloqueada quando `COMMERCIAL_TERMS_MISMATCH` ou documento `FINALIZED` já existente.
- Estilos em `index.css` (`billing-doc-*`), alinhados ao design system existente do módulo billing.

## API consumida

| Ação | Cliente |
|------|---------|
| Listar documentos | `listBillingDocuments` |
| Emitir | `issueBillingDocument` (`dueDate`, `idempotencyKey`) |
| Download PDF | `downloadBillingDocumentPdf` |
| Capabilities | `probeBillingDocumentCapabilities` |

## Componentes

| Arquivo | Função |
|---------|--------|
| `ServiceOrderBillingDocumentPage.tsx` | Página workflow |
| `BillingDocumentPreview.tsx` | Preview do documento |
| `BillingDocumentIssueDialog.tsx` | Confirmação pré-emissão |
| `BillingDocumentIssuedList.tsx` | Lista + download |
| `billing-document-preview.ts` | Modelo de preview e helpers de divergência |

## Impressão

`@media print` oculta navegação e ações; preview imprimível sem gerar artefato persistido.

## Testes

```bash
cd apps/web
npm run typecheck
npm run lint
npm run test
```

Cobertura dedicada:

- `billing-document-preview.test.ts` — preview, mismatch helper, finalized guard  
- `BillingDocumentPages.test.tsx` — workflow, mismatch, finalize, duplicate, download, a11y, responsive  
- `billing-document.e2e.test.tsx` — navegação billing → document → emissão  

## Commit

`feat(web): implement digital billing document workflow`
