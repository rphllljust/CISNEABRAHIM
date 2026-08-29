# DBND-OVERVIEW-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Visão do domínio empresarial |
| Fonte       | SRC-001                      |
| Prompt      | 05                           |

## Problema empresarial (PROBLEM_SPACE)

Empresa de serviços operacionais (transporte, locação, mão de obra e equipamentos candidatos) precisa **controlar** o fluxo desde a demanda até efeitos comerciais e financeiros, com:

- registro de **solicitações** distintas de **Ordens de Serviço (OS)**;
- planejamento e **alocação** de recursos (frota, equipamento, pessoas);
- **execução** em campo com evidências;
- **medição** e encadeamento com **faturamento** e **pagamento** candidatos;
- vínculo com referências **comerciais** (contrato, PO, proposta) sem cardinalidade confirmada;
- **auditoria** e separação custo/preço/margem;
- integração com sistemas externos cujo **Source of Truth** permanece pendente (DDP-020).

**Fonte:** SRC-001 (contexto reconstruído, `PENDING_BUSINESS_VALIDATION`).

## Fluxo macro candidato

```text
Demanda (solicitação) → OS (planejamento/liberação) → Recursos → Execução → Evidência
    → Medição → Faturamento → Nota informada → Pagamento (SoT pendente)
```

Cada seta é **candidata**; handoffs detalhados em [cross-context-workflows.md](./cross-context-workflows.md).

## Diferenciação empresarial (hipótese a validar)

| Área                                        | Por que pode ser core candidato           | Confiança |
| ------------------------------------------- | ----------------------------------------- | --------- |
| Controle OS ponta a ponta                   | Citado como unidade central em SRC-001    | MEDIUM    |
| Medição → faturamento com origem rastreável | EV-062, EV-074; distinção fiscal pendente | MEDIUM    |
| Alocação com detecção de conflito           | EV-053; diferenciação operacional         | MEDIUM    |
| Integração comercial sem duplicar ERP       | EV-058; risco de SoT                      | LOW       |

## Atores candidatos (sem papéis fechados)

Solicitante, Autorizador empresarial, Executor, Responsável pela OS, Comercial, Financeiro, Direção — conforme TERM-* e stakeholders-register.

## O que não está no escopo confirmado

- Emissão fiscal (NF-e) pelo sistema — não afirmado (TERM-018).
- WhatsApp como obrigação — `CAPABILITY_ONLY` (DDP-021).
- Locação como escopo fechado — candidato prioritário, não confirmado (BR-003).

## Modelagem da solução (SOLUTION_SPACE)

Decomposição em **18 bounded contexts candidatos** e **12 subdomínios** — ver registros nesta pasta. Nenhum deployable definido.
