# SRC-002 — Confirmação de baseline empresarial

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-002 |
| Title | Questionário de confirmação empresarial — baseline para implementação |
| Type | QUESTIONNAIRE — confirmação formal pelo responsável empresarial |
| Origin | Criado no Prompt 28; análise documental no Prompt 29-A |
| Location | `docs/inputs/SRC-002-business-baseline-confirmation.md` |
| Date received | _pendente — aguarda assinatura_ |
| Signed by | **PENDING_HUMAN_CONFIRMATION** |
| Status | `ANALYZED_BLOCKED` |
| Classification | `BUSINESS_CONFIRMATION_REQUIRED` |
| May prove operational business rules? | **Não** — 0 regras `CONFIRMED`; assinatura pendente |
| Supersedes / complements | SRC-001 (`PENDING_BUSINESS_VALIDATION`) — **não** substitui documentos primários |

```gate
status: BLOQUEADO
clients_module_ready: false
signed_by: PENDING_HUMAN_CONFIRMATION
mandatory_blockers_count: 14
analysis_prompt: 29-A
analysis_date: 2026-08-29
confirmed_business_rules: 0
```

---

## Resolução controlada (Prompt 29-A)

**STATUS DO SRC-002:** `BLOQUEADO`  
**Módulo Clientes liberado para Prompt 29:** **NÃO**

### CONFIRMED BUSINESS RULES

Nenhuma regra empresarial de Clientes/Party está `CONFIRMED` em `business-rules-register.md` (total confirmado: **0**).  
SRC-001 declara explicitamente que **não** pode confirmar regras definitivas isoladamente (§2, §23).

### CONDITIONAL BUSINESS RULES

| Regra | Evidência | Condição | Impacto se ignorada |
| ----- | --------- | -------- | ------------------- |
| Não presumir cadastro/CNPJ/CPF/hierarquia de Cliente nesta fase | TERM-004 (`Significado excluído`) | Válido até decisão formal de cadastro | Modelagem prematura; violação de governança |
| Cliente citado como campo/contexto de OS, não como entidade confirmada | DEM-001; EV-047 | Válido até AGG-012 confirmado | Tabela `pty.party` sem baseline |
| Party/intake = PII RESTRICTED quando existir | SEC-AST-010 | Válido quando cadastro for autorizado | LGPD/privacidade (DDP-039 OPEN) |
| SoT de Cliente: interno **ou** ERP — decisão pendente | DBND-SOT-001; DDP-020 | Válido até escolha explícita | Réplica vs master; integração |

### UNRESOLVED BUSINESS DECISIONS (bloqueiam Clientes)

| ID | Pergunta | Status | Evidência |
| -- | -------- | ------ | --------- |
| DDP-020 | Source of Truth — cadastro de cliente | `REQUIRES_BUSINESS_DECISION` | DBND-SOT-001: "Interno ou ERP"; EV-077 |
| DDP-028 | Quem pode solicitar serviço (interno/externo/perfis) | `UNKNOWN` | EV-021, EV-029; SRC-001 §5 |
| DDP-015 | Permissões / papéis / SoD | `UNKNOWN` | SRC-001 §20; ADP-001..014 OPEN |
| DDP-026 | Escopo do primeiro release (Clientes incluído?) | `UNKNOWN` | SRC-001 §21; BR-020 CANDIDATE |
| DDP-039 | Classificação de dados pessoais (party) | `UNKNOWN` | SEC-AST-010; NFR-010 |
| — | **Lacuna:** campos obrigatórios PJ/PF/CNPJ/CPF | `REQUIRES_BUSINESS_DECISION` | Nenhum DDP dedicado; TERM-004 exclui definição |
| — | Quem cadastra/edita/desativa Cliente | `REQUIRES_BUSINESS_DECISION` | ADP-010 OPEN; sem FR de cadastro confirmado |
| — | Cliente interno vs externo | `UNKNOWN` | EV-021; SRC-001 §5 |
| — | Contatos / endereços / responsáveis | `UNKNOWN` | Não descritos em fonte validada |
| — | Relação Cliente→Proposta/Contrato/PO/OS | `UNKNOWN` | BR-013 CANDIDATE (não presumir cardinalidades) |

### CONFLICTS

