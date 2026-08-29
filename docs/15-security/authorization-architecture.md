# SEC-AUTHZ-001

| Campo              | Valor                                          |
| ------------------ | ---------------------------------------------- |
| Document ID        | Arquitetura de autorização (enforcement)       |
| Prompt             | 14                                             |
| Modelo empresarial | [`../09-authorization/`](../09-authorization/) |

## Regra central

**Autorização não depende do frontend.** Guards, middleware e domain services validam **toda** mutação e leitura sensível no backend (TB-02).

```text
Request → Authenticate → AuthorizeCommand(CMD) → AuthorizeResource(scope)
        → AuthorizeField(projection) → Handler → Domain
```

## Camadas de enforcement

| Camada                   | Responsabilidade                                           |
| ------------------------ | ---------------------------------------------------------- |
| API Gateway / Controller | AuthN, rate limit, input schema                            |
| Application guard        | CMD × ROLE-CAND × escopo (command-authorization-matrix.md) |
| Domain policy            | SoD, invariantes INV-006, SM transition AuthZ              |
| Persistence projection   | Omitir colunas custo/margem se não AUTHZ-015/016           |
| Integration ACL          | Não propagar trust externo (SEC-REQ-021)                   |

## Autorização contextual

| Contexto      | Exemplo                     | Fonte                              |
| ------------- | --------------------------- | ---------------------------------- |
| Escopo OS     | Executor só OS atribuída    | access-scope-candidates.md         |
| Estado SM     | Liberar só PREPARADA        | transition-authorization-matrix.md |
| SoD           | Decisor ≠ submissor medição | SOD-004                            |
| Dado sensível | Custo omitido JSON          | sensitive-data-access-matrix.md    |
| Financeiro    | CMD-020 ROLE 010            | command-authorization-matrix.md    |

## DENY handling

| Regra               | Detalhe                         |
| ------------------- | ------------------------------- |
| DENY-018 bypass URL | 403/404 genérico — SEC-REQ-015  |
| DENY-006 custo      | Sem vazar existência campo      |
| SECURITY_AUDIT      | Negativas sensíveis catalogadas |

## O que o frontend NÃO faz

| Proibido                           | Backend faz                     |
| ---------------------------------- | ------------------------------- |
| Esconder botão liberar             | Rejeita CMD-005                 |
| Ocultar coluna custo               | Não serializa campo             |
| Guardar role em localStorage trust | Valida token + server-side role |

## BC-001 Identity

Ponte ACT ↔ IdP subject — sem duplicar matriz ROLE no JWT além de claims mínimos.

## Testes

SEC-TEST-007, 010, 015, 018 — authorization-test-scenarios.md alinhado.

## Pendente

ADP-002 GLOBAL_SCOPE, ADP-014 isolamento tenant — filtros query mandatory quando fechado.
