# Template — fonte (SOURCE)

Usar na ingestão (Prompt 01+). Não preencher com documento fictício tratado como real.

Copiar para anexo ou seção em `docs/01-foundation/` / registro, e atualizar `source-registry.md`.

## Campos obrigatórios

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| SOURCE-ID | Sim | Próximo `SRC-NNN` livre. Nunca reutilizar. Nunca atribuir a arquivo inexistente. |
| Title | Sim | Nome do artefato |
| Type | Sim | Ex.: contrato, planilha, transcrição, PO, NF, e-mail, Documento Mestre |
| Origin | Sim | Quem entregou / sistema de origem |
| Received at | Sim | Data/hora reais de recebimento |
| Location | Sim | Caminho em `docs/inputs/` ou URL interna controlada |
| Status | Sim | Ver abaixo |
| Integrity | Sim | Hash, número de páginas, ou “não verificado” |
| Personal / sensitive data | Sim | Sim/Não/Unknown e mitigação |
| May prove operational rules? | Sim | Sim somente se o conteúdo for normativo empresarial, não só governança de repo |

## Status permitidos

```text
NOT_PROVIDED
RECEIVED
REGISTERED
IN_ANALYSIS
ANALYZED
PARTIAL
UNTRUSTED
SUPERSEDED
REJECTED
```

`NOT_PROVIDED` aplica-se a **tipos** ainda sem artefato, sem criar SOURCE-ID.

## Como citar a fonte

- No texto: `SRC-NNN` + localizador (página, aba, cláusula, timestamp da transcrição).
- Evidência: `EVD-NNN` opcional, apontando o localizador.
- Frase proibida: “conforme o cliente” sem SOURCE-ID.

## Como registrar incerteza

- Trecho ilegível: `UNREADABLE` + tentativa.
- Autoridade duvidosa: `UNTRUSTED` + motivo.
- Versão desconhecida: `VERSION_UNKNOWN`.
- Não inferir omissões como negativas confirmadas.

## Como preservar histórico

Não apagar registro de fonte rejeitada. Status `SUPERSEDED` aponta o SRC sucessor. Manter arquivo original ou registrar destruição autorizada.

## Quando bloqueia implementação

- Regra crítica cita esta fonte e a fonte está `UNTRUSTED`, `NOT_PROVIDED` ou sem localizador: `NOT_READY_FOR_IMPLEMENTATION`.
- Conflito com outra fonte: abrir `SC-*` e não implementar o trecho em disputa.
