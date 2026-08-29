# REQ-VR-001

| Campo | Valor |
| --- | --- |
| Document ID | Regras de validação empresarial |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |
| Total VRs | 22 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
| ID | Tipo | Regra | FR | Evidências | Condição | Violação | Criticidade | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VR-001 | UNIQUENESS_VALIDATION | Identificador interno de solicitação deve ser único | FR-001 | EV-005 | Ao registrar nova solicitação | Rejeitar ou sinalizar duplicidade | HIGH | PENDING_SOURCE_VALIDATION |
| VR-002 | STATE_DEPENDENT_VALIDATION | Conversão de solicitação exige elegibilidade e ausência de conversão prévia | FR-008 | EV-028, EV-034 | Antes de converter solicitação | Impedir conversão duplicada | HIGH | PENDING_SOURCE_VALIDATION |
| VR-003 | AUTHORIZATION_VALIDATION | Conversão em OS exige ator autorizado | FR-009 | EV-036 | Na conversão | Impedir conversão | CRITICAL | PENDING_SOURCE_VALIDATION |
| VR-004 | STATE_DEPENDENT_VALIDATION | Liberação de OS exige elegibilidade de preparação | FR-014 | EV-036, EV-039 | Antes de liberar | Impedir liberação | CRITICAL | PENDING_SOURCE_VALIDATION |
| VR-005 | AUTHORIZATION_VALIDATION | Liberação exige ator empresarial autorizado | FR-014 | EV-013 | Na liberação | Impedir liberação | CRITICAL | PENDING_SOURCE_VALIDATION |
| VR-006 | STATE_DEPENDENT_VALIDATION | Início de execução exige OS liberada | FR-017 | EV-044 | Ao iniciar execução | Impedir início | HIGH | PENDING_SOURCE_VALIDATION |
| VR-007 | CROSS_FIELD_VALIDATION | Quantidade efetiva pode diferir da planejada quando registrada | FR-027 | EV-051, EV-064 | Ao registrar quantidade utilizada | Exigir registro explícito da diferença | HIGH | PENDING_SOURCE_VALIDATION |
| VR-008 | CROSS_FIELD_VALIDATION | Custo interno e preço comercial não devem ser fundidos | FR-031 | EV-058, EV-061 | Ao registrar valores | Manter distinção conceitual | CRITICAL | PENDING_SOURCE_VALIDATION |
| VR-009 | AUTHORIZATION_VALIDATION | Visualização de custo e margem restrita a atores autorizados | FR-032 | EV-061, EV-078 | Na consulta de custo | Restringir acesso | HIGH | PENDING_BUSINESS_DECISION |
| VR-010 | FINANCIAL_VALIDATION | Consumo de PO não deve exceder saldo autorizado quando regra existir | FR-033 | EV-060 | Ao registrar consumo de PO | Sinalizar ou impedir conforme DDP-009 | MEDIUM | PENDING_BUSINESS_DECISION |
| VR-011 | CROSS_FIELD_VALIDATION | Itens faturáveis exigem origem identificável quando regra preliminar aplicável | FR-038 | EV-017, EV-058 | Antes de preparar cobrança | Impedir ou sinalizar ausência de origem | CRITICAL | PENDING_SOURCE_VALIDATION |
| VR-012 | DOCUMENT_VALIDATION | Substituição documental não apaga versão anterior silenciosamente | FR-042 | EV-082 | Na substituição | Preservar versões anteriores | HIGH | PENDING_SOURCE_VALIDATION |
| VR-013 | UNIQUENESS_VALIDATION | Possível dupla alocação do mesmo recurso deve ser sinalizada | FR-028 | EV-053 | Na alocação simultânea candidata | Sinalizar conflito | MEDIUM | PENDING_SOURCE_VALIDATION |
| VR-014 | FIELD_VALIDATION | Identificadores externos comerciais informados devem ser preservados | FR-030 | EV-059, EV-072 | Na persistência | Não alterar silenciosamente | HIGH | PENDING_SOURCE_VALIDATION |
| VR-015 | STATE_DEPENDENT_VALIDATION | Decisão sobre solicitação exige elegibilidade candidata | FR-006 | EV-030 | Antes de decidir | Impedir decisão ou registrar pendência | HIGH | PENDING_BUSINESS_DECISION |
| VR-016 | STATE_DEPENDENT_VALIDATION | Cancelamento de OS pode exigir tratamento de recursos alocados | FR-020 | EV-047 | No cancelamento | Registrar pendência DDP-004 | MEDIUM | PENDING_BUSINESS_DECISION |
| VR-017 | STATE_DEPENDENT_VALIDATION | Reabertura de OS concluída depende de regra futura | FR-021 | EV-047 | Na reabertura | Bloquear até DDP-005 | LOW | PENDING_BUSINESS_DECISION |
| VR-018 | CROSS_FIELD_VALIDATION | Medição preparada deve referenciar origem dos itens | FR-035 | EV-062 | Na preparação de medição | Impedir medição sem origem | HIGH | PENDING_BUSINESS_DECISION |
| VR-019 | AUTHORIZATION_VALIDATION | Decisão sobre medição exige ator autorizado quando fluxo existir | FR-037 | EV-062 | Na decisão de medição | Impedir decisão | HIGH | PENDING_BUSINESS_DECISION |
| VR-020 | DOCUMENT_VALIDATION | Evidência anexada deve estar vinculada ao contexto correto | FR-004 | EV-030 | No anexo de evidência | Rejeitar vínculo inválido candidato | LOW | PENDING_BUSINESS_DECISION |
| VR-021 | EXTERNAL_VALIDATION | Dados de integração externa não devem criar sucesso local falso | FR-030 | EV-077 | Em integração candidata | Registrar falha externa | HIGH | PENDING_SOURCE_VALIDATION |
| VR-022 | CROSS_FIELD_VALIDATION | Divergência comercial deve ser registrada quando identificada | FR-034 | EV-023, EV-063 | Na comparação comercial | Registrar divergência | HIGH | PENDING_SOURCE_VALIDATION |

