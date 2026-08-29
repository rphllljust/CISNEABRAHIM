# ADR-001 — Estilo arquitetural inicial

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-001      |
| Status | **PROPOSED** |
| Data   | 2026-08-28   |
| Prompt | 09           |

## Contexto

O sistema CISNE RONDÔNIA está em fase FOUNDATION com 18 bounded contexts candidatos, fluxos WF-001..008 com consistência forte candidata, 40+ DDP abertos, volume/equipe desconhecidos e requisitos financeiros críticos (NFR-011). É necessário escolher direção arquitetural **lógica** sem iniciar implementação.

## Decisão

Adotar como **estilo arquitetural inicial candidato** o **modular monolith**: uma unidade de deploy com módulos internos alinhados a BC-CAND-001..018, camadas PRESENTATION/APPLICATION/DOMAIN/INFRASTRUCTURE/INTEGRATION, e regras de dependência explícitas.

**Não** adotar microservices nem arquitetura distribuída orientada a eventos como estilo primário nesta fase.

## Drivers

ARCH-DRV-001, 002, 003, 004, 005, 012, 013, 020.

## Alternativas consideradas

| Alternativa              | Resultado                                    |
| ------------------------ | -------------------------------------------- |
| Monólito desestruturado  | Rejeitado — risco big ball of mud            |
| Microservices            | Rejeitado para início — custo, sagas, equipe |
| Event-driven distribuído | Rejeitado como primário — complexidade       |
| Híbrido                  | Candidato futuro pós-validação               |

Ver [architecture-options-analysis.md](../architecture-options-analysis.md).

## Benefícios

- Transações ACID locais para WF-001, WF-004
- Um deploy; menor custo operacional inicial
- Módulos mapeiam extração futura
- Testes de integração mais simples

## Custos

- Disciplina de modularidade necessária
- Escalabilidade horizontal limitada no deploy único
- Risco de degradação para monólito anêmico sem enforcement

## Riscos

ARCH-RISK-001, ARCH-RISK-002, ARCH-RISK-010.

## Consequências

- Organizar código futuro por módulo BC (quando implementação autorizada)
- BC-018 como módulo de integração na borda
- Revisitar quando ARCH-DDP-012 / DDP-017 fecharem

## Reversibilidade

**Alta** nesta fase (sem código). Após implementação: média — extração por módulo possível com custo.

## Sinais para revisão

- Sizing e SLAs definidos
- Equipes independentes por contexto
- Gargalo de deploy comprovado
- Necessidade de escala independente por BC

## Documentos relacionados

- [modular-monolith-assessment.md](../../06-domain-boundaries/modular-monolith-assessment.md)
- [modularity-strategy.md](../modularity-strategy.md)
- [ADR-002](./ADR-002-domain-boundaries.md)
- DBND-006, DDP-017
