# QA-UAT-003 — Checklist UX UAT

| Campo       | Valor        |
| ----------- | ------------ |
| Document ID | QA-UAT-003   |
| Prompt      | 89           |

## Escopo

Avaliação de clareza, tempo de tarefa, erros humanos, campos confusos e responsividade.

**Regra:** pedidos de UX que enfraqueçam regra crítica de domínio são **rejeitados** sem redesign formal.

## Automatizado (shell UI)

| Item | Viewports | Evidência |
| ---- | --------- | --------- |
| Landmarks acessíveis (banner, main, nav) | mobile, tablet, desktop | `vertical-quality-gate.e2e.test.tsx` |
| Menu mobile expandível | mobile | idem |
| Estado forbidden sem vazar capabilities | desktop | idem |

## Manual (sessão UAT com operador)

| # | Critério | Locação | Transporte | Obra | Mobile | Desktop |
| - | -------- | ------- | ---------- | ---- | ------ | ------- |
| 1 | Login e chegada ao painel em < 60s | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Criar solicitação sem campos ambíguos | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Fluxo OS→execução compreensível | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Mensagens de erro acionáveis | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Formulários críticos usáveis em mobile | ☐ | ☐ | ☐ | ☐ | ☐ |

**Classificação:** itens manuais permanecem `PENDING` até sessão com patrocinador/operador — não falsificar aceite.

## Observações engenharia (interpretação)

- Shell responsivo validado automaticamente
- Fluxos de domínio validados via API UAT (Prompt 89) — UI de cada módulo depende de sessão manual futura
