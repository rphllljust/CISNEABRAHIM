# SEC-INPUT-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Política de validação de entrada |
| Prompt      | 14                               |

## Princípio

**Never trust client input** — validar no boundary TB-02 antes do domínio.

## Camadas

| Camada     | Ferramenta candidata                          |
| ---------- | --------------------------------------------- |
| API schema | Zod / class-validator + OpenAPI               |
| Domínio    | Value objects tipados                         |
| DB         | Parameterized queries (Drizzle) — SEC-CTL-022 |

## Por tipo

| Tipo         | Regra                                        |
| ------------ | -------------------------------------------- |
| UUID         | Formato v4/v7; rejeitar path traversal em id |
| Enum status  | Whitelist SM-CAND codes                      |
| Money        | Decimal string → numeric; range CHK          |
| Quantity     | Positive; unit whitelist                     |
| Text livre   | Max length; sanitize HTML se rich text TBD   |
| Date         | ISO 8601; timezone explicit                  |
| External key | Max length; charset alfanumérico             |

## Injeção

| Vetor             | Mitigação                 |
| ----------------- | ------------------------- |
| SQL               | ORM parameterized only    |
| NoSQL             | N/A                       |
| Command injection | Sem shell exec user input |
| LDAP              | N/A fase 1                |
| Template          | Sem eval user template    |

## Integração inbox

Validar schema mensagem **antes** mapear comando — rejeitar unknown fields excessivos.

## Erros

| Regra         | Detalhe                            |
| ------------- | ---------------------------------- |
| 400 validação | Mensagem campo — sem stack trace   |
| Log           | Request id — não body completo PII |

## SEC-REQ

SEC-REQ-021 — não confiar payload externo sem validação local.

## Ameaças

SEC-THR-025.