| ID | Descrição | Documentos |
| -- | --------- | ---------- |
| MAP-001 | SRC-002 §1 rotula **DDP-028** como "dados mínimos de cliente", mas `domain-decisions-pending.md` define **DDP-028** como "Quem pode solicitar serviço" | SRC-002 §1 vs DDP-REG-001 |
| MAP-002 | `28-business-readiness-gate.md` associa DDP-028 simultaneamente a "quem solicita" e "dados de cliente" | 28-gate vs DDP-REG-001 |

**Nota:** MAP-001/002 são conflitos de **mapeamento documental**, não conflito empresarial entre fontes primárias (SC-REG: 0 conflitos).

### IMPLEMENTATION BLOCKERS (módulo Clientes — Prompt 29)

1. Assinatura humana pendente (`PENDING_HUMAN_CONFIRMATION`)
2. Zero regras `CONFIRMED` aplicáveis a cadastro de Cliente
3. Campos obrigatórios PJ/PF: `UNKNOWN`
4. CNPJ/CPF obrigatório e unicidade: `UNKNOWN` (TERM-004 proíbe presumir)
5. DDP-020 não respondido (SoT interno vs ERP)
6. DDP-015 / ADP-014 não respondidos (autorização e isolamento CLIENT)
7. DDP-026 não respondido (Clientes no primeiro release?)
8. Operações CRUD não confirmadas (criar/listar/alterar/ativar/desativar)
9. Relacionamentos Cliente→comercial/OS/documentos não confirmados
10. Contatos/endereços/responsáveis: sem baseline
11. Classificação PII (DDP-039): OPEN
12. AGG-CAND-012 / `pty.party`: status CANDIDATE, não FINAL
13. Nenhum FR `CONFIRMED` de cadastro de Cliente (FR-001..042 são candidatos)
14. Fontes primárias (ERP, contrato, Documento Mestre): `NOT_PROVIDED`

### EVIDENCE MATRIX (Clientes / Party — amostra crítica)

| Regra / decisão | Evidência | Status | Conflito | Decisão necessária |
| --------------- | --------- | ------ | -------- | ------------------ |
| Entidade Cliente/Party existe como cadastro | EV-047 (campo OS apenas); DEM-001 `?` | UNKNOWN | — | Confirmar se AGG-012 entra no release |
| CNPJ/CPF no cadastro | TERM-004 exclui | REJECTED (presumir) | — | Q02 |
| Exclusão física de Cliente | Prompt 29 (futuro): proibida | CONDITIONAL (eng.) | — | Confirmar desativação lógica (Q08) |
| Desativação lógica | identity schema usa `disabled` (técnico) | UNKNOWN (negócio) | — | Q08 |
| Autorização deny-by-default | Implementação técnica Prompt 22–27 | CONFIRMED (técnico) | — | Papéis de negócio para Cliente: DDP-015 |
| Escopo CLIENT em authz | `authorization.ts` enum | CONFIRMED (técnico) | — | Regras de quem acessa qual client: UNKNOWN |
| Unicidade identificador | — | UNKNOWN | — | Q02, Q03 |
| Optimistic concurrency | Padrão identity (`version`) | CONDITIONAL (eng.) | — | Aplicar a Party quando autorizado |
| Auditoria de alterações | SECURITY_AUDIT técnico existe | CONDITIONAL (eng.) | — | Eventos de domínio Cliente: UNKNOWN |
| Integridade referencial OS→Party | FK candidata em `foreign-key-strategy.md` | UNKNOWN | — | Cardinalidade e obrigatoriedade |

---

## Instruções para o responsável empresarial

1. Preencha cada seção com a resposta autorizada pela direção.
2. Para cada item, marque **uma** opção: `CONFIRMED` · `REJECTED` · `CONDITIONAL` · `UNKNOWN`.
3. Em `CONDITIONAL`, descreva a condição de forma verificável.
4. Em `CONFIRMED` ou `CONDITIONAL`, cite evidência quando existir (documento, política interna, cláusula).
5. Não deixe campos em branco — use `UNKNOWN` se a decisão ainda não existir.
6. Ao concluir, preencha **Assinatura** no final e notifique a equipe de engenharia para registro em `source-registry.md`.

### Legenda de respostas

