# ARCH-DRV-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Drivers arquiteturais  |
| Total       | 22 (ARCH-DRV-001..022) |
| Prompt      | 09                     |

> Driver = força que influencia decisão arquitetural. Rastreável a NFR, risco, BC ou requisito.

| ID           | Driver                                           | Tipo         | Fonte                       | Impacto                            | Prioridade |
| ------------ | ------------------------------------------------ | ------------ | --------------------------- | ---------------------------------- | ---------- |
| ARCH-DRV-001 | Fase FOUNDATION / descoberta ativa               | Restrição    | SRC-000, ED-001             | Evitar lock-in prematuro           | Crítica    |
| ARCH-DRV-002 | 40+ DDP abertos; fronteiras movem                | Restrição    | domain-decisions-pending    | Modularidade reversível            | Crítica    |
| ARCH-DRV-003 | Consistência forte em conversão OS e faturamento | NFR          | NFR-003, WF-001, WF-004     | Favorece transação local           | Alta       |
| ARCH-DRV-004 | Integridade financeira e idempotência            | NFR          | NFR-011, CMD-020/021        | Concorrência explícita             | Crítica    |
| ARCH-DRV-005 | 18 bounded contexts candidatos                   | Domínio      | BC-CAND-001..018            | Decomposição modular               | Alta       |
| ARCH-DRV-006 | Fluxos transversais WF-001..008                  | Domínio      | cross-context-workflows     | Coordenação entre módulos          | Alta       |
| ARCH-DRV-007 | Autorização empresarial contextual               | Segurança    | SEC-REQ-001..010, Prompt 08 | Backend boundary                   | Crítica    |
| ARCH-DRV-008 | Segregação de funções (SoD)                      | Segurança    | SOD-001..012, NFR-019       | Não simplificar em RBAC            | Alta       |
| ARCH-DRV-009 | Custo/margem restritos                           | Segurança    | NFR-008, SEC-REQ-009        | Projeções por papel                | Alta       |
| ARCH-DRV-010 | Audit trail ≠ log técnico                        | Conformidade | NFR-029, EP-007             | Trilhas separadas                  | Alta       |
| ARCH-DRV-011 | Integrações externas (ERP, PO, pagamento)        | Integração   | NFR-012, DDP-009/012/014    | ACL, eventual consistency          | Alta       |
| ARCH-DRV-012 | Volume e escala desconhecidos                    | Incerteza    | TARGET_NOT_DEFINED          | Não distribuir por suposição       | Média      |
| ARCH-DRV-013 | Equipe e experiência não formalizadas            | Incerteza    | UNKNOWN                     | Custo operacional distribuído alto | Média      |
| ARCH-DRV-014 | Disponibilidade / RPO / RTO não definidos        | NFR          | NFR-025..028                | Baseline simples candidata         | Média      |
| ARCH-DRV-015 | Documentos lógico/versão/arquivo                 | Domínio      | TERM-031..033, EP-009       | Storage separado candidato         | Média      |
| ARCH-DRV-016 | Estados independentes por ciclo                  | Domínio      | SM-CAND-001..010            | Sem status global OS               | Alta       |
| ARCH-DRV-017 | Concorrência em alocação e liberação             | Domínio      | EXCLUSIVE_RESOURCE          | Locks/versão futuros               | Alta       |
| ARCH-DRV-018 | Observabilidade sem vazar sensíveis              | NFR          | NFR-021, EP-021             | Redação em logs                    | Média      |
| ARCH-DRV-019 | Testabilidade proporcional ao risco              | Qualidade    | EP-022, QA-SC               | Módulos testáveis isoladamente     | Média      |
| ARCH-DRV-020 | Evolução sem big ball of mud                     | Qualidade    | modular-monolith-assessment | Enforcement de dependências        | Alta       |
| ARCH-DRV-021 | Multi-cliente/unidade possível                   | Segurança    | SEC-REQ-019, ADP-014        | Isolamento escopo futuro           | Média      |
| ARCH-DRV-022 | Domínio independente de framework                | Princípio    | EP-024, ED-004              | Camadas + ports                    | Crítica    |

## Drivers críticos (top 5)

1. ARCH-DRV-007 — autorização no backend
2. ARCH-DRV-004 — integridade financeira
3. ARCH-DRV-003 — consistência forte candidata
4. ARCH-DRV-001/002 — descoberta; não congelar prematuramente
5. ARCH-DRV-022 — domínio puro

## Não são drivers (ainda)

Throughput específico, multi-região, mobile offline-first — sem evidência em SRC-001.
