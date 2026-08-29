# SM-CAND-006 — DOCUMENT

| Campo    | Valor                      |
| -------- | -------------------------- |
| ID       | SM-CAND-006                |
| Ciclo    | DOCUMENT (lógico + versão) |
| BC owner | BC-CAND-014                |
| Fonte    | SRC-001 (EV-082)           |
| Status   | PARTIALLY_SUPPORTED        |

## Três níveis — estados não compartilhados

| Nível             | Estados candidatos                     | SM                   |
| ----------------- | -------------------------------------- | -------------------- |
| Documento lógico  | RASCUNHO, VIGENTE, INVALIDADO          | Este arquivo         |
| Versão documental | RASCUNHO_V, PUBLICADA_V, SUBSTITUIDA_V | Sub-seção abaixo     |
| Arquivo binário   | Metadado (checksum, mime)              | Não modelado como SM |

## Documento lógico

### STATE-CAND-028 — RASCUNHO

| Campo     | Valor                                      |
| --------- | ------------------------------------------ |
| Nome      | Rascunho                                   |
| Definição | Documento lógico criado sem versão vigente |
| Status    | CANDIDATE                                  |

### STATE-CAND-029 — VIGENTE

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Nome        | Vigente                               |
| Definição   | Pelo menos uma versão publicada ativa |
| Fonte       | CMD-016, anexos                       |
| Não implica | OS válida ou medição aprovada         |
| Status      | CANDIDATE                             |

### STATE-CAND-030 — SUBSTITUIDA (nível versão predominante)

| Campo     | Valor                               |
| --------- | ----------------------------------- |
| Nome      | Substituída                         |
| Definição | Versão anterior superseded por nova |
| Fonte     | DE-019, CMD-022                     |
| Status    | CANDIDATE                           |

### STATE-CAND-031 — INVALIDADA

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| Nome      | Invalidada                                |
| Definição | Documento lógico sem validade empresarial |
| Terminal  | Sim (candidato)                           |
| DDPs      | DDP-004                                   |
| Status    | PENDING_BUSINESS_DECISION                 |

## Versão documental (sub-ciclo)

| ID             | Nome               | Status    |
| -------------- | ------------------ | --------- |
| STATE-CAND-V01 | Rascunho de versão | CANDIDATE |
| STATE-CAND-V02 | Versão publicada   | CANDIDATE |
| STATE-CAND-V03 | Versão substituída | CANDIDATE |

Arquivo binário: sem SM própria — atributos de STATE-CAND-V02.

## Transições

TR-CAND-032..035 em [state-transition-register.md](./state-transition-register.md).
