# SRC-002 — Confirmação de baseline empresarial

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-002 |
| Title | Questionário de confirmação empresarial — baseline para implementação |
| Type | QUESTIONNAIRE — confirmação formal pelo responsável empresarial |
| Origin | A preencher pelo patrocinador / direção autorizada |
| Location | `docs/inputs/SRC-002-business-baseline-confirmation.md` |
| Date received | _pendente_ |
| Signed by | _pendente — nome, cargo, data_ |
| Status | `AWAITING_RESPONSE` |
| Classification | `BUSINESS_CONFIRMATION_REQUIRED` |
| May prove operational business rules? | **Somente após** respostas `CONFIRMED` ou `CONDITIONAL` com condições explícitas |
| Supersedes / complements | SRC-001 (`PENDING_BUSINESS_VALIDATION`) — **não** substitui documentos primários (contrato, PO, NF, ERP) |

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

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Campos obrigatórios PJ | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Campos obrigatórios PF | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Cliente interno vs externo | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| CNPJ/CPF único no sistema | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Inativação vs exclusão | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-028 · **Módulo:** Clientes

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

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Perfis autorizados a solicitar | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Solicitante externo (cliente) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Solicitante interno | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| WhatsApp como canal oficial | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Solicitar ≠ autorizar OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-002, DDP-021, DDP-028 · **Módulo:** Solicitações

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

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Lista de papéis / funções | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Maker-checker obrigatório (ex.: liberar OS) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Quem atribui permissões | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Isolamento por cliente / unidade | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Responsável vê preço operacional | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-015, ADP-001..014 · **Módulo:** Autorização de negócio

---

## 19. Source of Truth

**Pergunta:** Para cada conceito crítico, qual sistema é autoritativo?

| Conceito | Resposta | Sistema autoritativo |
| -------- | -------- | -------------------- |
| Cadastro de cliente | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| OS | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Saldo de PO | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Medição | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Fatura / NF | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Pagamento | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Documentos binários | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Mensagens WhatsApp | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-014, DDP-020, DDP-021 · **Módulos:** Integração, todos

---

## 20. Primeiro release

**Pergunta:** O que entra no primeiro release operacional? O que fica explicitamente fora?

| Item | Resposta | Detalhe / condição / evidência |
| ---- | -------- | ------------------------------ |
| Verticais incluídas | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Módulos incluídos (marcar) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | Clientes · Recursos · Solicitações · OS · Execução · Medição · PO · Faturamento · Documentos |
| Módulos explicitamente fora | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Integrações no primeiro release | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| PWA / mobile obrigatório | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |
| Data alvo (se houver) | `CONFIRMED` / `REJECTED` / `CONDITIONAL` / `UNKNOWN` | |

**DDP relacionados:** DDP-026, DDP-025 · **Escopo de produto**

---

## Assinatura

| Campo | Valor |
| ----- | ----- |
| Nome completo | |
| Cargo / função autorizada | |
| Data | |
| Assinatura (física ou eletrônica) | |
| Observações gerais | |

---

## Registro pós-preenchimento (equipe — não preencher antes da resposta)

| Campo | Valor |
| ----- | ----- |
| Registrado em `source-registry.md` | pendente |
| Regras promovidas a `CONFIRMED` | pendente |
| DDPs respondidos | pendente |
| Conflitos abertos (`SC-*`) | pendente |
