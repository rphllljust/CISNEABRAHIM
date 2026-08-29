# Prompt 31 — Arquitetura orientada a catálogo de serviços

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Base Git** | `5e9d9d2` (Prompt 30 aprovado) |
| **Tipo** | Modelagem de domínio / arquitetura — **sem implementação** |
| **Próximo passo autorizado** | Prompt 32 (modelagem/persistência do catálogo) |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Arquitetura catálogo definida | **SIM** |
| Banco / migrations | **NÃO** |
| Frontend | **NÃO** |
| Tabelas por CNAE/atividade | **NÃO** |
| CNAE como motor fiscal | **NÃO** |
| Alteração em Clients | **NÃO** |
| Prompt 32 executado | **NÃO** |

---

## 1. Princípio central

### CNAE ≠ ServiceDefinition

| Conceito | Papel | Classificação |
| -------- | ----- | ------------- |
| **CNAE** | Classificação empresarial/legal da atividade econômica da contraparte ou da operação | **Fato empresarial** (referência externa; não é workflow) |
| **ServiceDefinition** | Definição operacional do que o CISNE consegue **solicitar, planejar, executar, medir e faturar** | **Decisão de arquitetura** (este prompt) |

**Regra de separação (obrigatória):**

- CNAE **não** determina sozinho fluxo de OS, estados, liberação, medição ou faturamento.
- CNAE **pode** referenciar legalmente uma ou mais `ServiceDefinition` via mapeamento **1→1** ou **1→N**.
- O catálogo **não** substitui regras de domínio, autorização nem integridade financeira.

```text
CNAE (classificação legal)
        │
        │  mapeamento 1→1 ou 1→N (referência, não identidade)
        ▼
ServiceDefinition (capacidade operacional do sistema)
        │
        │  instanciada em solicitação / item de OS / planejamento
        ▼
ServiceOrder + snapshots de versão
```

---

## 2. Fronteiras do bounded context (candidato)

| Contexto | Responsabilidade | Relação com catálogo |
| -------- | ---------------- | -------------------- |
| **BC-005 Service Request** | Origem da demanda | Seleciona `ServiceDefinition` candidata |
| **BC-003 / BC-004 Commercial** | Referência comercial, PO | Requisitos comerciais parametrizados pelo catálogo |
| **BC-006 Service Order** | Ciclo de vida da OS | **Referencia versão** da definição + snapshot |
| **BC-007 Resource** | Alocação | Requisitos de recurso vindos do catálogo |
| **BC-008 / BC-009 Execution / Evidence** | Campo e evidências | Campos e evidências exigidas pelo catálogo |
| **BC-010 / BC-011 Measurement / Billing** | Medição e preparação de faturamento | Modelo de medição e unidades permitidas |
| **BC-002 Party (Clients)** | Contraparte PJ | **Fora de escopo** deste prompt; inalterado |
| **Catálogo (novo — candidato BC-CAT-001)** | Definições versionadas de serviço | Publica `ServiceDefinition`; não executa transições críticas |

O catálogo é **read model configurável + versionamento** consumido pelos contextos operacionais. Não é boundary de segurança nem de transição de estado.

---

## 3. Núcleo empresarial reutilizável

Todos os arquétipos **reutilizam o mesmo núcleo** quando aplicável — sem workflow hardcoded por CNAE:

```text
Client
  → Service Request
  → Commercial Authorization
  → Service Order (OS)
  → Planning
  → Execution
  → Measurement
  → Billing
```

**Interpretação de engenharia:** variações entre verticais expressam-se por **parâmetros do catálogo** (unidades, evidências, recursos, medição, requisitos comerciais), não por forks de código ou tabelas por atividade.

**Fato empresarial (SRC-001 / BR-003):** multiplicidade de atividades citadas **não** implica um único processo nem um único tipo de OS para todo o release.

---

## 4. Arquétipos operacionais

Arquétipos agrupam comportamento **parametrizável** sem impor o mesmo workflow específico a todos os membros do grupo.

