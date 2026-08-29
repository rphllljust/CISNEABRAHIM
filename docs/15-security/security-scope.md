# SEC-SCOPE-001

| Campo | Valor |
| --- | --- |
| Document ID | Escopo de segurança |
| Prompt | 14 |

## Dentro do escopo

| Área | Cobertura |
| --- | --- |
| Aplicação modular monolith futura | API, domínio, persistência |
| Autenticação e sessão | Candidata — IdP TBD (SEC-REQ-017) |
| Autorização empresarial | Enforcement backend alinhado Prompt 08 |
| Dados sensíveis | Custo, margem, PII operacional, documentos |
| Integração BC-018 | Inbox, ACL, não confiar resposta externa |
| Upload documental | Evidência e substituição CMD-022 |
| Audit | SECURITY_AUDIT vs DOMAIN_HISTORY vs TECHNICAL_LOG |
| Dependências e supply chain | Política candidata pnpm/Turborepo |
| Ambientes | dev/staging/prod separação candidata |

## Fora do escopo deste prompt

| Item | Motivo |
| --- | --- |
| Implementação código | FOUNDATION |
| Escolha IdP definitiva | Prompt 20 |
| Pen test / certificação | Sem evidência |
| Conformidade legal (LGPD, ISO) | Não inventar — ADP-005 OPEN |
| Rede física / SOC do cliente | Infra cliente |
| Criptografia algoritmo fixo | SEC-REQ-022/023 PENDING_MEASUREMENT |

## Atores considerados

| Ator | Tipo |
| --- | --- |
| Usuário autenticado legítimo | Interno |
| Usuário malicioso interno | Insider |
| Atacante externo não autenticado | Internet |
| Integração ERP/webhook | M2M |
| Admin técnico | Privilegiado |
| Executor de campo | Mobile candidato |

## Objetivo de segurança

Proteger integridade operacional e financeira do ciclo solicitação→OS→execução→medição→faturamento→pagamento, com rastreabilidade e sem vazamento de dados restritos.
