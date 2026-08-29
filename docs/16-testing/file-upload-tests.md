# QA-UPL-001

| Campo | Valor |
| --- | --- |
| Document ID | Testes upload arquivo |
| CMD | CMD-016, CMD-022 |
| Prompt | 15 |

| TEST-CAND | Cenário | Assert |
| --- | --- | --- |
| TEST-CAND-057 | MIME não whitelist | 400 REJ |
| backlog 061 | Exceed max size | 413 |
| backlog 062 | EICAR test file | quarantine/reject |
| backlog 063 | Upload sem AuthZ | 403 |
| TEST-CAND-058 | Download URL expirada | 403 |
| backlog 064 | Checksum mismatch | reject version |

## Níveis

| Teste | Nível |
| --- | --- |
| MIME/size AuthZ | L4 API |
| AV scan | L4 com mock scanner OK/KO |
| Storage private | L4 integration minio testcontainer |

## Mock permitido

Scanner antivirus **interface** — mas integração storage ACL testada de verdade.

## SEC-THR

023, 022 — file-upload-security.md.
