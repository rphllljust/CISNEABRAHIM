# ARCH-DATA-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Visão geral de arquitetura de dados |
| Base        | context-data-ownership.md, ADR-003  |
| Prompt      | 09                                  |

## Princípios

1. **Um write owner** por conceito (ADR-003 ACCEPTED).
2. Schema lógico **por módulo** — não um único schema anêmico.
3. Referências cross-module por identificador estável.
4. Dados sensíveis com classificação e projeção (Prompt 08).

## Categorias de dados

| Categoria   | Exemplos                              | Owner BC      | Persistência candidata           |
| ----------- | ------------------------------------- | ------------- | -------------------------------- |
| Operacional | OS, solicitação, execução             | 005, 006, 008 | PostgreSQL                       |
| Recursos    | Alocação, planejamento                | 007           | PostgreSQL                       |
| Financeiro  | Medição, faturamento, nota, pagamento | 010..013      | PostgreSQL                       |
| Comercial   | Preço, custo, margem, PO              | 003, 004      | PostgreSQL + ACL externo         |
| Documental  | Lógico, versão, binário               | 014           | PostgreSQL meta + object storage |
| Identidade  | Ator, sessão futura                   | 001           | PostgreSQL / IdP                 |
| Auditoria   | SECURITY_AUDIT, DOMAIN_HISTORY        | 017           | Append-only store                |
| Integração  | Staging sync, dead letter             | 018           | PostgreSQL + fila?               |

## SoT externos (pendentes)

| Dado      | SoT candidato     | DDP     |
| --------- | ----------------- | ------- |
| Pagamento | Externo ou BC-013 | DDP-012 |
| PO        | Externo ou BC-004 | DDP-009 |
| Cliente   | Interno ou ERP    | DDP-020 |

## Consistência de dados

| Padrão               | Uso                            |
| -------------------- | ------------------------------ |
| Transação local ACID | CMD-003, CMD-019, conversões   |
| Read model eventual  | BC-016 reporting               |
| Reconciliação        | CMD-021 pagamento, sync BC-018 |

## Migrations (futuro)

EP-019: reversíveis ou estratégia documentada. Não criar migrations neste prompt.

## Volume

TARGET_NOT_DEFINED — sem sharding, particionamento ou CQRS global prematuros.
