# SEC-UPLOAD-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Segurança de upload de arquivos |
| SEC-REQ     | SEC-REQ-012                     |
| CMD         | CMD-016, CMD-022                |
| Prompt      | 14                              |

## Fluxo seguro candidato

```text
1. AuthZ upload permission
2. Request presigned URL ou multipart com size cap
3. Stream to staging bucket (private)
4. MIME sniff + magic bytes verify
5. Async malware scan (candidato ClamAV/lambda)
6. TX: document_version + checksum
7. Promote or delete staging
```

## Limites

| Limite           | Valor candidato                      |
| ---------------- | ------------------------------------ |
| Max size         | 25–50 MB evidência — TBD stakeholder |
| Tipos permitidos | PDF, JPEG, PNG, XLSX whitelist       |
| Extensão         | Não confiar — validar magic bytes    |
| Filename         | Sanitize; UUID storage key           |

## Controles

| ID          | Controle                         |
| ----------- | -------------------------------- |
| SEC-CTL-020 | Antivirus scan async             |
| SEC-CTL-025 | Reject oversized                 |
| SEC-CTL-019 | Private bucket + signed download |
| SEC-CTL-037 | Checksum SHA-256 INV-013         |

## Download

| Regra | Detalhe                            |
| ----- | ---------------------------------- |
| AuthZ | document-access-policy.md          |
| URL   | Presigned TTL 5–15 min             |
| Log   | SECURITY_AUDIT download RESTRICTED |

## Ameaças

SEC-THR-022, SEC-THR-023, SEC-THR-028.

## Residual

Zero-day malware — quarentena + revisão manual processo.
