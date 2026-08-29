# TECH-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de seleção tecnológica |
| Prompt | 10 |

## Processo

1. Extrair drivers de `docs/10-architecture/` e NFR/SEC.
2. Listar alternativas **sem** pré-seleção silenciosa.
3. Avaliar com [decision-scorecard.md](./decision-scorecard.md) — pesos fixos antes dos scores.
4. Registrar decisão em ADR-TECH-* com alternativas rejeitadas.
5. Verificar versões em fontes oficiais; registrar data.
6. **Não** instalar dependências nem criar `package.json`.

## Critérios do scorecard (pesos)

| Critério | Peso | Justificativa |
| --- | --- | --- |
| Integridade / transações | 15% | ARCH-DRV-003/004, financeiro |
| Segurança | 12% | SEC-REQ, authZ backend |
| Testabilidade | 12% | EP-022, modular monolith |
| Manutenção / maturidade | 10% | Equipe UNKNOWN — favorece ecossistema estável |
| Produtividade | 10% | Velocidade sem sacrificar integridade |
| Compatibilidade arquitetural | 10% | ADR-001..006 |
| Operação / deploy | 8% | TOPO-002 |
| Documentação | 8% | Onboarding futuro |
| Curva aprendizado | 7% | Equipe não formalizada |
| Risco lock-in | 5% | Portabilidade |
| Custo | 3% | OSS preferido |

**Total:** 100%. Pesos definidos **antes** de pontuar opções.

## Escala de pontuação

| Score | Significado |
| --- | --- |
| 5 | Excelente para este projeto |
| 4 | Adequado |
| 3 | Neutro / trade-offs |
| 2 | Fraco |
| 1 | Inadequado |

## Status ADR tecnológico

`PROPOSED` · `ACCEPTED` · `REJECTED` · `SUPERSEDED` · `PENDING_INFORMATION`

## Proibições

- Manipular pesos pós-avaliação
- `package.json`, `node_modules`, código de app
- Escolher cloud provider (Prompt 09)
