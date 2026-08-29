# Prompt 21 — Hardening adversarial da autenticação

Revisão adversarial e correções no escopo AuthN (sem autorização empresarial).

## Cenários analisados

| Área | Resultado |
|------|-----------|
| Hash (scrypt) | OK — `timingSafeEqual` em verify; sem alteração de algoritmo |
| Rotação refresh | **Corrigido** — transação única com `SELECT … FOR UPDATE` |
| Revogação | **Endurecido** — logout com lock de sessão; reuse revoga família |
| Expiração | OK — refresh/sessão validados; JWT `exp` com skew |
| Clock skew | **Corrigido** — `JWT_CLOCK_SKEW_SECONDS` (default 30s) |
| Sessões simultâneas | Aceito — múltiplas sessões por identidade (sem limite nesta fase) |
| Brute force login | OK — rate limit 5/min IP+UA (in-memory) |
| Enumeração login | **Corrigido** — conta desativada retorna `AUTH_INVALID_CREDENTIALS` |
| Replay refresh | **Corrigido** — rotação atômica + detecção de reuse |
| Session fixation | OK — nova sessão por login; ID gerado server-side |
| CSRF | OK — Bearer JWT, sem cookie de auth |
| CORS | OK — origem configurável; sem wildcard implícito |
| Cookie | N/A — auth não usa cookies |
| Payload | **Corrigido** — allowlist estrita, limites de tamanho, body 8KB |
| Logs/respostas | OK — serializers allowlist; testes anti-vazamento |
| Headers | **Corrigido** — `X-Content-Type-Options`, `X-Frame-Options`, etc. |
| Segredo JWT | OK — ≥32 chars obrigatório; HS256 com HMAC |
| Conta desativada + JWT válido | **Corrigido** — validação server-side em guard/sessão/refresh |
| Dependências | `pnpm audit --prod` — 0 vulnerabilidades conhecidas |

## Falhas encontradas e correções

### 1. JWT válido após desativação da conta (ALTA)

**Falha:** `JwtAuthGuard` validava apenas assinatura JWT; identidade desativada mantinha acesso até `exp`.

**Correção:** `SessionValidationService` consulta sessão ativa + status da identidade; usado no guard e em `currentSession`.

### 2. Corrida em refresh concorrente (ALTA)

**Falha:** Dois `POST /refresh` simultâneos com o mesmo token podiam rotacionar duas vezes.

**Correção:** `findRefreshTokenByHashForUpdate` com `FOR UPDATE`; `markRefreshTokenRotated` condicional (`WHERE revoked_at IS NULL`).

### 3. Enumeração de conta desativada no login (MÉDIA)

**Falha:** Login retornava `403 AUTH_ACCOUNT_DISABLED`, revelando existência da conta.

**Correção:** Login de conta desativada retorna `401 AUTH_INVALID_CREDENTIALS` (mesma mensagem de credencial inválida). Rotas autenticadas continuam com `403` quando a conta é desativada após emissão do token.

### 4. Validação JWT insuficiente (MÉDIA)

**Falha:** Sem verificação de `alg`, claims obrigatórios, token futuro (`iat`) ou tamanho máximo.

**Correção:** `TokenService.verifyAccessToken` exige `HS256`, `sub`/`sid`/`jti`, rejeita `iat` futuro além do skew e tokens > 8KB.

### 5. Payload permissivo (MÉDIA)

**Falha:** Campos extras (ex.: `redirect`) aceitos; sem limite de tamanho.

**Correção:** `body-validator.ts` com allowlist; limites em login/senha/refresh; Fastify `bodyLimit: 8192`.

### 6. Refresh sem checagem de identidade/família (MÉDIA)

**Falha:** Refresh não verificava `identity.status` nem `family.revoked_at`.

**Correção:** Join com identidades; `assertRefreshTokenUsable` antes da rotação.

## Testes adversariais

| Arquivo | Cobertura |
|---------|-----------|
| `token.service.adversarial.spec.ts` | JWT adulterado, iss/aud, exp/futuro, alg none, claims ausentes, oversize |
| `auth.adversarial.integration.spec.ts` | refresh concorrente, logout/logout-all concorrente, conta desativada, allowlist resposta |
| `auth.e2e.spec.ts` | token adulterado, sessão desativada HTTP, open-redirect field, security headers |
| `auth.dto.spec.ts` | campos desconhecidos, payload oversize |

## Riscos residuais

| Risco | Severidade | Mitigação atual / nota |
|-------|------------|------------------------|
| Rate limit in-memory (single instance) | MÉDIA | Aceito em dev/MVP; produção multi-instância precisará store compartilhado |
| Sem rate limit em `/refresh` | MÉDIA | Refresh exige token opaco válido; monitorar abuso |
| Access JWT válido até `exp` após logout-all de outra sessão | BAIXA | Sessão validada no guard; logout-all revoga sessões no PG |
| Múltiplas sessões simultâneas sem teto | BAIXA | Desejável limite por identidade — decisão empresarial pendente |
| `pnpm audit` limpo em 2026-08-29 | — | Reexecutar antes de deploy; sem upgrade breaking automático |

## Variável nova

- `JWT_CLOCK_SKEW_SECONDS` (default `30`) — ver `.env.example`

## Comandos de teste

```bash
pnpm db:up
pnpm db:migrate
npx pnpm@9.15.9 lint
npx pnpm@9.15.9 typecheck
npx pnpm@9.15.9 test
npx pnpm@9.15.9 test:integration
npx pnpm@9.15.9 test:e2e
npx pnpm@9.15.9 build
pnpm audit --prod
```

## Fora de escopo

- Autorização empresarial (Prompt 22+)
- Recuperação de senha
- IdP externo / rotação de chaves JWT