| Valor | Significado |
| ----- | ----------- |
| `CONFIRMED` | Decisão tomada e autorizada; pode fundamentar requisito `CONFIRMED` |
| `REJECTED` | Opção descartada explicitamente |
| `CONDITIONAL` | Válido apenas nas condições descritas |
| `UNKNOWN` | Decisão ainda não tomada — **bloqueia implementação** do tema |

---

## 1. Dados mínimos de cliente

**Pergunta:** Quais campos são obrigatórios no cadastro de cliente (pessoa jurídica e/ou física)? Existe distinção cliente interno vs externo?

**Análise Prompt 29-A:** Nenhum campo cadastral confirmado. TERM-004 exclui explicitamente definição de cadastro/CNPJ/hierarquia. Não existe DDP dedicado a campos PJ/PF — lacuna registrada.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Campos obrigatórios PJ | `UNKNOWN` | Nenhuma fonte primária; AGG-CAND-012 CANDIDATE sem atributos confirmados |
| Campos obrigatórios PF | `UNKNOWN` | Idem |
| Cliente interno vs externo | `UNKNOWN` | EV-021, SRC-001 §5 — pendente confirmar |
| CNPJ/CPF único no sistema | `UNKNOWN` | TERM-004: não presumir CNPJ; unicidade não decidida |
| Inativação vs exclusão | `UNKNOWN` | Negócio não confirmado; precedente técnico identity `disabled` (não vinculante) |

**DDP relacionados:** _lacuna documental — ver MAP-001_; DDP-020 (SoT) · **Módulo:** Clientes

---

## 2. Tipos de serviço

**Pergunta:** Quais tipos de serviço existem? São taxonomia fixa ou configurável? Locação é prioridade do primeiro release?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Lista de tipos de serviço | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Taxonomia fixa ou configurável | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Locação no primeiro release | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Transporte no primeiro release | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Representação comercial no primeiro release | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Outras verticais citadas em SRC-001 | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-001, DDP-026 · **Módulos:** OS, Solicitações, Recursos

---

## 3. Quem solicita

**Pergunta:** Quem pode registrar uma solicitação de serviço? Solicitante interno, externo, ambos?

**Análise Prompt 29-A (DDP-028):** Pergunta aberta em SRC-001 §5. EV-021 = OPEN_QUESTION. TERM-005 ACCEPTED_FOR_DOCUMENTATION descreve solicitante, não perfis autorizados.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Perfis autorizados a solicitar | `UNKNOWN` | DDP-028 OPEN; EV-021 |
| Solicitante externo (cliente) | `UNKNOWN` | EV-021, EV-029 |
| Solicitante interno | `UNKNOWN` | EV-021 |
| WhatsApp como canal oficial | `UNKNOWN` | BR-005 PENDING_VALIDATION; DDP-021 OPEN |
| Solicitar ≠ autorizar OS | `CONDITIONAL` | BR-025 CANDIDATE (EV-041); requer promoção a CONFIRMED |

**DDP relacionados:** DDP-002, DDP-021, **DDP-028** · **Módulo:** Solicitações

---

## 4. Quem cria e libera OS

**Pergunta:** Quem pode criar rascunho de OS? Quem pode liberar? Mesma pessoa pode fazer ambos?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Quem cria rascunho de OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem libera OS para execução | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Segregação criar vs liberar (maker-checker) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Critérios de prontidão para liberação | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Toda solicitação gera OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-003, DDP-022, DDP-029 · **Módulo:** OS

---

## 5. Estados autorizados

**Pergunta:** Quais estados oficiais existem para solicitação e OS? A máquina candidata (RASCUNHO → PREPARADA → LIBERADA → EM_EXECUCAO → CONCLUIDA / CANCELADA) está correta?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Estados de solicitação | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Estados de OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Separação rascunho vs liberada | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| ASSIGNED / VIEWED / DELIVERED como estado | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| OS concluída pode receber novos itens | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-032, DDP-035 · **Módulos:** OS, Execução

---

## 6. Cancelamento e reabertura

**Pergunta:** Quem pode cancelar solicitação, OS, PO, medição ou fatura? Reabertura é permitida?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Quem cancela solicitação | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem cancela OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Efeitos de cancelamento (alocação, financeiro) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Reabertura de OS cancelada | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Reabertura de medição/fatura | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-004, DDP-005 · **Módulos:** OS, Medição, Faturamento

---

## 7. Mão de obra

