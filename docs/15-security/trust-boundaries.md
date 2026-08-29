# SEC-BND-001

| Campo | Valor |
| --- | --- |
| Document ID | Trust boundaries |
| Prompt | 14 |

## Diagrama lógico

```text
[Internet / Usuário]
        │
        ▼  TB-01 TLS termination
┌───────────────────┐
│  Presentation     │  ← NÃO confiável (UI)
└─────────┬─────────┘
          ▼  TB-02 API Gateway / BFF
┌───────────────────┐
│  Application      │  ← AuthN verify, AuthZ enforce
│  (modular monolith)│
└─────────┬─────────┘
          ▼  TB-03 DB credentials
┌───────────────────┐
│  PostgreSQL       │  ← SoT transacional
└───────────────────┘

          ▼  TB-04 storage credentials
┌───────────────────┐
│  Object Storage   │
└───────────────────┘

          ▼  TB-05 mTLS/API key (candidato)
┌───────────────────┐
│  Sistemas externos│  ← NÃO confiável
│  ERP / Webhooks   │
└───────────────────┘
```

## Boundaries

| ID | Nome | De → Para | Controles candidatos |
| --- | --- | --- | --- |
| TB-01 | Cliente → Edge | Browser/app → API | TLS 1.2+, headers, rate limit |
| TB-02 | API → Domínio | Controller → Handler | AuthZ gate obrigatório |
| TB-03 | App → PostgreSQL | Drizzle/pool | Least privilege DB user, TLS |
| TB-04 | App → Storage | Upload/download | Signed URL curta, IAM |
| TB-05 | App ↔ Integração | BC-018 | Inbox dedup, HMAC webhook, não confiar payload |
| TB-06 | App → IdP | Login | OIDC candidato — Prompt 20 |
| TB-07 | Admin → Infra | Deploy/backup | RBAC infra separado |

## Regra fundamental

**TB-02:** Toda requisição autenticada passa por autorização de comando/recurso **antes** de transação de domínio. UI não cruza TB-02 com privilégios embutidos.

## Isolamento tenant (pendente)

SEC-REQ-019 / ADP-014 — boundary lógico `tenant_id` ou `client_scope` em queries — **PENDING**, default deny cross-tenant.

## Zonas de confiança

| Zona | Confiança |
| --- | --- |
| Domínio + invariantes | Alta (código revisado) |
| Frontend | Zero |
| Integração externa | Zero — validar localmente |
| Logs agregados | Média — redaction |
