# ADR-002 — Fronteiras de domínio

| Campo | Valor |
| --- | --- |
| ID | ADR-002 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |
| Prompt | 09 |

## Contexto

Prompt 05 mapeou 18 BC-CAND com ownership, fluxos WF-001..008 e conflitos documentados. A arquitetura lógica deve refletir essas fronteiras para evitar acoplamento por entidade/tela.

## Decisão

Organizar a arquitetura lógica em **módulos alinhados a BC-CAND-001..018**, cada um com responsabilidade única, API pública e linguagem ubíqua própria. Comunicação cross-module via contratos públicos ou eventos de domínio — não via acesso direto a persistência interna.

## Drivers

ARCH-DRV-005, 006, 016, 020; AP-002.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| Organização por camada técnica apenas | Rejeitado |
| Organização por tela/CRUD | Rejeitado |
| 18 microservices imediatos | Rejeitado |
| 18 módulos em monolith | **Aceito** |

## Benefícios

- Rastreabilidade CMD/INV/DE → módulo
- Estados separados (SM-CAND) preservados
- Mapa de contexto implementável

## Custos

- Overhead de contratos entre módulos
- Curva de aprendizado DDD modular

## Riscos

ARCH-RISK-001 se disciplina falhar.

## Consequências

- dependency-rules.md DR-005, DR-006
- modularity-strategy.md MOD-001..005
- Reporting (BC-016) read-only

## Reversibilidade

Média — merge de módulos possível; split já preparado por BC.

## Sinais para revisão

- Conflito BND-CFL persistente
- BC candidato inviável após validação empresarial

## Documentos relacionados

- [bounded-context-candidates.md](../../06-domain-boundaries/bounded-context-candidates.md)
- [context-map.md](../../06-domain-boundaries/context-map.md)
- [cross-context-workflows.md](../../06-domain-boundaries/cross-context-workflows.md)
