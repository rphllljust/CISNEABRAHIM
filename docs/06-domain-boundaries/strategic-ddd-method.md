# DBND-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método DDD estratégico |
| Fonte | SRC-001, governança |
| Prompt | 05 |

## Separação obrigatória

| Espaço | Contém | Não contém |
| --- | --- | --- |
| **PROBLEM_SPACE** | Subdomínios, capacidades empresariais, diferenciação, riscos de negócio | Pastas, APIs, bancos, deployables |
| **SOLUTION_SPACE** | Bounded contexts **candidatos**, ownership, relações, mapa | Microserviços confirmados, aggregates, máquinas de estado |

Subdomínio ≠ bounded context. Um subdomínio pode mapear para um ou mais contextos candidatos; um contexto pode atender partes de vários subdomínios apenas com justificativa explícita.

## Identificadores

| Tipo | Padrão |
| --- | --- |
| Subdomínio | SUBD-NNN |
| Bounded context candidato | BC-CAND-NNN |
| Decisão de fronteira pendente | DBND-NNN |

## Classificação de subdomínio (candidata)

`CORE_CANDIDATE` · `SUPPORTING_CANDIDATE` · `GENERIC_CANDIDATE` · `UNCLASSIFIED`

**Regra:** não classificar como core apenas por complexidade técnica. Core candidato exige diferenciação empresarial evidenciada ou centralidade no fluxo operacional descrito em SRC-001.

## Status de bounded context

`CANDIDATE` · `PENDING_BUSINESS_VALIDATION` · `PENDING_ARCHITECTURE_DECISION` · `ACCEPTED_FOR_FURTHER_MODELING` · `REJECTED` · `SUPERSEDED`

`ACCEPTED_FOR_FURTHER_MODELING` **não** autoriza implementação.

## Relações entre contextos (candidatas)

`UPSTREAM_DOWNSTREAM` · `CUSTOMER_SUPPLIER` · `CONFORMIST` · `ANTI_CORRUPTION_LAYER` · `OPEN_HOST_SERVICE` · `PUBLISHED_LANGUAGE` · `PARTNERSHIP` · `SHARED_KERNEL` · `SEPARATE_WAYS` · `UNKNOWN`

`SHARED_KERNEL` = alto risco — exige DBND e evidência.

## Ownership (tipos)

| Tipo | Significado |
| --- | --- |
| Concept owner | Dono semântico do conceito |
| Write owner | Única escrita autoritativa |
| Decision owner | Dono da decisão empresarial |
| Consumer | Lê referência; não altera origem |
| Replica | Cópia derivada com política de sync |
| External reference | SoT fora do sistema candidato |
| Source of Truth | Sistema ou contexto autoritativo externo/interno |

Nenhum dado com dois write owners sem política de conflito registrada.

## Proibições (Prompt 05)

Código, módulos, microserviços, monorepo, banco por contexto, mensageria, API, aggregate, máquina de estados, divisão por CRUD/tela, scripts auxiliares.

## Critérios de decomposição

1. **Linguagem ubíqua** distinta ou extensão coerente (TERM-*).
2. **Regras e invariantes** que mudam juntas (BR-*).
3. **Ownership de dados** sem duplicidade silenciosa.
4. **Ciclos de vida** independentes quando evidenciados.
5. **NFRs** de consistência, idempotência e auditoria por fronteira.

Não decompor por entidade CRUD isolada.
