# SEC-RISK-REG-001

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | Riscos residuais de segurança |
| Total       | 14 (SEC-RISK-001..014)        |
| Prompt      | 14                            |

| ID           | Risco residual                     | Origem      | Prob | Impacto | Aceite                    | Mitigação futura     |
| ------------ | ---------------------------------- | ----------- | ---- | ------- | ------------------------- | -------------------- |
| SEC-RISK-001 | MFA não implementado fase 1        | SEC-THR-001 | M    | H       | Condicional               | SEC-DEC-003          |
| SEC-RISK-002 | IdP não escolhido                  | SEC-REQ-017 | M    | M       | Temporário                | Prompt 20            |
| SEC-RISK-003 | Tenant isolation ADP-014 OPEN      | SEC-THR-036 | M    | H       | **Não** prod multi-tenant | SEC-DEC-013          |
| SEC-RISK-004 | Dev error expõe custo API          | SEC-THR-015 | M    | H       | Mitigar com review        | SEC-TEST-015 CI      |
| SEC-RISK-005 | SoD empresarial não validada fonte | SEC-THR-010 | M    | H       | Até SRC validar           | ADP fechamento       |
| SEC-RISK-006 | Zero-day malware upload            | SEC-THR-023 | L    | H       | Aceito parcial            | Quarentena           |
| SEC-RISK-007 | DBA altera audit                   | SEC-THR-032 | L    | H       | Aceito infra trust        | WORM ADP-011         |
| SEC-RISK-008 | Colusão insider dois atores        | SEC-THR-031 | L    | H       | Aceito residual           | Analytics audit      |
| SEC-RISK-009 | Volumetric DDoS                    | SEC-THR-006 | M    | M       | Aceito edge               | WAF/CDN              |
| SEC-RISK-010 | Backup prod em dev                 | SEC-THR-029 | M    | H       | **Não** permitido         | SEC-CTL-026 policy   |
| SEC-RISK-011 | Privacy base legal indefinida      | ADP-005     | M    | M       | Documentado OPEN          | Stakeholder          |
| SEC-RISK-012 | SECURITY_AUDIT mutável             | ADP-011     | M    | M       | Até WORM                  | SEC-DEC-012 harden   |
| SEC-RISK-013 | Mobile token theft device          | SEC-THR-001 | M    | M       | Aceito                    | Short TTL            |
| SEC-RISK-014 | Rate limit bypass distribuído      | SEC-THR-033 | L    | M       | Aceito                    | Bot detection futuro |

## Critérios aceite

| Nível           | Significado                             |
| --------------- | --------------------------------------- |
| Aceito residual | Consciente com controles compensatórios |
| Não aceito prod | Bloqueia go-live até mitigar            |
| Temporário      | Spike prompt futuro                     |

## Bloqueadores go-live candidatos

SEC-RISK-003 (multi-tenant), SEC-RISK-004 (sem SEC-TEST-015), SEC-RISK-010 (processo).

## Não declarar

“Conforme LGPD” — sem assessoria jurídica registrada.
