# ARCH-OPT-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise de opções arquiteturais |
| Prompt | 09 |

## Opções avaliadas

| Opção | Descrição |
| --- | --- |
| A | Monólito desestruturado (big ball of mud) |
| B | **Modular monolith** |
| C | Microservices |
| D | Arquitetura distribuída orientada a eventos |
| E | Híbrido (núcleo monolítico + serviços de borda) |

## Matriz de comparação

Legenda: ++ favorável · + adequado · 0 neutro · − desfavorável · ? desconhecido

| Critério | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| Estágio descoberta | − | **++** | − | − | + |
| Equipe (UNKNOWN) | + | **++** | − | − | 0 |
| Custo operacional | + | **++** | − | − | 0 |
| Consistência transacional | 0 | **++** | − | − | + |
| Transações WF-001..006 | 0 | **++** | − | 0 | + |
| Isolamento de falha | − | 0 | **++** | + | + |
| Isolamento de deploy | − | 0 | **++** | + | + |
| Implantação inicial | **++** | **++** | − | − | 0 |
| Observabilidade | − | + | 0 | + | 0 |
| Testes integrados | + | **++** | − | 0 | + |
| Evolução/refatoração BC | − | **++** | + | + | + |
| Integrações ACL | 0 | + | + | + | **++** |
| Recuperação / DR | ? | + | 0 | 0 | 0 |
| Segurança (authZ central) | − | **++** | + | 0 | + |
| Risco big ball of mud | **−−** | 0* | + | + | 0 |

\* Mitigável com enforcement de módulos (modularity-strategy.md)

## Síntese por opção

### A — Monólito desestruturado

**Rejeitado** como direção. Baixo custo inicial mascarando acoplamento. Incompatível com 18 BCs e AP-002.

### B — Modular monolith (candidato preferido)

**PROPOSED** em ADR-001. Melhor equilíbrio para FOUNDATION: transações locais, um deploy, módulos = BC-CAND. Risco: disciplina de módulos.

### C — Microservices

**Rejeitado para início.** ARCH-DRV-012/013, custo operacional, sagas para WF-004..006, consistência financeira complexa. Revisitar após sizing e extração readiness.

### D — Event-driven distribuído

**Rejeitado como estilo primário.** Útil para notificações e integração (ADR-005 parcial). Não como substituto de consistência forte inicial.

### E — Híbrido

**Candidato futuro.** Núcleo modular monolith + workers/integração separados quando volume justificar. ADR-006 PROPOSED.

## Decisão

Ver [ADR-001](./adr/ADR-001-architecture-style.md): estilo inicial **modular monolith** (PROPOSED até DDP-017/DBND-006).

Não escolher microservices por prestígio técnico.
