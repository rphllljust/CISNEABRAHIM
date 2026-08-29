# TECH-FE-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação frontend |
| Prompt | 10 |

## Opções

| Opção | Score | Resultado |
| --- | --- | --- |
| **React + Vite** | 4.22 | **Selecionado** |
| React + Next.js | 3.95 | Rejeitado para MVP |
| Vue 3 + Vite | 3.75 | Rejeitado |
| Angular | 3.50 | Rejeitado — curva |

## SSR — necessidade real

| Fator | Avaliação |
| --- | --- |
| SEO público | Baixa prioridade candidata — app operacional |
| Auth | Client-side + API; IdP futuro |
| Performance inicial | Vite code-splitting suficiente |
| Field/mobile | PWA **pendente** (TECH-DDP-003) |

**Conclusão:** SSR **não exigido** na seleção inicial. Next.js adiciona complexidade sem driver claro.

## React + Vite — justificativa

- SPA alinhada TOPO-002 (API separada)
- HMR rápido; build esbuild/rollup
- Compartilha tipos TS com packages monorepo
- React 19 estável para ecossistema componentes

## Next.js — rejeição

App Router, SSR/SSG, deploy específico — custo sem requisito NFR de SEO/SSR. Revisitar se TECH-DDP-001 fechar com necessidade SSR.

## PWA

**Pendente** — não bloqueia Vite; `vite-plugin-pwa` candidato futuro.

## Compatibilidade

SEC-REQ: UI não é boundary; projeções omitidas no API.
