# SEC-STRIDE-001

| Campo | Valor |
| --- | --- |
| Document ID | Threat model STRIDE |
| Total | 36 (SEC-THR-001..036) |
| Prompt | 14 |

> Probabilidade: **L** Low · **M** Medium · **H** High. Status: **OPEN** / **MITIGATED_CANDIDATE** / **ACCEPTED_RESIDUAL**.

## Fluxo F-01 — Autenticação e sessão

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle (SEC-CTL) | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-001 | Spoofing | SEC-AST-001 | Externo | Credencial roubada / phishing | Conta válida | Takeover | M | MFA candidato; SEC-CTL-001 | MFA não decidido | SEC-TEST-001 | BC-001 | OPEN |
| SEC-THR-002 | Spoofing | SEC-AST-001 | Externo | Token JWT forjado | Weak secret | Acesso API | L | SEC-CTL-002 assinatura; rotação keys | IdP TBD | SEC-TEST-002 | BC-001 | MITIGATED_CANDIDATE |
| SEC-THR-003 | Tampering | SEC-AST-011 | Externo | Session fixation | Login sem regenerate | Hijack sessão | L | SEC-CTL-003 regenerate session ID | — | SEC-TEST-003 | App | MITIGATED_CANDIDATE |
| SEC-THR-004 | Repudiation | SEC-AST-013 | Interno | Negar ação admin | Audit ausente | Sem prova | M | SEC-CTL-004 SECURITY_AUDIT | ADP-011 WORM pending | SEC-TEST-004 | BC-017 | OPEN |
| SEC-THR-005 | Info Disc | SEC-AST-001 | Externo | Enumeração login | Endpoint login | User enumeration | M | SEC-CTL-005 mensagem genérica | Residual baixo | SEC-TEST-005 | App | MITIGATED_CANDIDATE |
| SEC-THR-006 | DoS | API | Externo | Flood login | Sem rate limit | Indisponibilidade | M | SEC-CTL-006 rate limit TB-01 | DDoS volumétrico | SEC-TEST-006 | Infra | OPEN |

## Fluxo F-02 — CMD-003 Conversão solicitação

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-007 | Elevation | SEC-AST-003 | Interno | API direta sem AuthZ | Token válido baixo privilégio | OS não autorizada | M | SEC-CTL-007 AuthZ CMD-003 | — | SEC-TEST-007 | BC-006 | MITIGATED_CANDIDATE |
| SEC-THR-008 | Tampering | SEC-AST-003 | Externo | Replay conversão | Idempotency ausente | Dup OS | L | SEC-CTL-008 UNQ/idempotency | — | SEC-TEST-008 | App | MITIGATED_CANDIDATE |
| SEC-THR-009 | Repudiation | SEC-AST-012 | Interno | Negar conversão | — | Disputa | L | DE-003 audit | — | SEC-TEST-009 | BC-017 | MITIGATED_CANDIDATE |

## Fluxo F-03 — CMD-005 Liberar OS

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-010 | Elevation | SEC-AST-003 | Interno | Preparador libera própria OS | SoD fraca | Bypass controle | M | SEC-CTL-009 SOD-002; SEC-REQ-003 | ADP pendente | SEC-TEST-010 | BC-006 | OPEN |
| SEC-THR-011 | Tampering | SEC-AST-016 | Interno | Liberar sem saldo PO | Race saldo | Saldo negativo | M | SEC-CTL-010 PESS PO lock | CARD-DDP-002 | SEC-TEST-011 | BC-004 | OPEN |
| SEC-THR-012 | Info Disc | SEC-AST-003 | Externo | IDOR OS alheia | UUID guess | Vazamento status | L | SEC-CTL-011 escopo + deny genérico | UUID v7 reduz scan | SEC-TEST-012 | App | MITIGATED_CANDIDATE |

## Fluxo F-04 — CMD-015 Alocação recurso

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-013 | Tampering | SEC-AST-003 | Interno | Dupla alocação | Race | Conflito operacional | M | SEC-CTL-012 PESS allocation | — | SEC-TEST-013 | BC-007 | MITIGATED_CANDIDATE |
| SEC-THR-014 | Elevation | SEC-AST-003 | Executor | Alocar sem papel | — | Recurso indevido | M | SEC-CTL-007 AuthZ CMD-015 | — | SEC-TEST-014 | BC-007 | MITIGATED_CANDIDATE |

## Fluxo F-05 — Dados financeiros (custo/margem)

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-015 | Info Disc | SEC-AST-004 | Interno | API retorna custo em JSON OS | Projeção UI-only | Vazamento margem | H | SEC-CTL-013 field-level AuthZ | Dev error residual | SEC-TEST-015 | BC-003 | OPEN |
| SEC-THR-016 | Info Disc | SEC-AST-004 | Interno | Export CSV sem AuthZ | — | Mass leak | M | SEC-CTL-014 AUTHZ-026 + audit | — | SEC-TEST-016 | BC-003 | MITIGATED_CANDIDATE |
| SEC-THR-017 | Tampering | SEC-AST-005 | Interno | Alterar preço pós-liberação | CMD-013 abusivo | Prejuízo | M | SEC-CTL-015 SEC-REQ-007 transition AuthZ | ADP-008 | SEC-TEST-017 | BC-003 | OPEN |
| SEC-THR-018 | Elevation | SEC-AST-006 | Financeiro | Aprovar própria medição | SoD | Fraude medição | M | SEC-CTL-016 SOD-004 | — | SEC-TEST-018 | BC-010 | MITIGATED_CANDIDATE |

