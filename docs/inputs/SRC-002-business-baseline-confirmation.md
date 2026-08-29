# SRC-002 — Confirmação de baseline empresarial

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-002 |
| Title | Questionário de confirmação empresarial — baseline para implementação |
| Type | QUESTIONNAIRE — confirmação formal pelo responsável empresarial |
| Origin | Criado no Prompt 28; análise documental no Prompt 29-A |
| Location | `docs/inputs/SRC-002-business-baseline-confirmation.md` |
| Date received | 2026-08-29 |
| Signed by | **Abrahim Jabour Junior** (Administrador) |
| Approval date | 2026-08-29 |
| Status | `APPROVED` |
| Classification | `BUSINESS_CONFIRMATION_APPROVED` |
| May prove operational business rules? | **Sim** — regras Cliente `CONFIRMED` via SRC-002 com aprovação formal registrada |
| Supersedes / complements | SRC-001 (`PENDING_BUSINESS_VALIDATION`) — **não** substitui documentos primários |

```gate
status: LIBERADO
clients_module_ready: true
signed_by: Abrahim Jabour Junior
signed_role: Administrador
signed_date: 2026-08-29
mandatory_blockers_count: 0
analysis_prompt: 29-A-corrective
analysis_date: 2026-08-29
approval_date: 2026-08-29
confirmed_business_rules: 16
```

### Histórico de fases do gate (provenance)

| Fase | Data | Status | Nota |
| ---- | ---- | ------ | ---- |
| AWAITING_RESPONSE | 2026-08-29 | Questionário vazio | Prompt 28 |
| ANALYZED_BLOCKED | 2026-08-29 | 14 bloqueadores | Prompt 29-A inicial |
| BLOCKED_BY_SIGNATURE_ONLY | 2026-08-29 | 1 bloqueador (assinatura) | Prompt 29-A corretivo — decisões Q01–Q15 registradas |
| APPROVED | 2026-08-29 | `LIBERADO` | Aprovação formal Abrahim Jabour Junior (Administrador) |

---

## Resolução controlada (Prompt 29-A corretivo)

**STATUS SRC-002:** `LIBERADO`  
**APPROVAL STATUS:** Aprovado formalmente em 2026-08-29 por Abrahim Jabour Junior (Administrador)  
**Módulo Clientes liberado para Prompt 29:** **Sim** (`gate:src-002` → `PASS`)

### CONFIRMED BUSINESS RULES

Fonte das decisões: instrução empresarial autorizada do Prompt 29-A corretivo (2026-08-29).  
Registro: `business-rules-register.md` — **BR-025, BR-026..BR-040** (`CONFIRMED`); **BR-041** (`CONDITIONAL`).

| ID | Regra (resumo) |
| -- | -------------- |
| BR-026 | Módulo Clientes PJ no Release 1 (cadastro mínimo operacional; não CRM/ERP) |
| BR-027 | CNPJ obrigatório para Cliente PJ |
| BR-028 | Cliente PF fora do Release 1 (`NOT_IN_RELEASE_1`) |
| BR-029 | CNPJ único globalmente (normalização canônica antes de comparar/persistir) |
| BR-030 | Sistema CISNE é autoridade da identidade operacional interna do Cliente |
| BR-031 | Chave externa/ERP (`externalErpId` ou equivalente) nunca é PK interna |
| BR-032 | Cliente é contraparte comercial; CISNE ≠ Client; unidade organizacional ≠ Client |
| BR-033 | Cliente com uso empresarial não sofre DELETE físico destrutivo |
| BR-034 | Perfil de Controle com capabilities `CLIENT_CREATE`/`CLIENT_EDIT`/`CLIENT_DEACTIVATE` administra Cliente |
| BR-035 | Empregado não recebe administração de Cliente automaticamente |
| BR-036 | Desativação lógica preserva histórico (OS, solicitações, documentos, auditoria) |
| BR-037 | OS liberada exige `clientId` válido, Cliente existente e `ACTIVE` |
| BR-038 | Origem da demanda pode ser externa (cliente, WhatsApp, PO, etc.) |
| BR-039 | Registro transacional da Solicitação no Release 1 é por usuário interno autorizado |
| BR-025 | Solicitar não equivale a autorizar (promovida de CANDIDATE) |
| BR-040 | Solicitante externo não cria, libera, aprova OS nem altera custo/preço/faturamento |
| BR-041 | Regras específicas Cliente/Contrato/PO podem afetar operação/faturamento (`CONDITIONAL`) |

