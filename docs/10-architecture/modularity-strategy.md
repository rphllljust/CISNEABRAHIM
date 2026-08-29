# ARCH-MOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Estratégia de modularidade |
| Base | BC-CAND-001..018, ADR-002 ACCEPTED |
| Prompt | 09 |

## Princípio

Um **módulo lógico** por bounded context candidato, com API pública explícita e persistência owned.

## Estrutura lógica candidata (sem pastas reais)

```text
modules/
  service-order/          # BC-006
    domain/
    application/
    infrastructure/       # repos owned
    api/                  # contrato público para outros módulos
  measurement/            # BC-010
  ...
  integration/            # BC-018
shared-kernel/            # mínimo: IDs, Money?, Result types — ARCH-DDP-003
```

## Regras de módulo

| Regra | Descrição |
| --- | --- |
| MOD-001 | Cada módulo possui seu schema/tabelas owned (logical) |
| MOD-002 | Outro módulo referencia por ID, não por join direto preferencial |
| MOD-003 | Eventos de domínio para notificar cross-module |
| MOD-004 | Sem SHARED_KERNEL de entidades de negócio |
| MOD-005 | BC-016 Reporting: CQRS read models — sem write back |

## Extração futura

| Módulo | Prontidão extração | Notas |
| --- | --- | --- |
| BC-018 Integration | Alta | Já é borda |
| BC-015 Notification | Média | Pode virar worker |
| BC-006 Service Order | Baixa | Núcleo transacional |
| BC-013 Payment | Média | Depende DDP-012 SoT |

Ver [extraction-readiness.md](../06-domain-boundaries/extraction-readiness.md).

## vs organização por camada apenas

Camadas horizontais **dentro** de cada módulo — não uma pasta `controllers/` global com tudo misturado.

## Riscos

Monólito modular degradando para opção A — mitigação: DR-005, DR-006, métricas de acoplamento (futuro).