**Pergunta:** Como pessoas são cadastradas, alocadas e apuradas? Existe terceiro, diária, hora?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Cadastro de executor | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Tipo de mão de obra vs pessoa | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Unidade de cobrança (hora, diária, fixo) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Substituição de executor | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Terceiros / folha externa | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-006, DDP-030 · **Módulo:** Recursos

---

## 8. Equipamentos

**Pergunta:** Quais equipamentos entram no sistema? Alocação exclusiva? Locação própria vs terceiro?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Escopo do cadastro patrimonial | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Alocação exclusiva | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Equipamento próprio vs terceiro | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Manutenção no escopo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Campos obrigatórios por tipo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-007, DDP-017, DDP-034 · **Módulo:** Recursos

---

## 9. Veículos

**Pergunta:** Controle de frota própria, agregados, rastreador, documentos do veículo?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Frota própria no escopo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Agregados / terceiros | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Integração rastreador | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Campos obrigatórios (placa, chassi, RENAVAM, km, horímetro) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Tratamento de chassi (máscara vs completo) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-008, DDP-027, DDP-034 · **Módulo:** Recursos

---

## 10. Custo e preço

**Pergunta:** Quem vê custo interno e margem? Quem altera preço? Modelo de preço global, por item ou híbrido?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Separação custo interno vs preço comercial | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem visualiza custo/margem | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem altera preço | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Modelo de preço (global / item / híbrido) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Descontos e adicionais | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-030, DDP-031 · **Módulos:** OS, Faturamento

---

## 11. Itens adicionais

**Pergunta:** Itens adicionais podem ser incluídos após liberação? Quem autoriza? Impacto em medição e faturamento?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Itens adicionais pós-liberação | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem autoriza adicional | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Fases de quantidade (planejada, alocada, utilizada, medida, faturada, paga) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Origem identificável para cobrança | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-011, BR-009, BR-010 · **Módulos:** OS, Execução, Medição

---

## 12. PO e cardinalidades

**Pergunta:** PO é obrigatório? Relação PO ↔ OS ↔ medição ↔ nota?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| PO obrigatório para execução | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| 1 PO : N OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| N PO : 1 OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Estouro de saldo de PO | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Proposta → PO → OS (obrigatoriedade) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-009, BR-013 · **Módulo:** PO

---

## 13. Medição

**Pergunta:** O que é medido, quem mede, com qual evidência, quando é recusada?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Objeto da medição | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem registra medição | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem aprova / recusa medição | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Evidência obrigatória | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Segregação preparador vs aprovador | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-010, INV-008, INV-017 · **Módulo:** Medição

---

## 14. Faturamento

**Pergunta:** O que gera direito a faturar? Relação com medição, contrato e documento fiscal?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Gatilho de faturamento | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Faturamento depende de medição aprovada | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Sistema emite NF-e oficial | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Registro de documento fiscal externo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Recibo / fatura não fiscal apenas | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-011, DDP-023, BR-019 · **Módulo:** Faturamento

---

## 15. Nota

**Pergunta:** Nota fiscal, nota de débito, recibo — quais documentos de saída existem?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Tipos de nota no escopo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Emissor (sistema vs ERP externo) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Cancelamento de nota | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Alteração pós-emissão | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-011, DDP-023 · **Módulo:** Faturamento

---

## 16. Pagamento

**Pergunta:** Como se registra pagamento? Conciliação? Falha do meio de pagamento?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Registro de pagamento no sistema | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Conciliação bancária | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Pagamento parcial | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Estorno / chargeback | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-012 · **Módulo:** Faturamento / Pagamento

---

## 17. Documentos

**Pergunta:** Quais documentos lógicos existem? Obrigatoriedade, versões, validade, emissor?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Tipos de documento críticos | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Versões preservadas (não apagar silenciosamente) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem aprova substituição | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Validade / vencimento documental | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Upload vs integração externa | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-013, DDP-033 · **Módulo:** Documentos

---

## 18. Permissões

**Pergunta:** Quais funções existem? Segregação de funções (SoD)? Incompatibilidades?