### CONDITIONAL BUSINESS RULES

| Regra | Condição |
| ----- | -------- |
| BR-041 | Aplica quando módulos Contrato/PO estiverem implementados |
| SoT híbrido ERP | ERP/fiscal permanece autoridade de domínios externos quando integração existir; sem integração fictícia |
| Contatos com PII | Minimização e autorização backend (DDP-039 legal ainda OPEN) |

### OUT OF RELEASE 1

| Item | Status |
| ---- | ------ |
| Cliente PF (CPF, RG) | `NOT_IN_RELEASE_1` |
| CRM (funil, campanhas, lead scoring) | `NOT_IN_RELEASE_1` |
| Grupo econômico complexo | `NOT_IN_RELEASE_1` (compatibilidade arquitetural preservada) |
| Enum cliente interno/externo | `REJECTED` para Release 1 |

### RESOLVED BUSINESS DECISIONS

| Ref | Decisão |
| --- | ------- |
| Q01 | Clientes no Release 1 — SIM (cadastro mínimo interno) |
| Q02 | Apenas PJ; CNPJ obrigatório |
| Q03 | CNPJ único global; normalizar para dígitos na comparação |
| Q04 | SoT híbrido: CISNE master operacional; ERP opcional futuro via `externalErpId` |
| Q05 | Sem classificação interno/externo no Client; CISNE ≠ Client |
| Q06 | Obrigatórios: razão social, CNPJ, ≥1 contato operacional |
| Q07 | PF fora do Release 1 |
| Q08 | Desativação lógica; sem DELETE destrutivo; RESTRICT em histórico |
| Q09 | `CLIENT_CREATE` — Perfil de Controle autorizado |
| Q10 | `CLIENT_EDIT` — Perfil de Controle autorizado |
| Q11 | `CLIENT_DEACTIVATE` — Perfil de Controle; motivo/auditoria quando padrão exigir |
| Q12 | OWNER/CONTROL visão global por capability; empregado limitado ao contexto operacional |
| Q13 | Um CNPJ = uma entidade jurídica; sem fusão de CNPJs distintos |
| Q14 | Múltiplos contatos e endereços com finalidade (operational/commercial/billing) |
| Q15 | Intake pode não ter Cliente; **liberação de OS** exige Cliente ACTIVE |
| DDP-028 | Resolvido — ver §3 e `domain-decisions-pending.md` |
| DDP-020 | Resolvido **somente escopo CLIENTE** — ver §19 |
| DDP-041 | Campos mínimos PJ — ver §1 |

### UNRESOLVED BUSINESS DECISIONS (não bloqueiam Clientes após decisões acima)

| ID | Tema | Nota |
| -- | ---- | ---- |
| DDP-020 | SoT de OS, PO, medição, fatura, pagamento | Fora do escopo deste prompt |
| DDP-015 | Papéis empresariais completos | Parcialmente coberto por capabilities Cliente |
| DDP-039 | Validação legal LGPD | PENDING_LEGAL_VALIDATION |
| DDP-001..019, 021+ | Demais domínios | Inalterados |

### CONFLICTS

| ID | Status | Correção |
| -- | ------ | -------- |
| MAP-001 | **FIXED** | §1 não referencia mais DDP-028; DDP-041 criado para campos mínimos PJ |
| MAP-002 | **FIXED** | `28-business-readiness-gate.md` atualizado — DDP-028 = solicitante/origem |

### IMPLEMENTATION BLOCKERS (ativos)

Nenhum bloqueador ativo.

**Histórico:** 14 bloqueadores resolvidos no Prompt 29-A corretivo; bloqueador de assinatura resolvido em 2026-08-29.

```text
mandatory_blockers_resolved: 15
mandatory_blockers_active: 0
```

### EVIDENCE

