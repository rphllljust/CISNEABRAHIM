# SEC-AUTHN-001

| Campo | Valor |
| --- | --- |
| Document ID | Arquitetura de autenticação candidata |
| Prompt | 14 |
| Status | **NOT IMPLEMENTED** — IdP TBD Prompt 20 |

## Princípios

| # | Regra |
| --- | --- |
| 1 | Autenticação separada de autorização empresarial (Prompt 08) |
| 2 | Prova de identidade verificada **antes** TB-02 |
| 3 | M2M integração com credencial distinta de usuário |
| 4 | Sem credenciais em URL ou logs |

## Fluxo candidato (OIDC)

```text
1. Client → IdP login (Authorization Code + PKCE)
2. IdP → tokens (access + refresh)
3. API valida JWT (iss, aud, exp, signature)
4. Map sub → ACT-* interno (BC-001)
5. Request context: actor_id, roles claim → ROLE-CAND mapping
```

## Alternativas avaliadas

| Opção | Status |
| --- | --- |
| OIDC externo (Entra, Keycloak, etc.) | **CANDIDATE** — SEC-REQ-017 |
| Local username/password | CANDIDATE fallback — não preferido |
| API key only humano | **REJECTED** |

## MFA

SEC-REQ-018 OPEN — candidato obrigatório para ROLE financeiro e admin (SEC-DEC-003).

## M2M integração

| Mecanismo | Uso |
| --- | --- |
| HMAC webhook secret | Inbound BC-018 |
| Client credentials OIDC | Outbound ERP poll |
| mTLS | Candidato alta segurança — TBD |

## Falhas autenticação

| Evento | Resposta |
| --- | --- |
| Token expirado | 401 + refresh flow |
| Token inválido | 401 genérico |
| Conta desabilitada | 403 |

## SEC-REQ mapeados

SEC-REQ-017, SEC-REQ-018, SEC-REQ-011 (sessão — ver session-security.md).

## Não decidido

Provedor IdP, claim mapping exato, JIT provisioning — Prompt 20.
