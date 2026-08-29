# DBND-MONO-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação de modular monolith |
| Prompt | 05 |
| Resultado | **CANDIDATO ADEQUADO PARA INÍCIO** — não decisão final |

## Contexto de avaliação

| Fator | Estado atual | Implicação |
| --- | --- | --- |
| Estágio de descoberta | FOUNDATION; 40 DDP abertos | Distribuição prematura = alto risco |
| Fonte primária | Ausente (SRC-001 isolada) | Fronteiras ainda movem |
| Equipe | UNKNOWN | Autonomia por contexto não demonstrada |
| Volume / escala | TARGET_NOT_DEFINED | Sem driver de split |
| Transações cross-OS→medição→faturamento | Candidatas STRONG | Favorecem processo único transacional inicial |
| Consistência | NFR-003, NFR-011 financeiros | Distribuíção exigiria sagas — custo alto |
| Deployment | NOT STARTED | Um deploy inicial reduz complexidade |
| NFR disponibilidade | TARGET_NOT_DEFINED | Sem requisito multi-região |

## Por que modular monolith é **candidato** (não decisão)

1. **18 BCs candidatos** mapeiam a módulos lógicos com fronteiras explícitas sem exigir 18 serviços.
2. Fluxos WF-001..006 atravessam contextos com consistência forte candidata — mais simples em transação local com módulos bem isolados.
3. Fase de descoberta: refatorar módulos internos custa menos que redeploy distribuído.
4. BC-CAND-018 Integration como módulo de borda ACL independente do núcleo operacional.

## Riscos do modular monolith mal feito

| Risco | Mitigação candidata |
| --- | --- |
| Monólito sem módulos (big ball of mud) | Enforce ownership por BC; sem import circular |
| Módulos viram pastas CRUD | Organizar por capacidade/linguagem, não por entidade |
| SHARED_KERNEL acidental | Ver shared-concept-analysis.md |
| Deploy único esconde acoplamento | Métricas de dependência entre módulos (futuro) |

## O que **não** afirmar

- Não afirmar que equipe atual suporta ou não modular monolith — dado ausente.
- Não afirmar que volume futuro exige distribuição — TARGET_NOT_DEFINED.
- Não escolher monorepo, framework ou banco.

## Decisão pendente

**DBND-006** — Confirmar estilo arquitetural inicial após validação empresarial e sizing (DDP-017).

Extração futura: [extraction-readiness.md](./extraction-readiness.md).
