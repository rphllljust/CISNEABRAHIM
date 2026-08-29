# Project Charter — SISTEMA CISNE RONDÔNIA

| Campo | Valor |
| --- | --- |
| Document ID | CHARTER-001 |
| System name | SISTEMA CISNE RONDÔNIA |
| Version | 0.1.0-foundation |
| Status | `DISCOVERY_NOT_STARTED` |
| Source | SRC-000 (governança do Prompt 00) |
| Last updated | 2026-08-28 |

## Patrocinador / owner

**Ainda não formalizado.** Não há registro de patrocinador, product owner ou representante legal autorizado neste repositório.

Até formalização, nenhuma pessoa ou cargo deve ser tratado como decisor empresarial confirmado.

## Problema empresarial preliminar

**Classificação: hipótese / contexto inicial, não requisito confirmado.**

Há intenção de apoiar, por software, atividades operacionais e comerciais de empresa privada em Porto Velho, Rondônia. O contexto inicial menciona representação comercial, serviços logísticos, transportes, locações e gestão de serviços executados com veículos, equipamentos e mão de obra, além de controle de solicitações e Ordens de Serviço e possível encadeamento entre proposta, pedido, Purchase Order, OS, execução, medição, faturamento e pagamento.

Não está demonstrado, nesta fase:

- quais problemas concretos o software deve resolver primeiro;
- quais processos hoje são manuais, parcialmente informatizados ou inexistentes;
- se o sistema substituirá, complementará ou permanecerá isolado de outros sistemas;
- quais dores são contratuais versus desejos.

## Objetivo preliminar

**Classificação: objetivo de governança (esta fase) + objetivo de produto (não contratado).**

Objetivo desta fase (confirmado apenas como trabalho de repositório): criar baseline documental, protocolo de execução, proteção de domínio, rastreabilidade e critérios de prontidão **antes** de qualquer implementação.

Objetivo de produto: **não definido**. Não há meta de release, MVP ou substituição de ERP.

## Princípios de construção

Ver [`engineering-principles.md`](engineering-principles.md). Resumo aplicável à carta:

- integridade e rastreabilidade têm prioridade sobre velocidade de entrega;
- negócio antes da tecnologia;
- nenhuma implementação antes dos requisitos mínimos (Definition of Ready);
- incerteza permanece explícita.

## Escopo

O escopo de produto está **em descoberta**. Não transformar o contexto preliminar em escopo contratado.

Escopo confirmado **deste repositório nesta etapa**: apenas fundação documental e governança. Detalhamento em [`../01-foundation/scope-register.md`](../01-foundation/scope-register.md).

## Critérios de sucesso

**Pendentes.** Não há KPI, SLA, volume, RPO, RTO ou critério de aceite empresarial confirmado. Qualquer número nesse sentido seria invenção.

Critério de sucesso **desta fase de governança**: quality gates do Prompt 00 atendidos; fontes ausentes visíveis; nenhuma regra `CONFIRMED` sem evidência.

## Restrições conhecidas

| Restrição | Tipo | Evidência |
| --- | --- | --- |
| Sede informada: Porto Velho, Rondônia | Contexto inicial | SRC-000 (declaração do responsável no Prompt 00); não é prova operacional |
| Empresa privada | Contexto inicial | SRC-000 |
| Sem fontes empresariais anexadas | Fato de repositório | [`../01-foundation/source-registry.md`](../01-foundation/source-registry.md) |
| Sem stack, arquitetura ou domínio finalizados | Decisão de engenharia desta etapa | ED-001 a ED-004 |
| Proibição de implementação nesta fase | Governança | SRC-000, [`execution-protocol.md`](execution-protocol.md) |

## Áreas que exigirão validação

Antes de implementação, no mínimo (lista não exaustiva, não ranqueada como prioridade de produto):

- natureza jurídica e fiscal das operações;
- tipos e ciclo de vida de solicitações e OS;
- relação (se houver) entre proposta, pedido, PO, OS, medição, faturamento e pagamento;
- alocação de pessoas, veículos e equipamentos;
- documentos e evidências;
- autorização e segregação de funções;
- integrações e sistema de registro (Source of Truth);
- retenção, privacidade e segurança;
- continuidade (backup, RPO/RTO) — valores ainda `UNKNOWN`.

## Proibição de implementação prematura

É proibido iniciar implementação funcional, banco, API, interface ou escolha definitiva de stack enquanto:

- fontes mínimas não estiverem registradas e analisadas na etapa correspondente;
- regras críticas não tiverem proveniência;
- decisões bloqueantes permanecerem abertas;
- o item estiver `NOT_READY_FOR_IMPLEMENTATION`.

## Prioridade

1. Integridade da informação e do futuro estado transacional.
2. Rastreabilidade SOURCE → … → ACCEPTANCE.
3. Clareza do que é desconhecido.
4. Somente depois: desenho e código.

## Situação do projeto

```text
DISCOVERY_NOT_STARTED
```

Descoberta de domínio e requisitos **não** foi iniciada neste Prompt 00. O Prompt 00 apenas instala governança.