| Código | Nome | Descrição resumida | Exemplos de verticais CISNE (mapeamento indicativo) |
| ------ | ---- | ------------------ | --------------------------------------------------- |
| `RENTAL` | Locação | Disponibilização de ativo com ou sem operador, por período | Automóveis, máquinas, equipamentos de construção, ônibus, caminhões, motocicletas |
| `TRANSPORT` | Transporte | Deslocamento de carga ou passageiros | Carga municipal/intermunicipal/interestadual/internacional, fretamento, transporte com motorista |
| `CIVIL_WORK` | Obra civil | Serviços de construção, terraplenagem, urbanização | Construção, rodoviária, fundações, demolição, terraplenagem, urbanização, obras especiais, preparação de canteiro/terreno, poços |
| `INSTALLATION` | Instalação | Montagem/instalação técnica em campo ou planta | Instalação elétrica, industrial, hidráulica, redes água/esgoto |
| `MAINTENANCE` | Manutenção | Conservação, reparo, preventiva | (aplicável transversalmente a ativos locados ou de clientes) |
| `INDUSTRIAL_SERVICE` | Serviço industrial | Operação/manutenção industrial especializada | Usinagem, tornearia, solda, fabricação de máquinas, operação de equipamentos de elevação |
| `FACILITY_SERVICE` | Facility services | Serviços recorrentes em instalações | Facility services, paisagismo, pintura (quando recorrente/contrato) |
| `COMMERCIAL_REPRESENTATION` | Representação comercial | Intermediação/representação sem execução direta | Representação comercial, agenciamento comercial |
| `GOODS_TRADE` | Comércio de bens | Venda/distribuição de mercadorias | Pneus, atacado de máquinas, materiais de construção, comércio de veículos |
| `LABOR_SERVICE` | Mão de obra / agenciamento | Fornecimento ou seleção de trabalho | Seleção e agenciamento de mão de obra |
| `WASTE_SERVICE` | Resíduos | Coleta, transporte ou destinação de resíduos | Resíduos, demolição com destinação de entulho |
| `MARITIME_SUPPORT` | Apoio marítimo | Suporte logístico/operacional marítimo | Apoio marítimo |

**Decisão pendente (SRC-002 Q2):** prioridade de release por vertical (ex.: locação) permanece `UNKNOWN` até resposta formal — o catálogo **antecipa** diversidade sem fixar escopo de implementação.

---

## 5. Reconhecimento formal dos grupos empresariais CISNE

Grupos abaixo são **reconhecidos formalmente** como verticais a cobrir pelo catálogo (não como fluxos isolados). Fonte: contexto SRC-000/SRC-001, ampliação do Prompt 31 e atividades citadas na solicitação.

| # | Grupo empresarial | Arquétipo primário | Observação |
| - | ----------------- | ------------------ | ---------- |
| 1 | Representação comercial | `COMMERCIAL_REPRESENTATION` | |
| 2 | Instalação elétrica | `INSTALLATION` | |
| 3 | Locação de automóveis | `RENTAL` | Prioridade candidata (EV-080); escopo release `UNKNOWN` |
| 4 | Locação de máquinas/equipamentos | `RENTAL` | |
| 5 | Instalação industrial | `INSTALLATION` / `INDUSTRIAL_SERVICE` | 1→N possível |
| 6 | Facility services | `FACILITY_SERVICE` | |
| 7 | Construção | `CIVIL_WORK` | |
| 8 | Pneus | `GOODS_TRADE` | |
| 9 | Usinagem / tornearia / solda | `INDUSTRIAL_SERVICE` | |
| 10 | Transporte de carga municipal | `TRANSPORT` | |
| 11 | Transporte intermunicipal / interestadual / internacional | `TRANSPORT` | Pode ser mesma definição parametrizada |
| 12 | Motocicletas | `RENTAL` / `GOODS_TRADE` | Depende de operação (locação vs venda) |
| 13 | Paisagismo | `FACILITY_SERVICE` | |
| 14 | Atacado de máquinas | `GOODS_TRADE` | |
| 15 | Materiais de construção | `GOODS_TRADE` | |
| 16 | Construção rodoviária | `CIVIL_WORK` | |
| 17 | Demolição | `CIVIL_WORK` / `WASTE_SERVICE` | |
| 18 | Terraplenagem | `CIVIL_WORK` | |
| 19 | Instalações hidráulicas | `INSTALLATION` | |
| 20 | Pintura | `FACILITY_SERVICE` / `CIVIL_WORK` | |
| 21 | Comércio de veículos | `GOODS_TRADE` | |
| 22 | Fabricação de máquinas | `INDUSTRIAL_SERVICE` / `GOODS_TRADE` | |
| 23 | Fretamento | `TRANSPORT` | |
| 24 | Urbanização | `CIVIL_WORK` | |
| 25 | Equipamentos para construção | `RENTAL` | |
| 26 | Fundações | `CIVIL_WORK` | |
| 27 | Sinalização | `CIVIL_WORK` | |
| 28 | Resíduos | `WASTE_SERVICE` | |
| 29 | Ônibus / micro-ônibus | `RENTAL` / `TRANSPORT` | |
| 30 | Transporte com motorista | `TRANSPORT` / `RENTAL` | |
| 31 | Preparação de canteiro | `CIVIL_WORK` | |
| 32 | Seleção / agenciamento de mão de obra | `LABOR_SERVICE` | |
| 33 | Obras especiais | `CIVIL_WORK` | |
| 34 | Redes de água/esgoto | `INSTALLATION` / `CIVIL_WORK` | |
| 35 | Operação de equipamentos de elevação | `INDUSTRIAL_SERVICE` / `RENTAL` | |
| 36 | Preparação de terreno | `CIVIL_WORK` | |
| 37 | Poços | `CIVIL_WORK` | |
| 38 | Caminhões | `RENTAL` / `GOODS_TRADE` | |
| 39 | Apoio marítimo | `MARITIME_SUPPORT` | |
| 40 | Demais atividades apresentadas | *mapeamento por arquétipo* | Novas entradas seguem o mesmo padrão |

