# AUTHZ-QG-001 — Prompt 08 completeness report

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| Prompt    | 08                                             |
| Título    | Modelo empresarial de autorização e segregação |
| Gerado em | 2026-08-28                                     |
| Resultado | PASS_WITH_RESTRICTIONS                         |

## Pré-condições

| Item                          | Status    |
| ----------------------------- | --------- |
| Prompt 07 commitado           | `c811f4b` |
| Working tree limpo (início)   | Sim       |
| Prompts 00–07 consultados     | Sim       |
| UNKNOWN/AMBIGUOUS preservados | Sim       |

## Entregáveis

| Item                            | Esperado | Entregue |
| ------------------------------- | -------- | -------- |
| Arquivos docs/09-authorization/ | 21       | 21       |
| Roles técnicas                  | 0        | 0        |
| Código/script                   | 0        | 0        |
| Prompt 09 executado             | Não      | Não      |

## Contagens

| Artefato                      | Quantidade |
| ----------------------------- | ---------- |
| Atores (ACT)                  | 12         |
| Papéis candidatos (ROLE-CAND) | 16         |
| Regras autorização (AUTHZ)    | 42         |
| Conflitos SoD (SOD)           | 12         |
| Ações sensíveis               | 28         |
| Decisões pendentes (ADP)      | 14         |
| Negações (DENY)               | 18         |
| Cenários teste (TSC-AUTH)     | 20         |

## Quality gate

| Critério                           | Resultado                     |
| ---------------------------------- | ----------------------------- |
| Toda ação sensível mapeada         | PASS (28)                     |
| Autorização funcional ≠ contextual | PASS                          |
| SoD documentada                    | PASS (12 SOD)                 |
| Custo/margem protegidos            | PASS (AUTHZ-015/016, INV-006) |
| Admin técnico sem poder automático | PASS (SOD-012, ROLE-015)      |
| Nenhuma role definitiva inventada  | PASS                          |
| Sem código                         | PASS                          |
| Prompt 09 não executado            | PASS                          |

**Quality gate geral:** PASS_WITH_RESTRICTIONS

## Restrições

1. SRC-001 não validada — papéis e alçadas permanecem CANDIDATE/PENDING.
2. DDP-003, DDP-015, DDP-022 bloqueiam confirmação de SoD maker-checker.
3. Delegação e break-glass não definidos (ADP-003, ADP-009).
4. Isolamento cliente/unidade aberto (SEC-REQ-019, ADP-014).
5. Autenticação/JWT explicitamente fora de escopo.

## Rastreabilidade

- `docs/01-foundation/requirements-traceability.md`
- `docs/00-governance/prompt-execution-log.md`
- `docs/README.md`

## Próximo passo

Prompt 09 — **não executado**.
