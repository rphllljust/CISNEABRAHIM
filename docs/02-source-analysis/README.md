# Análise de fontes — Prompt 01

| Campo             | Valor                                                       |
| ----------------- | ----------------------------------------------------------- |
| Document ID       | SA-INDEX-001                                                |
| Prompt            | 01 — Ingestão e análise atômica das fontes                  |
| Data              | 2026-08-28                                                  |
| Fontes analisadas | SRC-000 (meta-governança), SRC-001 (operacional preliminar) |
| Regras CONFIRMED  | **0**                                                       |

## Propósito

Esta pasta consolida a decomposição atômica e a análise estruturada das fontes disponíveis na fase FOUNDATION. Nenhum artefato aqui autoriza implementação funcional.

## Índice de artefatos

| #   | Arquivo                                                                        | Conteúdo                                                        |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1   | [source-assessment.md](source-assessment.md)                                   | Avaliação de confiabilidade e limites de SRC-000 e SRC-001      |
| 2   | [atomic-evidence-register.md](atomic-evidence-register.md)                     | **84** evidências atômicas (EV-001–EV-084) extraídas de SRC-001 |
| 3   | [as-is-process.md](as-is-process.md)                                           | Fatos de processo atual relatados (somente CURRENT_STATE)       |
| 4   | [to-be-evidence.md](to-be-evidence.md)                                         | Capacidades e desejos futuros com rastreio                      |
| 5   | [rules-by-domain.md](rules-by-domain.md)                                       | Cobertura de regras candidatas por domínio                      |
| 6   | [service-request-analysis.md](service-request-analysis.md)                     | Análise da solicitação de serviço                               |
| 7   | [service-order-analysis.md](service-order-analysis.md)                         | Análise de OS — verbos e estados candidatos                     |
| 8   | [commercial-chain-analysis.md](commercial-chain-analysis.md)                   | Cadeia comercial e cardinalidades pendentes                     |
| 9   | [resources-and-billing-analysis.md](resources-and-billing-analysis.md)         | Recursos e fases ITEM_*                                         |
| 10  | [quantity-semantics.md](quantity-semantics.md)                                 | Semântica de quantidades por fase                               |
| 11  | [labor-analysis.md](labor-analysis.md)                                         | Mão de obra — tipos e pessoas                                   |
| 12  | [equipment-and-vehicle-analysis.md](equipment-and-vehicle-analysis.md)         | Equipamentos e veículos                                         |
| 13  | [document-and-notification-analysis.md](document-and-notification-analysis.md) | Documentos lógicos e notificações                               |
| 14  | [responsibility-and-aging-analysis.md](responsibility-and-aging-analysis.md)   | Responsabilidade, handoff e aging                               |
| 15  | [segregation-of-duties-analysis.md](segregation-of-duties-analysis.md)         | Matriz preliminar de segregação                                 |
| 16  | [exception-candidates.md](exception-candidates.md)                             | Exceções de processo candidatas                                 |
| 17  | [invariant-candidates.md](invariant-candidates.md)                             | Invariantes candidatas (INV-CAND-*)                             |
| 18  | [command-candidates.md](command-candidates.md)                                 | Comandos candidatos e restrições                                |
| 19  | [domain-event-candidates.md](domain-event-candidates.md)                       | Eventos de domínio candidatos                                   |
| 20  | [non-domain-data.md](non-domain-data.md)                                       | Dados técnicos separados do domínio                             |
| 21  | [provenance-matrix.md](provenance-matrix.md)                                   | Cadeias SOURCE→EV→BR→DDP→RISK                                   |
| 22  | [domain-evidence-map.md](domain-evidence-map.md)                               | Mapa domínio→evidências                                         |
| 23  | [ambiguous-terms.md](ambiguous-terms.md)                                       | Termos ambíguos e classificação                                 |
| 24  | [rule-normalization-report.md](rule-normalization-report.md)                   | Achados de normalização de regras                               |
| 25  | [source-gaps-and-requests.md](source-gaps-and-requests.md)                     | Lacunas e pedidos de fonte                                      |
| 26  | [coverage-audit.md](coverage-audit.md)                                         | Auditoria de cobertura                                          |
| 27  | [prompt-01-completeness-report.md](prompt-01-completeness-report.md)           | Relatório de completude do Prompt 01                            |

## Notas

- SRC-001 foi analisado neste Prompt 01; análise atômica **COMPLETE** para o conteúdo disponível.
- SRC-000 permanece fonte de governança; não gera evidências operacionais salvo meta.
- Próximo passo autorizado pelo roadmap: Prompt 02 (não executado nesta etapa).
