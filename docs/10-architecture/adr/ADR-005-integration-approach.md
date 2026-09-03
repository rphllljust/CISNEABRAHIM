# ADR-005 — Abordagem de integração

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-005      |
| Status | **PROPOSED** |
| Data   | 2026-08-28   |
| Prompt | 09           |

## Contexto

SRC-001 indica integrações com ERP, PO, pagamento e possivelmente fiscal (DDP-014, 009, 012, 023). SEC-REQ-021 exige não confiar cegamente em respostas externas.

## Decisão

Centralizar integrações inbound/outbound no módulo **BC-CAND-018 (External Integration)** com:

- **Anti-Corruption Layer** para tradução DTO externo ↔ domínio
- **Idempotência** em operações de sync e registro financeiro
- **Reconciliação** periódica ou por evento para SoT externos
- Comandos internos disparados apenas após validação local

Padrão de mensageria (broker) — **não escolhido** (ARCH-DDP-009).

## Drivers

ARCH-DRV-011; SEC-REQ-021; EP-018; WF com ERP.

## Alternativas

| Alternativa                       | Resultado                    |
| --------------------------------- | ---------------------------- |
| Cada módulo chama ERP diretamente | Rejeitado                    |
| ESB enterprise genérico           | Rejeitado — over-engineering |
| BC-018 ACL único                  | **Proposto**                 |
| iPaaS sem ACL                     | Rejeitado                    |

## Benefícios

- Domínio protegido de mudanças externas
- Ponto único de retry/monitoramento integração

## Custos

- BC-018 pode virar gargalo se mal dimensionado
- Latência adicional de tradução

## Riscos

ARCH-RISK-005, ARCH-RISK-011.

## Consequências

- integration-architecture-overview.md
- DE-020 como integration event
- Workers candidatos para sync assíncrono

## Reversibilidade

Alta — ACL extraível para serviço separado (extraction-readiness).

## Sinais para revisão

- Volume de integração exige broker
- Múltiplos ERPs com contratos distintos

## Documentos relacionados

- [bounded-context-candidates.md](../../06-domain-boundaries/bounded-context-candidates.md) BC-018
- [integration-architecture-overview.md](../integration-architecture-overview.md)

## Emenda 2026-09-01 — ERP não é autoridade

BC-018 permanece ACL de borda. Não há ERP externo obrigatório para operação, financeiro, fiscal, contabilidade, estoque ou folha. Providers reais continuam `TEST_ONLY` / `UNCONFIGURED` até documentação externa `CONFIRMED`. O núcleo CISNE não espera o adapter para ser SoT.
