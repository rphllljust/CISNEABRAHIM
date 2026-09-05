# Business context

| Campo          | Valor                                              |
| -------------- | -------------------------------------------------- |
| Document ID    | CTX-001                                            |
| Source         | SRC-000; **detalhado por** SRC-001 (EV-001–EV-084); identidade da operadora em SRC-002/SRC-003, corroborada por SRC-005/SRC-006; SoT em SRC-004; gates fiscais em SRC-007; autoridade operacional em SRC-008 |
| Classification | Contexto inicial **não validado** como requisito; cadastro oficial em snapshots federal/estadual; SoT centralizado confirmado; gates NF-e/DANFE confirmados; autoridade operacional máxima confirmada |
| Status         | PRELIMINARY (atividades); cadastro da operadora corroborado; gates de validade fiscal `CONFIRMED` (SRC-007); autoridade operacional `CONFIRMED` (SRC-008); tributação substantiva permanece `OPEN`; ERP `REJECTED` (SRC-004) |
| Last updated   | 2026-09-03 (SRC-008) |

## Organização

Empresa privada sediada em Porto Velho, Rondônia (SRC-000 / SRC-001 EV-001).

**Identidade da operadora (não é Client):**

| Campo | Valor | Fonte | Classificação |
| ----- | ----- | ----- | ------------- |
| Razão social canônica (operação) | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA | SRC-002 | Fato empresarial já registrado |
| Nome empresarial no cadastro federal | CISNE RONDONIA COMERCIO E SERVICOS LTDA | SRC-005, páginas 1–3 | Fato cadastral no snapshot fornecido |
| Porte | EPP | SRC-005, página 1 | Porte cadastral; não equivale a regra tributária |
| CNPJ | 11.897.171/0001-81 | SRC-002/SRC-003; corroborado por SRC-005/SRC-006 | Fato empresarial |
| Situação cadastral federal | ATIVA desde 05/05/2010 | SRC-005, páginas 1–3 | Snapshot federal emitido em 03/09/2026 |
| Inscrição estadual | 00000003050866 | SRC-006, página 1 | Snapshot estadual consultado em 03/09/2026 |
| NIRE | 11200541730 | SRC-006, página 1 | Snapshot estadual consultado em 03/09/2026 |
| Situação estadual | HABILITADO desde 29/07/2025; contribuinte ATIVO | SRC-006, página 1 | Snapshot estadual; distinto da abertura federal |
| Início da atividade estadual | 14/10/2013 | SRC-006, página 1 | Fato estadual; não conflita com abertura federal |
| Endereço cadastral | Rua dos Farrapos, 5000, São Francisco, Porto Velho/RO, CEP 76813-284 | SRC-005/SRC-006 | Fato cadastral corroborado |
| E-mail comercial | cisneltda@hotmail.com | SRC-003; corroborado por SRC-005/SRC-006 | Fato cadastral + dado pessoal |
| Telefone comercial | (69) 9976-7888 | SRC-003; corroborado por SRC-005/SRC-006 | Fato cadastral + dado pessoal |
| CNAEs | 46.19-2-00 principal + 48 secundários | SRC-005/SRC-006 | Classificação legal; não define escopo ou workflow |
| Regime exibido na consulta estadual | 017-SIMPLES NACIONAL | SRC-006, página 1 | Snapshot cadastral; não autoriza implementar cálculo tributário |
| Situação NF-e exibida | NÃO CREDENCIADO | SRC-006, página 1 | Específico do snapshot estadual; NFS-e não determinada |

Estrutura societária, QSA e organograma: **não fornecidos**. SRC-005/SRC-006 são cópias de consultas cadastrais, não contrato social, certificado digital ou credencial de emissão.

Patrocinador/owner: formalizado em SRC-002 (Abrahim Jabour Junior, Administrador).

## Atividades mencionadas no contexto inicial

As atividades abaixo foram **citadas** no contexto inicial (SRC-000, reforçado por SRC-001 EV-002). Não estão confirmadas como módulos do sistema.

| ID           | Atividade citada                                                                                 | Status no produto                                                          |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| ACT-CAND-001 | Representação comercial                                                                          | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-002 | Prestação de serviços logísticos                                                                 | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-003 | Transporte rodoviário de cargas                                                                  | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-004 | Transporte municipal, intermunicipal, interestadual e internacional                              | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-005 | Transporte coletivo de passageiros por fretamento                                                | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-006 | Locação de automóveis                                                                            | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-007 | Locação de máquinas e equipamentos comerciais                                                    | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-008 | Locação de máquinas e equipamentos industriais                                                   | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-009 | Locação de equipamentos para construção sem operador                                             | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-010 | Gestão de serviços executados com veículos, equipamentos e mão de obra                           | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-011 | Controle de solicitações e Ordens de Serviço                                                     | `UNDECIDED_SCOPE` / candidato                                              |
| ACT-CAND-012 | Possível encadeamento proposta → pedido → PO → OS → execução → medição → faturamento → pagamento | Hipótese de fluxo; **não** confirmado como único, obrigatório ou universal |

## Problemas operacionais candidatos (SRC-001)

Relatados em SRC-001 §4 — ver evidências EV-012–EV-026 em [`../02-source-analysis/as-is-process.md`](../02-source-analysis/as-is-process.md). Ocorrência não confirmada.

## Prioridade candidata

Vertical de **locação** citada como prioridade econômica candidata (EV-080). Não confirma escopo de release — ver scope-register.

## O que este contexto **não** autoriza

- Concluir que todos os módulos entram no primeiro release.
- Concluir que todas as atividades seguem o mesmo fluxo.
- Inventar coexistência ou conexão com ERP (SRC-004 rejeita conexão; CISNE é o sistema centralizado).
- Inventar regras fiscais, contábeis, jurídicas ou operacionais.
- Tratar SRC-000 ou SRC-001 como Documento Mestre.

## Sistemas atuais

| Sistema | Status |
| ------- | ------ |
| ERP externo | `REJECTED` — não haverá conexão (SRC-004 / BR-042) |
| Rastreamento | `NOT_PROVIDED` / `OPEN` (DDP-014 residual) |
| Fiscal (SEFAZ/prefeitura) | Cadastro estadual em SRC-006 (`NÃO CREDENCIADO`); SRC-007 / BR-043..BR-045 bloqueiam transmissão, `AUTHORIZED` e DANFE oficial sem credenciamento/protocolo; gateway, credenciais e tributação substantiva `NOT_PROVIDED` / DDP-023 residual `OPEN` |
| RH / frotas externas | `NOT_PROVIDED` |

O SISTEMA CISNE RONDÔNIA é o sistema empresarial centralizado (SRC-004). Módulos nativos não dependem de ERP.

## Glossário

Não estabelecido. Termos como OS, PO, medição e fatura permanecem **não definidos** formalmente até o Prompt 04 (ou fonte que os defina).