**Análise Prompt 29-A (impacto Clientes):** Nenhum papel empresarial confirmado. ADP-001..014 OPEN. Escopo CLIENT existe apenas como enum técnico de autorização.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Lista de papéis / funções | `UNKNOWN` | DDP-015 OPEN; ADP-010 OPEN |
| Maker-checker obrigatório (ex.: liberar OS) | `UNKNOWN` | DDP-022 OPEN; ADP-013 OPEN |
| Quem atribui permissões | `UNKNOWN` | ADP-010 OPEN |
| Isolamento por cliente / unidade | `UNKNOWN` | ADP-014 OPEN (CLIENT / UNIT / Híbrido) |
| Responsável vê preço operacional | `UNKNOWN` | ADP-006 OPEN |
| Quem cadastra Cliente | `UNKNOWN` | Sem FR confirmado; bloqueia Prompt 29 |
| Quem edita Cliente | `UNKNOWN` | Idem |
| Quem desativa Cliente | `UNKNOWN` | Idem |
| Quem vê dados sensíveis de Cliente | `UNKNOWN` | DDP-039 OPEN; SEC-AST-010 |

**DDP relacionados:** DDP-015, ADP-001..014 · **Módulo:** Autorização de negócio

---

## 19. Source of Truth

**Pergunta:** Para cada conceito crítico, qual sistema é autoritativo?

**Análise Prompt 29-A (DDP-020):** DBND-SOT-001 lista "Cliente cadastro → Interno ou ERP" sem decisão. Impacto: define se CISNE é master, réplica ou híbrido.

| Conceito | Resposta | Sistema autoritativo |
| -------- | -------- | -------------------- |
| Cadastro de cliente | `UNKNOWN` | Candidatos: Sistema CISNE (BC-002) **ou** ERP externo (DDP-020) |
| OS | `UNKNOWN` | DBND-SOT-001 candidato: Sistema CISNE — não bloqueia Clientes diretamente |
| Saldo de PO | `UNKNOWN` | DDP-009 OPEN |
| Medição | `UNKNOWN` | DDP-010 OPEN |
| Fatura / NF | `UNKNOWN` | DDP-023 OPEN |
| Pagamento | `UNKNOWN` | DDP-012 OPEN |
| Documentos binários | `UNKNOWN` | DDP-013 OPEN |
| Mensagens WhatsApp | `UNKNOWN` | DDP-021 OPEN |

**DDP relacionados:** DDP-014, **DDP-020**, DDP-021 · **Módulos:** Integração, todos

---

## 20. Primeiro release

**Pergunta:** O que entra no primeiro release operacional? O que fica explicitamente fora?

**Análise Prompt 29-A:** DDP-026 OPEN. Locação = prioridade candidata (BR-020 CANDIDATE), não confirmada. Módulo Clientes não liberado.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Verticais incluídas | `UNKNOWN` | BR-020 CANDIDATE; SRC-001 §21 |
| Módulos incluídos — **Clientes** | `UNKNOWN` | Bloqueia Prompt 29 |
| Módulos incluídos — demais | `UNKNOWN` | Solicitações · OS · etc. |
| Módulos explicitamente fora | `UNKNOWN` | |
| Integrações no primeiro release | `UNKNOWN` | DDP-014 OPEN |
| PWA / mobile obrigatório | `UNKNOWN` | DDP-025 OPEN |
| Data alvo (se houver) | `UNKNOWN` | |

**DDP relacionados:** DDP-026, DDP-025 · **Escopo de produto**

---

## Assinatura

| Campo | Valor |
| ----- | ----- |
| Nome completo | **PENDING_HUMAN_CONFIRMATION** |
| Cargo / função autorizada | **PENDING_HUMAN_CONFIRMATION** |
| Data | **PENDING_HUMAN_CONFIRMATION** |
| Assinatura (física ou eletrônica) | **PENDING_HUMAN_CONFIRMATION** |
| Observações gerais | Análise documental Prompt 29-A concluída; aguarda respostas autorizadas do patrocinador |

---

## Registro pós-preenchimento (equipe — não preencher antes da resposta)

| Campo | Valor |
| ----- | ----- |
| Registrado em `source-registry.md` | pendente — aguarda assinatura |
| Regras promovidas a `CONFIRMED` | **0** (Prompt 29-A) |
| DDPs respondidos | **0** (DDP-020, DDP-028 permanecem OPEN) |
| Conflitos abertos (`SC-*`) | 0 empresariais; MAP-001/002 documentais |
| Gate automatizado | `pnpm gate:src-002` → **FAIL** (esperado enquanto BLOQUEADO) |