| Tipo | Referência |
| ---- | ---------- |
| BUSINESS DECISION | Prompt 29-A corretivo — Q01–Q15 |
| BUSINESS FACT | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA — CNPJ 11.897.171/0001-81 (operadora; **não** cadastrar como Client) |
| DOCUMENTARY EVIDENCE | Código externo 152888 em documentação comercial — **não** usar como PK (`external_supplier_code` candidato) |
| TECHNICAL DECISION | Identity + Capability + Scope + backend authorization (sem hardcode de nomes) |
| Prior analysis | Prompt 29-A inicial; MAP-001/002 |

### Fronteira organizacional (não implementar Organization neste prompt)

```text
ORGANIZATION → CISNE RONDÔNIA (operadora)
CLIENT       → contraparte comercial atendida
USER/EMPLOYEE → pessoa que atua na organização
```

Proprietários/controladores: Abrahim Jabour Junior (aprovador SRC-002); Monica Perez Badra Jabour.

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

**Decisão registrada (Q02, Q05–Q07, Q06):** Release 1 = **PJ apenas**. PF = `NOT_IN_RELEASE_1`. Sem enum interno/externo.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Campos obrigatórios PJ | `CONFIRMED` | Razão social + CNPJ + ≥1 contato operacional utilizável (Q06) |
| Campos obrigatórios PF | `NOT_IN_RELEASE_1` | Q07 — fora do escopo Release 1 |
| Cliente interno vs externo | `REJECTED` | Q05 — CISNE/unidade organizacional ≠ Client; sem enum Release 1 |
| CNPJ/CPF único no sistema | `CONFIRMED` | CNPJ único global; normalização canônica (dígitos) antes de comparar (Q03) |
| Inativação vs exclusão | `CONFIRMED` | Desativação lógica; sem DELETE destrutivo; histórico preservado (Q08) |

**DDP relacionados:** **DDP-041** (campos mínimos PJ) · DDP-020 (SoT — escopo CLIENTE resolvido) · **Módulo:** Clientes

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

**Decisão registrada (DDP-028 resolvido):** Origem da demanda pode ser externa; registro transacional no CISNE é por usuário interno autorizado no Release 1. Separar `REQUEST_ORIGIN`, `SYSTEM_ACTOR`, `AUTHORIZED_APPROVER`.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Perfis autorizados a registrar solicitação | `CONFIRMED` | Usuário interno autorizado (Release 1) |
| Solicitante externo (cliente) | `CONFIRMED` | Pode ser origem da demanda; não registra transação diretamente |
| Solicitante interno | `CONFIRMED` | Registra solicitação no sistema |
| WhatsApp como canal oficial | `UNKNOWN` | DDP-021 permanece OPEN |
| Solicitar ≠ autorizar OS | `CONFIRMED` | BR-025, BR-040; solicitante externo sem autoridade de OS |

**DDP relacionados:** DDP-002, DDP-021, **DDP-028 (ANSWERED)** · **Módulo:** Solicitações

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

**Decisão registrada (Q09–Q12):** Capabilities `CLIENT_CREATE`, `CLIENT_EDIT`, `CLIENT_DEACTIVATE` para Perfil de Controle. Sem hardcode de nomes. OWNER/CONTROL visão global por capability; empregado limitado ao contexto operacional.

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Lista de papéis / funções | `CONDITIONAL` | Perfil de Controle + empregado; DDP-015 completo ainda OPEN |
| Maker-checker obrigatório (ex.: liberar OS) | `UNKNOWN` | DDP-022 OPEN — fora escopo Cliente |
| Quem atribui permissões | `UNKNOWN` | ADP-010 OPEN |
| Isolamento por cliente / unidade | `CONFIRMED` | Q12 — CONTROL global; empregado por contexto; ADP-014 parcial |
| Responsável vê preço operacional | `UNKNOWN` | ADP-006 OPEN |
| Quem cadastra Cliente | `CONFIRMED` | `CLIENT_CREATE` — Perfil de Controle (Q09) |
| Quem edita Cliente | `CONFIRMED` | `CLIENT_EDIT` — Perfil de Controle (Q10) |
| Quem desativa Cliente | `CONFIRMED` | `CLIENT_DEACTIVATE` — Perfil de Controle (Q11) |
| Quem vê dados sensíveis de Cliente | `CONDITIONAL` | Autorização backend; DDP-039 legal OPEN |

