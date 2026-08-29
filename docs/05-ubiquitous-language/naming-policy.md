# UL-NAMING-002

| Campo       | Valor                                       |
| ----------- | ------------------------------------------- |
| Document ID | Política de nomes                           |
| Prompt      | 04 (revisão estrutural)                     |
| Status      | CANDIDATE — **não** congela API nem classes |

## Regras gerais

1. **Documentos em português** para termos empresariais preferenciais.
2. **Um conceito por termo** — usar TERM-ID em documentação formal quando houver colisão.
3. **Não usar abreviação não explicada** — primeira menção: "Ordem de Serviço (OS)".
4. **Preservar identificadores externos** — PO, chassi, referências ERP (TERM-048).
5. **Não usar nome de estado para evento** — ver [state-event-command-semantics.md](./state-event-command-semantics.md).
6. **Não usar "status" genérico** quando existirem ciclos independentes (solicitação, OS, medição, documento).
7. **Não usar `quantity`, `value`, `type`, `document` sem qualificação** em artefatos futuros.
8. **Evitar nomes que vazam tecnologia** no domínio empresarial (cache, lock, outbox).
9. **Nomes técnicos futuros** em inglês consistente — somente após Prompt 09+, não como termo preferencial agora.

## Prefixos de identificador (preservados)

| Prefixo                  | Domínio               |
| ------------------------ | --------------------- |
| FR- / NFR- / UC- / AC-   | Requisitos            |
| TERM-                    | Glossário             |
| EV- / BR- / DDP- / RISK- | Análise e governança  |
| GLQ-                     | Questões de glossário |

## Termos proibidos (PROHIBITED)

| Termo                     | Motivo                       | Usar em vez de                     |
| ------------------------- | ---------------------------- | ---------------------------------- |
| Usuário (ator de negócio) | Confunde login com papel     | Solicitante, Executor, Autorizador |
| Admin                     | Role técnica indefinida      | Autorizador empresarial (TERM-007) |
| CRUD                      | Jargão prematuro             | Verbo empresarial do FR            |
| Tabela / entidade / enum  | Antecipação de implementação | TERM-*                             |
| CONFIRMED (regra)         | Sem fonte primária           | ACCEPTED_FOR_DOCUMENTATION         |
| NF-e emitida pelo sistema | Não afirmado em SRC-001      | TERM-018                           |

## Termos desaconselhados (DISCOURAGED)

| Termo                   | Motivo              | Preferência          |
| ----------------------- | ------------------- | -------------------- |
| Gestão                  | Ator vago (EV-080)  | Cargo ou TERM-007    |
| Pedido (sozinho)        | Homônimo            | TERM-001 ou TERM-012 |
| Fatura / Nota (sozinho) | Fiscal ambíguo      | TERM-018             |
| Serviço (sozinho)       | Escopo amplo        | TERM-003 qualificado |
| Draft / Ticket / Job    | Não usados na fonte | TERM-001, TERM-002   |
| RC (sem definição)      | Não evidenciado     | Aguardar fonte       |

## Candidatos técnicos (referência — não API)

Comandos: [`../02-source-analysis/command-candidates.md`](../02-source-analysis/command-candidates.md).

Eventos: [`../02-source-analysis/domain-event-candidates.md`](../02-source-analysis/domain-event-candidates.md).

## Proibição

Não criar nomes de classe, tabela, coluna ou endpoint neste prompt.