## Detalhamento

### VR-001

- **Fonte:** SRC-001
- **Evidências:** EV-005
- **BR:** BR-004
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-002

- **Fonte:** SRC-001
- **Evidências:** EV-028, EV-034
- **BR:** BR-001
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-003

- **Fonte:** SRC-001
- **Evidências:** EV-036
- **BR:** BR-006
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-004

- **Fonte:** SRC-001
- **Evidências:** EV-036, EV-039
- **BR:** BR-006
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-005

- **Fonte:** SRC-001
- **Evidências:** EV-013
- **BR:** BR-006
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-006

- **Fonte:** SRC-001
- **Evidências:** EV-044
- **BR:** BR-006
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-007

- **Fonte:** SRC-001
- **Evidências:** EV-051, EV-064
- **BR:** BR-010
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-008

- **Fonte:** SRC-001
- **Evidências:** EV-058, EV-061
- **BR:** BR-013
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-009

- **Fonte:** SRC-001
- **Evidências:** EV-061, EV-078
- **BR:** BR-018
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-010

- **Fonte:** SRC-001
- **Evidências:** EV-060
- **BR:** BR-008
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-011

- **Fonte:** SRC-001
- **Evidências:** EV-017, EV-058
- **BR:** BR-014
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-012

- **Fonte:** SRC-001
- **Evidências:** EV-082
- **BR:** BR-016
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-013

- **Fonte:** SRC-001
- **Evidências:** EV-053
- **BR:** BR-017
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-014

- **Fonte:** SRC-001
- **Evidências:** EV-059, EV-072
- **BR:** BR-008
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-015

- **Fonte:** SRC-001
- **Evidências:** EV-030
- **BR:** BR-024
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-016

- **Fonte:** SRC-001
- **Evidências:** EV-047
- **BR:** BR-024
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-017

- **Fonte:** SRC-001
- **Evidências:** EV-047
- **BR:** BR-024
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-018

- **Fonte:** SRC-001
- **Evidências:** EV-062
- **BR:** BR-009
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-019

- **Fonte:** SRC-001
- **Evidências:** EV-062
- **BR:** BR-009
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-020

- **Fonte:** SRC-001
- **Evidências:** EV-030
- **BR:** BR-024
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_BUSINESS_DECISION

### VR-021

- **Fonte:** SRC-001
- **Evidências:** EV-077
- **BR:** BR-005
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION

### VR-022

- **Fonte:** SRC-001
- **Evidências:** EV-023, EV-063
- **BR:** BR-002
- **Camada futura provável:** Domínio / aplicação (sem escolha de stack)
- **Proteção em persistência:** UNKNOWN
- **Status:** PENDING_SOURCE_VALIDATION