**DDP relacionados:** DDP-015 (parcial), ADP-001..014 · **Módulo:** Autorização de negócio

---

## 19. Source of Truth

**Pergunta:** Para cada conceito crítico, qual sistema é autoritativo?

**Análise Prompt 29-A (DDP-020):** DBND-SOT-001 lista "Cliente cadastro → Interno ou ERP" sem decisão. Impacto: define se CISNE é master, réplica ou híbrido.

**Decisão registrada (Q04 — DDP-020 escopo CLIENTE):** Modelo híbrido desacoplado. CISNE = master operacional do Cliente. ERP/fiscal = autoridade de domínios externos quando integração existir. `externalErpId` opcional; nunca PK.

| Conceito | Resposta | Sistema autoritativo |
| -------- | -------- | -------------------- |
| Cadastro de cliente | `CONFIRMED` | **CISNE** (identidade operacional interna); ERP opcional como réplica futura |
| OS | `UNKNOWN` | DDP-020 — fora escopo desta resolução |
| Saldo de PO | `UNKNOWN` | DDP-009, DDP-020 OPEN |
| Medição | `UNKNOWN` | DDP-010 OPEN |
| Fatura / NF | `UNKNOWN` | DDP-023 OPEN |
| Pagamento | `UNKNOWN` | DDP-012 OPEN |
| Documentos binários | `UNKNOWN` | DDP-013 OPEN |
| Mensagens WhatsApp | `UNKNOWN` | DDP-021 OPEN |

**DDP relacionados:** DDP-014, **DDP-020 (ANSWERED_FOR_CLIENT_SCOPE)**, DDP-021

---

## 20. Primeiro release

**Pergunta:** O que entra no primeiro release operacional? O que fica explicitamente fora?

**Decisão registrada (Q01):** Módulo Clientes **incluído** — cadastro PJ mínimo operacional (não CRM/ERP).

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Verticais incluídas | `UNKNOWN` | Locação candidata (BR-020); DDP-026 parcial |
| Módulos incluídos — **Clientes** | `CONFIRMED` | Q01 — cadastro PJ mínimo |
| Módulos incluídos — demais | `UNKNOWN` | Solicitações · OS · etc. |
| Módulos explicitamente fora | `CONFIRMED` | Cliente PF; CRM; ERP completo |
| Integrações no primeiro release | `UNKNOWN` | DDP-014 OPEN; sem integração ERP fictícia |
| PWA / mobile obrigatório | `UNKNOWN` | DDP-025 OPEN |
| Data alvo (se houver) | `UNKNOWN` | |

**DDP relacionados:** DDP-026 (parcial — Clientes confirmado), DDP-025

---

## Assinatura

| Campo | Valor |
| ----- | ----- |
| Nome completo | **Abrahim Jabour Junior** |
| Cargo / função autorizada | **Administrador** |
| Data | **2026-08-29** |
| Assinatura (física ou eletrônica) | Aprovação formal registrada via instrução autorizada do responsável (Prompt 29-A — aprovação humana) |
| Declaração | Aprovo formalmente o baseline empresarial SRC-002, incluindo decisões Q01–Q15, DDP-020 no escopo CLIENTE, DDP-028 e regras BR-025 a BR-040 registradas no repositório. |
| Observações gerais | Decisões previamente registradas não foram alteradas neste processo de aprovação. BR-041 permanece `CONDITIONAL`. |

---

## Registro pós-preenchimento (equipe — não preencher antes da resposta)

| Campo | Valor |
| ----- | ----- |
| Registrado em `source-registry.md` | 2026-08-29 — aprovado por Abrahim Jabour Junior |
| Aprovado por | Abrahim Jabour Junior (Administrador) — 2026-08-29 |
| Regras promovidas a `CONFIRMED` | **16** (BR-025, BR-026..BR-040) + BR-041 CONDITIONAL |
| DDPs respondidos | DDP-028 ANSWERED; DDP-020 CLIENT_SCOPE; DDP-041 ANSWERED |
| Conflitos abertos (`SC-*`) | 0 empresariais; MAP-001/002 FIXED |
| Gate automatizado | `pnpm gate:src-002` → **PASS** |
