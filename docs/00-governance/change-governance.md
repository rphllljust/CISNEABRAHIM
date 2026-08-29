# Change governance

| Campo       | Valor   |
| ----------- | ------- |
| Document ID | CHG-001 |
| Source      | SRC-000 |

## Política de mudança

Toda alteração material neste repositório deve ser:

- rastreável a um prompt, correção de gate ou correção de documentação;
- classificada (fato, hipótese, decisão, etc.);
- não destrutiva em relação a histórico de regras, riscos e decisões.

## Política de commits incrementais

Quando o Git estiver disponível **e** `user.name` / `user.email` já configurados (local ou global):

1. Revisar `git status` e `git diff`.
2. Incluir somente arquivos da etapa atual.
3. Criar commit pequeno, com mensagem que explica o **porquê**.
4. Não alterar `git config`.
5. Não inventar identidade.
6. Não usar `--no-verify` salvo ordem explícita.
7. Não fazer push salvo ordem explícita.
8. Não publicar remoto neste Prompt 00 e, em geral, sem autorização.

Se a identidade não estiver configurada: manter os arquivos no working tree e registrar no log que o commit ficou pendente.

## Granularidade

- Preferir um commit por prompt quando o prompt for coeso (exemplo: Prompt 00).
- Prompts posteriores que misturem documentação e código (quando autorizados) devem separar assuntos se o diff for heterogêneo.
- Não commitar segredos, `.env`, credenciais, dumps ou uploads reais de cliente sem política de dados.

## Mensagens

Usar prefixo convencional quando útil (`chore:`, `docs:`, `fix:`) sem fingir que há release de produto.

Prompt 00 (autorizado):

```text
chore: establish project governance baseline
```

## Revisão

Mudança que altere status de regra (`CANDIDATE` → `CONFIRMED`), feche DDP, ou declare escopo `IN_SCOPE_CONFIRMED` exige fonte no `source-registry.md` e atualização da matriz de rastreabilidade.

## Proibições

- Force push para `main`/`master` sem ordem explícita.
- Reescrita de histórico que apague evidência de erro.
- Amend de commit já enviado a remoto sem ordem explícita.
