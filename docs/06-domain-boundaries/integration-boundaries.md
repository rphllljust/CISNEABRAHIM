# DBND-INT-BND-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Fronteiras de integração |
| Prompt      | 05                       |

## Sistemas externos candidatos (sem contrato)

| Sistema                    | Dados trocados           | BC fronteira         | Relação                  | SoT                         |
| -------------------------- | ------------------------ | -------------------- | ------------------------ | --------------------------- |
| ERP / referência comercial | Cliente, contrato, preço | BC-CAND-018 → BC-003 | ACL                      | Externo candidato           |
| PO do cliente              | PO, saldo                | BC-CAND-018 → BC-004 | ACL                      | Externo candidato           |
| Emissor fiscal             | NF-e / nota              | BC-CAND-018 → BC-012 | ACL / CONFORMIST         | Externo                     |
| Financeiro / banco         | Pagamento                | BC-CAND-018 → BC-013 | SEPARATE_WAYS ou réplica | Externo candidato           |
| WhatsApp                   | Mensagens intake         | BC-CAND-018 → BC-005 | ACL                      | Canal; registro interno SoT |
| IdP corporativo            | Identidade               | BC-CAND-018 → BC-001 | OPEN_HOST_SERVICE        | Externo                     |

## Regras de fronteira

1. BC-CAND-018 **não** possui regras de negócio de OS — apenas tradução e entrega.
2. Falha externa → NFR-012 (sem sucesso local falso).
3. Retentativas → idempotência (IDEM-REQ-004).
4. Nenhum protocolo (REST, fila, arquivo) escolhido neste prompt.

## Dados que não cruzam fronteira sem evento

- Custo/margem (NFR-008) — não exportar a integrações não autorizadas.
- AUDIT_TRAIL completo — consumo interno BC-017.

## DDPs

DDP-014 (contrato integração), DDP-020 (SoT), DDP-021 (WhatsApp).
