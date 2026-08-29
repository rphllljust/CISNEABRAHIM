# ARCH-PRIN-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Princípios arquiteturais                |
| Prompt      | 09                                      |
| Base        | EP-001..025 (engineering-principles.md) |

| ID     | Princípio                                                         | Relação EP           |
| ------ | ----------------------------------------------------------------- | -------------------- |
| AP-001 | Negócio e domínio governam; tecnologia serve                      | EP-001               |
| AP-002 | Módulos alinhados a BC-CAND, não a CRUD/tela                      | DBND, Prompt 05      |
| AP-003 | Um write owner por agregado lógico                                | ADR-003              |
| AP-004 | Domínio não depende de framework, ORM ou transporte               | EP-024, ARCH-DRV-022 |
| AP-005 | Autorização avaliada no núcleo da aplicação, não só na UI         | EP-002, SEC-REQ      |
| AP-006 | Consistência forte dentro do boundary; eventual entre integrações | ADR-004              |
| AP-007 | Integrações através de ACL explícita (BC-CAND-018)                | ADR-005              |
| AP-008 | Estados e ciclos de vida separados por contexto                   | EP-017, SM-CAND      |
| AP-009 | Idempotência em operações financeiras e de conversão              | EP-006, NFR-011      |
| AP-010 | Observabilidade sem dados sensíveis em logs                       | EP-021               |
| AP-011 | Evolução incremental: modular monolith antes de distribuir        | ADR-001              |
| AP-012 | Decisões de stack explicitadas em ADR — nunca silenciosas         | ED-004               |
| AP-013 | Falha externa não cria sucesso local falso                        | EP-018               |
| AP-014 | Reversibilidade documentada em ADRs                               | ADR template         |
| AP-015 | Nenhuma otimização prematura (distribuição, cache global)         | EP-023               |

## Anti-padrões rejeitados

| Anti-padrão                                  | Motivo            |
| -------------------------------------------- | ----------------- |
| Microservices por prestígio                  | ARCH-DRV-012, 013 |
| Monólito anêmico CRUD                        | AP-002            |
| Shared database entre contextos sem política | ADR-003           |
| ORM schema = modelo de domínio               | EP-024            |
| Permissão só no frontend                     | EP-002            |
