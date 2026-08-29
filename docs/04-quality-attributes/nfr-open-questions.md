# QATTR-NFNQ-001

| Campo | Valor |
| --- | --- |
| Document ID | Questões abertas — requisitos não funcionais |
| Fonte | SRC-001 |
| Total | 18 (NFNQ-001..NFNQ-018) |
| Prompt | 03 |

---

### NFNQ-001

**Pergunta:** Qual RPO (perda máxima aceitável de dados) a empresa autoriza?

- **Evidências:** EV-083
- **DDP:** DDP-016
- **NFR:** NFR-027
- **Status:** OPEN

### NFNQ-002

**Pergunta:** Qual RTO (tempo máximo de recuperação) a empresa autoriza?

- **Evidências:** EV-083
- **DDP:** DDP-016
- **NFR:** NFR-028
- **Status:** OPEN

### NFNQ-003

**Pergunta:** Qual política de sessão (duração, encerramento, MFA) será exigida?

- **Evidências:** EV-078
- **DDP:** DDP-015
- **NFR:** NFR-016; SEC-REQ-011, SEC-REQ-018
- **Status:** OPEN

### NFNQ-004

**Pergunta:** Quais classes de operação terão metas de tempo de resposta e quais valores?

- **Evidências:** EV-074, EV-075
- **DDP:** DDP-036
- **NFR:** NFR-032
- **Status:** OPEN

### NFNQ-005

**Pergunta:** Quantos usuários simultâneos e qual volume mensal transacional são esperados?

- **Evidências:** EV-075
- **DDP:** DDP-017
- **NFR:** NFR-033
- **Status:** OPEN

### NFNQ-006

**Pergunta:** Qual tamanho e quantidade média/pico de arquivos anexados?

- **Evidências:** EV-067, EV-069
- **DDP:** DDP-017
- **NFR:** NFR-034
- **Status:** OPEN

### NFNQ-007

**Pergunta:** Quais SLAs de integração com ERP, fiscal e rastreamento serão contratados?

- **Evidências:** EV-077
- **DDP:** DDP-014
- **NFR:** NFR-035
- **Status:** OPEN

### NFNQ-008

**Pergunta:** Quais dados pessoais são estritamente necessários e qual base legal se aplica?

- **Evidências:** EV-029, EV-030
- **DDP:** DDP-039
- **NFR:** NFR-036
- **Status:** OPEN — PENDING_LEGAL_VALIDATION

### NFNQ-009

**Pergunta:** Quais prazos de retenção por tipo de dado e documento?

- **Evidências:** EV-081, EV-083
- **DDP:** DDP-019
- **NFR:** NFR-037
- **Status:** OPEN — PENDING_LEGAL_VALIDATION

### NFNQ-010

**Pergunta:** Como será executado o descarte seguro ao fim da retenção?

- **Evidências:** EV-083
- **DDP:** DDP-019
- **NFR:** NFR-038
- **Status:** OPEN

### NFNQ-011

**Pergunta:** Quais campos de log técnico podem conter PII e como redigir?

- **Evidências:** EV-029
- **DDP:** DDP-039
- **NFR:** NFR-039
- **Status:** OPEN — PENDING_LEGAL_VALIDATION

### NFNQ-012

**Pergunta:** Qual disponibilidade mínima aceitável em horário operacional?

- **Evidências:** EV-005
- **DDP:** DDP-040
- **NFR:** NFR-023
- **Status:** OPEN

### NFNQ-013

**Pergunta:** Existe tolerância a indisponibilidade planejada e qual janela?

- **DDP:** DDP-040
- **NFR:** AVAIL-REQ-005
- **Status:** OPEN

### NFNQ-014

**Pergunta:** Integrações críticas exigem disponibilidade 24/7?

- **Evidências:** EV-077
- **DDP:** DDP-014, DDP-040
- **Status:** OPEN

### NFNQ-015

**Pergunta:** Qual mecanismo de concorrência por operação (política, não tecnologia)?

- **DDP:** DDP-037
- **NFR:** NFR-001..NFR-005
- **Status:** OPEN

### NFNQ-016

**Pergunta:** Qual observabilidade mínima exigida pela operação (eventos, métricas, alertas)?

- **Evidências:** EV-074
- **DDP:** DDP-038
- **NFR:** NFR-029..NFR-031
- **Status:** OPEN

### NFNQ-017

**Pergunta:** Com que frequência testar restauração de backup?

- **Evidências:** EV-083
- **DDP:** DDP-016
- **NFR:** NFR-026
- **Status:** OPEN

### NFNQ-018

**Pergunta:** Requisitos de acessibilidade (WCAG nível, dispositivos) para operadores?

- **DDP:** DDP-025
- **A11Y-REQ:** A11Y-REQ-001
- **Status:** OPEN