**Proibição explícita:** não criar um fluxo, módulo ou tabela dedicada por linha desta lista.

---

## 6. Contrato conceitual — `ServiceDefinition`

> **Aviso:** contrato **conceitual** para Prompt 32. Não é schema SQL, DTO nem entidade ORM definitiva.

```typescript
/**
 * Conceito de domínio — NÃO é implementação.
 * Prompt 32 decidirá persistência, cardinalidades e nomes físicos.
 */
type ServiceDefinition = {
  id: string;                          // identificador estável da linhagem
  code: string;                        // código de negócio único na versão publicada
  name: string;
  category: string;                    // agrupamento administrativo (não substitui archetype)
  archetype: OperationalArchetype;     // um dos 12 arquétipos
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  version: number;                     // versão publicada desta definição
  defaultUnitOfMeasure?: string;       // unidade padrão (catálogo de unidades)
  allowedUnits: string[];              // unidades permitidas para medição/planejamento
  pricingModels: PricingModelRef[];    // modalidades comerciais *permitidas*, não preço
  measurementModel: MeasurementModelRef;
  executionRequirements: RequirementSet;
  resourceRequirements: RequirementSet;
  evidenceRequirements: RequirementSet;
  commercialRequirements: RequirementSet;
  legalClassificationRefs: LegalClassificationRef[];  // CNAE/NCM/etc. — referência, não regra fiscal
  createdAt: string;
  updatedAt: string;
};
```

### Tipos auxiliares (conceituais)

| Tipo | Propósito |
| ---- | --------- |
| `OperationalArchetype` | Enum dos 12 arquétipos da §4 |
| `PricingModelRef` | Referência a modelo comercial permitido (ex.: diária, m³, tonelada, viagem) — **sem** fixar valor |
| `MeasurementModelRef` | Como medir (por período, quantidade, evento, checklist) |
| `RequirementSet` | Conjunto parametrizável de requisitos (campos obrigatórios, tipos de recurso, documentos) |
| `LegalClassificationRef` | Par `{ scheme: 'CNAE' \| 'NCM' \| ...; code: string }` — ligação legal, não motor de imposto |

### Relação CNAE ↔ catálogo

| Cenário | Permitido | Exemplo |
| ------- | --------- | ------- |
| 1 CNAE → 1 ServiceDefinition | Sim | CNAE de locação de automóveis → `RENTAL-AUTO-DAILY` |
| 1 CNAE → N ServiceDefinitions | Sim | Mesmo CNAE → locação com operador / sem operador |
| 1 ServiceDefinition → N CNAEs | Sim (hipótese) | Definição genérica de transporte cobre subclasses |
| CNAE define liberação de OS | **Não** | Permanece em domínio/autorização |
| CNAE calcula imposto | **Não** | Fora de escopo; integração fiscal futura se houver |

---

## 7. Variabilidade vs invariante

### 7.1 O catálogo PODE configurar (parametrização)

| Área | Exemplos |
| ---- | -------- |
| Unidades permitidas | hora, dia, m³, ton, viagem, unidade |
| Recursos possíveis | veículo, operador, equipamento, equipe mínima |
| Evidências requeridas | foto, checklist, assinatura, medição de horímetro |
| Campos de execução | campos customizados por arquétipo |
| Modalidade de medição | por período, por quantidade, por evento |
| Modalidade comercial | referência a modelo de preço permitido |
| Requisitos parametrizáveis | documentos, PO, contrato, limites numéricos |

### 7.2 O catálogo NÃO PODE decidir sozinho (permanece em código/domínio)

| Invariante | Motivo |
| -------- | ------ |
| Quem libera OS | Autorização + segregação (SRC-002 Q4; BR-037 para Cliente ACTIVE) |
| Quem altera preço | Política comercial e aprovação |
| Burlar aprovação comercial | Integridade do fluxo Request → Authorization → OS |
| Sobrescrever OS concluída | Integridade de histórico / SM-OS |
| Autorização final | PDP, capabilities, escopos |
| Transições críticas de estado | Máquinas de estado no backend |
| Integridade financeira | Medição, faturamento, pagamento — regras de domínio |
| Concorrência otimista | `version` em agregados mutáveis (padrão já adotado em Clients) |

**Regra:** o catálogo informa **o que é exigido**; o backend **decide se a transição é permitida** dado o estado, ator e políticas.

---