## Fluxo F-06 — CMD-020/021 Nota e pagamento

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-019 | Spoofing | SEC-AST-008 | Externo | Webhook pagamento falso | Sem HMAC | Pagamento fantasma | M | SEC-CTL-017 inbox HMAC | Secret rotation | SEC-TEST-019 | BC-018 | OPEN |
| SEC-THR-020 | Tampering | SEC-AST-007 | Interno | Dup NF key bypass | Race | Dup faturamento | L | SEC-CTL-018 UNQ NF | — | SEC-TEST-020 | BC-012 | MITIGATED_CANDIDATE |
| SEC-THR-021 | Repudiation | SEC-AST-008 | Interno | Negar registro pagamento | — | Disputa | M | SECURITY_AUDIT + DE-018 | — | SEC-TEST-021 | BC-013 | MITIGATED_CANDIDATE |

## Fluxo F-07 — Documentos (CMD-016/022)

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-022 | Info Disc | SEC-AST-009 | Externo | URL storage adivinhável | Bucket público | Vazamento evidência | M | SEC-CTL-019 private bucket + signed URL | Misconfig infra | SEC-TEST-022 | BC-014 | OPEN |
| SEC-THR-023 | Tampering | SEC-AST-009 | Externo | Upload malware | — | Compromisso cliente | M | SEC-CTL-020 scan + MIME verify | Zero-day | SEC-TEST-023 | BC-014 | OPEN |
| SEC-THR-024 | Elevation | SEC-AST-009 | Interno | Substituir doc sem papel | — | Evidência adulterada | M | SEC-CTL-021 CMD-022 AuthZ | — | SEC-TEST-024 | BC-014 | MITIGATED_CANDIDATE |

## Fluxo F-08 — Integração e infra

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-025 | Tampering | SEC-AST-014 | Externo | Payload ERP malicioso | Inbox trust | SQLi/injection | M | SEC-CTL-022 validate + param queries | ORM bypass bug | SEC-TEST-025 | BC-018 | MITIGATED_CANDIDATE |
| SEC-THR-026 | Info Disc | SEC-AST-002 | Interno | Secret em log/git | Commit acidental | Full breach | M | SEC-CTL-023 secret manager; pre-commit | Human error | SEC-TEST-026 | Infra | OPEN |
| SEC-THR-027 | Info Disc | SEC-AST-017 | Admin | Log com PII/custo | Verbose logging | Compliance risk | M | SEC-CTL-024 redaction | — | SEC-TEST-027 | App | OPEN |
| SEC-THR-028 | DoS | API | Externo | Large payload upload | Sem limit | Crash | M | SEC-CTL-025 size limit + WAF candidato | — | SEC-TEST-028 | Infra | MITIGATED_CANDIDATE |
| SEC-THR-029 | Elevation | SEC-AST-018 | Admin | Restore backup em dev com prod data | Processo fraco | Mass leak | M | SEC-CTL-026 env isolation | — | SEC-TEST-029 | Infra | OPEN |
| SEC-THR-030 | Spoofing | SEC-AST-015 | Externo | Mapping ID swap | ACL fraca | Wrong entity link | L | SEC-CTL-027 validate internal refs | — | SEC-TEST-030 | BC-018 | MITIGATED_CANDIDATE |

## Fluxo F-09 — Abuso empresarial (cross-cutting)

| ID | S | Ativo | Ator | Vetor | Pré-condição | Impacto | Prob | Controle | Risco residual | Teste | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-THR-031 | Elevation | SEC-AST-003 | Insider | Colusão SoD | 2 atores | Fraude | L | SEC-CTL-028 monitoramento audit | Colusão difícil | SEC-TEST-031 | BC-017 | ACCEPTED_RESIDUAL |
| SEC-THR-032 | Repudiation | SEC-AST-012 | Insider | Alterar histórico | DB admin | Apagar trilha | L | SEC-CTL-029 append-only + DB perms | DBA rogue | SEC-TEST-032 | Infra | OPEN |
| SEC-THR-033 | Info Disc | SEC-AST-010 | Interno | Scraping API lista OS | Token operacional | PII bulk | M | SEC-CTL-030 pagination + rate limit | — | SEC-TEST-033 | App | OPEN |
| SEC-THR-034 | Tampering | SEC-AST-006 | Interno | Medição inflada | Executor+cumplice | Overbilling | M | SEC-CTL-031 SoD + evidência obrigatória | — | SEC-ABU-008 | BC-010 | OPEN |
| SEC-THR-035 | Denial | SEC-AST-003 | Interno | Cancelamento massivo | Alçada | Paralisia ops | L | SEC-CTL-032 alçada cancelamento | — | SEC-ABU-012 | BC-006 | MITIGATED_CANDIDATE |
| SEC-THR-036 | Elevation | Multi-tenant | Externo | Cross-tenant query | SEC-REQ-019 open | Vazamento cliente | M | SEC-CTL-033 tenant filter mandatory | ADP-014 | SEC-TEST-034 | App | OPEN |

## Índice STRIDE agregado

| Categoria | Count |
| --- | --- |
| Spoofing | 4 |
| Tampering | 10 |
| Repudiation | 5 |
| Information Disclosure | 9 |
| Denial of Service | 3 |
| Elevation of Privilege | 9 |

Controles detalhados: [security-decisions.md](./security-decisions.md) e documentos de política.
