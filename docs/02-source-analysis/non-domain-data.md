# Dados não pertencentes ao domínio empresarial

| Campo | Valor |
| --- | --- |
| Document ID | NDD-001 |
| Princípio | Separar persistência técnica de conceitos de negócio (SRC-001 §16, EP-002) |

## Categorias técnicas (não promover a entidade de negócio)

| Dado técnico | Motivo da separação | Relação com domínio |
| --- | --- | --- |
| ID interno (UUID, serial) | Identificador técnico | Referencia entidades de domínio |
| Timestamps de auditoria (`created_at`, `updated_at`) | Infraestrutura | Complementam eventos de domínio |
| Hash de arquivo | Integridade | Vinculado a ARQUIVO BINÁRIO |
| Caminho/URI de storage | Infraestrutura | Vinculado a versão documental |
| Token de sessão / JWT | Autenticação técnica | DDP-015 não resolvido |
| Lock de concorrência | EP-005 | Não é estado empresarial |
| Idempotency-Key | EP-006 | Técnico |
| Log de aplicação | Observabilidade | Pode correlacionar com audit trail |
| Metadados de backup | EP-020 | DDP-016 |
| Versão de schema / migration | Engenharia | Fora domínio |
| Configuração de integração (URL, credencial) | DDP-014 | Não confundir com PO ou OS |

## Dados de domínio que **parecem** técnicos

| Conceito | Tratamento |
| --- | --- |
| Chassi, RENAVAM, placa | Dados de domínio de frota se confirmados — DDP-034, DDP-027 |
| Número PO externo | Identificador de negócio do cliente — EV-060 |
| WhatsApp message id | Técnico de integração; conversa de negócio TBD — DDP-033 |

## Regra

Frontend e campos de formulário **não** substituem boundary de segurança (AGENTS.md §17–18).