## 8. Versionamento e snapshots

### 8.1 Princípio

`ServiceDefinition` é **versionada**. Alteração futura no catálogo **não** altera OS histórica.

### 8.2 Conceitos

| Conceito | Descrição |
| -------- | --------- |
| `ServiceDefinition` (linhagem) | Identidade estável (`id`) ao longo do tempo |
| `ServiceDefinitionVersion` | Publicação imutável `version = N` com payload completo |
| `ServiceDefinitionSnapshot` | Cópia denormalizada anexada à OS no momento do vínculo |
| `serviceDefinitionVersionRef` | Referência `{ definitionId, version }` na OS / item planejado |

### 8.3 Regras de snapshot (obrigatórias na implementação futura)

1. Ao vincular uma definição a uma OS (rascunho ou planejamento), persistir **`serviceDefinitionVersionRef` + `snapshot`**.
2. Snapshot deve conter pelo menos: `code`, `name`, `archetype`, `allowedUnits`, `measurementModel`, `executionRequirements`, `evidenceRequirements`, `commercialRequirements` **vigentes na versão**.
3. Edição do catálogo publica **nova versão**; versões anteriores permanecem consultáveis.
4. Status `RETIRED` impede **novas** vinculações; não apaga histórico.
5. OS em andamento continua interpretando o **snapshot** mesmo se a definição for aposentada.

```text
Catálogo (mutável por nova versão)
  ServiceDefinition v3 ACTIVE
  ServiceDefinition v2 RETIRED
        │
        │ snapshot no instante do vínculo
        ▼
ServiceOrder #12345
  serviceDefinitionVersionRef: { id, version: 2 }
  serviceDefinitionSnapshot: { ... payload v2 ... }
```

---

## 9. O que permanece código vs configurável

| Camada | Responsabilidade |
| ------ | ---------------- |
| **Catálogo (dados versionados)** | Definições, unidades permitidas, requisitos parametrizáveis, refs legais |
| **Domínio / aplicação** | Máquinas de estado, invariantes, validação de transição, autorização |
| **Políticas comerciais** | Aprovação, preço efetivo, desconto — fora do catálogo |
| **Integrações** | ERP, fiscal — anti-corrupção; catálogo não calcula tributos |

Implementação futura (Prompt 32+): preferir **poucas tabelas genéricas** (`service_definitions`, `service_definition_versions`, `legal_classification_mappings`) em vez de schema por CNAE.

---

## 10. Invariantes desta arquitetura

| ID | Invariante | Classificação |
| -- | ---------- | ------------- |
| CAT-INV-001 | CNAE não é identidade operacional de serviço | Decisão de arquitetura (Prompt 31) |
| CAT-INV-002 | Toda OS vinculada a serviço deve referenciar versão + snapshot | Decisão de arquitetura (Prompt 31) |
| CAT-INV-003 | Catálogo não executa transição de estado de OS | Decisão de arquitetura (Prompt 31) |
| CAT-INV-004 | Um arquétipo não implica um único workflow hardcoded | Alinhado a BR-003 (candidata) |
| CAT-INV-005 | Verticais da §5 mapeiam para arquétipos, não para módulos isolados | Decisão de arquitetura (Prompt 31) |

---

## 11. Fora de escopo (Prompt 31)

- Schema físico, migrations, seeds de catálogo
- APIs REST/GraphQL
- UI de administração de catálogo
- Motor de regras fiscais baseado em CNAE
- Alteração do módulo Clients (Prompt 29/30)
- Implementação de Service Request, OS, Execution (prompts futuros)

---

## 12. Quality gate (evidência)

- [x] Documento único `31-service-catalog-domain.md` criado
- [x] Princípio CNAE ≠ ServiceDefinition registrado
- [x] 12 arquétipos operacionais modelados
- [x] Contrato conceitual `ServiceDefinition` definido (não definitivo)
- [x] Variabilidade vs invariante separada
- [x] Versionamento e snapshot especificados
- [x] Grupos empresariais CISNE reconhecidos sem fluxo por item
- [x] Clients não alterado
- [x] `pnpm lint` — PASS
- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS
- [x] `pnpm test:integration` — PASS
- [x] `pnpm build` — PASS
- [x] `pnpm gate:src-002` — PASS
- [x] Prompt 32 não executado

---

## Referências

- [`business-context.md`](../01-foundation/business-context.md) — atividades citadas (ACT-CAND-*)
- [`context-map.md`](../06-domain-boundaries/context-map.md) — BCs do núcleo operacional
- [`SRC-002-business-baseline-confirmation.md`](../inputs/SRC-002-business-baseline-confirmation.md) — Q2 tipos de serviço (`UNKNOWN` em release)
- [`29-clients-backend.md`](./29-clients-backend.md) — Cliente como pré-condição de liberação (BR-037); **inalterado**
