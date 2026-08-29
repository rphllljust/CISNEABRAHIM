# ARCH-LAY-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Responsabilidades por camada |
| Prompt      | 09                           |

## PRESENTATION

| Responsabilidade                          | Sim | Não |
| ----------------------------------------- | --- | --- |
| Renderizar UI / capturar intenção usuário | ✓   |     |
| Validar formato de entrada (UX)           | ✓   |     |
| Enforce regra de negócio crítica          |     | ✓   |
| Acesso direto a banco                     |     | ✓   |
| Decidir autorização empresarial final     |     | ✓   |

Notas: pode ocultar campos (custo) por UX, mas backend deve omitir na projeção (SEC-REQ-009).

## APPLICATION

| Responsabilidade                         | Sim | Não |
| ---------------------------------------- | --- | --- |
| Orquestrar caso de uso (1+ agregados)    | ✓   |     |
| Iniciar/commitar unidade de trabalho     | ✓   |     |
| Invocar autorização (AUTHZ) antes de CMD | ✓   |     |
| Traduzir DTO ↔ domínio                   | ✓   |     |
| Conter invariantes de negócio            |     | ✓   |
| Conhecer SQL/HTTP do provedor            |     | ✓   |

Subdivisão candidata: um **application service** por BC ou por UC — decisão de implementação futura.

## DOMAIN

| Responsabilidade                     | Sim | Não |
| ------------------------------------ | --- | --- |
| Invariantes (INV-*)                  | ✓   |     |
| Comandos e eventos de domínio        | ✓   |     |
| Máquinas de estado candidatas        | ✓   |     |
| Políticas de domínio puras           | ✓   |     |
| Import de ORM, framework web, broker |     | ✓   |
| Chamada HTTP externa direta          |     | ✓   |

## INFRASTRUCTURE

| Responsabilidade                                | Sim | Não |
| ----------------------------------------------- | --- | --- |
| Implementar ports (repositório, storage, clock) | ✓   |     |
| Migrations de schema (futuro)                   | ✓   |     |
| Adaptadores de persistência                     | ✓   |     |
| Regras de negócio                               |     | ✓   |

## INTEGRATION

| Responsabilidade                            | Sim | Não |
| ------------------------------------------- | --- | --- |
| ACL para sistemas externos                  | ✓   |     |
| Anti-corruption layer (TERM-048 sync)       | ✓   |     |
| Mapear eventos externos → comandos internos | ✓   |     |
| Lógica core de OS/medição/faturamento       |     | ✓   |

Camada INTEGRATION pode ser módulo BC-CAND-018 dentro do monolith ou processo separado futuro (ADR-006).

## Cross-cutting (transversal)

| Concern                 | Onde vive candidato                      |
| ----------------------- | ---------------------------------------- |
| Autenticação técnica    | Infrastructure + Identity BC             |
| Autorização empresarial | Application (gate) + Domain (predicados) |
| Auditoria SECURITY      | Infrastructure + Audit BC                |
| Logging técnico         | Infrastructure                           |
