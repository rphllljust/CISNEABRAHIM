# ARCH-SEC-001

| Campo | Valor |
| --- | --- |
| Document ID | Visão geral de arquitetura de segurança |
| Base | Prompt 08, SEC-REQ-001..024 |
| Prompt | 09 |

## Camadas de segurança (lógicas)

```text
[Perímetro futuro] → [Autenticação — PENDING] → [Autorização empresarial]
        → [Application gate] → [Domain] → [Data projection]
```

## Autenticação vs autorização

| Concern | Status | Onde modelado |
| --- | --- | --- |
| Autenticação (IdP, JWT, sessão) | **Não decidido** | SEC-REQ-017, 018 |
| Autorização empresarial | Modelada | docs/09-authorization/ |
| Admin técnico | Sem poder empresarial auto | SOD-012 |

## Controles arquiteturais

| Controle | Implementação futura | Requisito |
| --- | --- | --- |
| AuthZ no Application | Gate antes de CMD | EP-002, AUTHZ-* |
| Projeção por papel | Omitir custo/margem | SEC-REQ-009 |
| SoD enforcement | Rejeitar CMD conflitante | SEC-REQ-014 |
| SECURITY_AUDIT | Store append-only | SEC-REQ-024 |
| Upload seguro | Scan + tipo | SEC-REQ-012 |
| Segredos | Vault/env — TBD | SEC-REQ-013 |
| TLS | Em trânsito | SEC-REQ-023 |
| Criptografia repouso | TBD | SEC-REQ-022 |
| Anti-enumeração | Respostas genéricas | SEC-REQ-015 |
| Isolamento tenant | Escopo query | SEC-REQ-019, ADP-014 |

## Threat model candidato (resumo)

| Ameaça | Mitigação arquitetural |
| --- | --- |
| Bypass UI | Backend authZ |
| URL direta documento | AUTHZ document policy |
| Privilege escalation TI | SOD-007, SOD-012 |
| Log com PII/custo | EP-021, redação |
| Integração maliciosa | ACL + validação local |

## Não modelado aqui

WAF, SIEM, pentest, certificados — infraestrutura futura.
