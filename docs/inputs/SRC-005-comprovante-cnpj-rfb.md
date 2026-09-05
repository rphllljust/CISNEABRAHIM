# SRC-005 — Comprovante de inscrição e situação cadastral no CNPJ

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-005 |
| Título | Comprovante de Inscrição e de Situação Cadastral — CNPJ |
| Tipo | `PUBLIC_REGISTRY_EXTRACT_COPY` · cadastro federal |
| Origem declarada no documento | Receita Federal do Brasil — Cadastro Nacional da Pessoa Jurídica |
| Entregue por | Responsável pelo projeto, como arquivo PDF local |
| Empresa relacionada | CISNE RONDONIA COMERCIO E SERVICOS LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T01:46:52-04:00 |
| Location | `docs/inputs/SRC-005-comprovante-cnpj-rfb.md` (registro e transcrição controlada) |
| Nome do original | `monica cnpj.pdf` |
| Custódia do original | Arquivo fornecido fora do repositório; não copiado enquanto DDP-019 permanecer `OPEN` |
| Integridade | SHA-256 `BBCC3A6C7772C5568B55A6360D903BD6D096202482DD67517D6819CB7338C27B`; 156230 bytes; 3 páginas |
| Emissão declarada | 03/09/2026 às 02:16:20 (horário de Brasília) |
| Status | `ANALYZED` |
| Confiabilidade | Alta para os fatos cadastrais exibidos; autenticidade do arquivo não reconsultada on-line |
| Personal / sensitive data | **Sim** — e-mail e telefone comerciais; retenção permanece `OPEN` (DDP-019) |
| Pode confirmar regra operacional isoladamente? | **Não** — confirma fatos cadastrais, não fluxo, tributação ou autorização de emissão |

## 2. Fatos cadastrais extraídos

| Localizador | Campo | Valor exibido | Classificação |
| ----------- | ----- | ------------- | ------------- |
| páginas 1–3 | CNPJ / tipo | 11.897.171/0001-81 · MATRIZ | Fato cadastral no extrato fornecido |
| páginas 1–3 | Nome empresarial | CISNE RONDONIA COMERCIO E SERVICOS LTDA | Fato cadastral no extrato fornecido |
| página 1 | Data de abertura | 05/05/2010 | Fato cadastral no extrato fornecido |
| página 1 | Porte | EPP | Porte cadastral; **não** é regime tributário |
| página 1 | Natureza jurídica | 206-2 — Sociedade Empresária Limitada | Fato cadastral no extrato fornecido |
| página 1 | Atividade principal | 46.19-2-00 — Representantes comerciais e agentes do comércio de mercadorias em geral não especializado | Classificação CNAE; não define workflow |
| páginas 1–3 | Atividades secundárias | 48 CNAEs | Classificações CNAE; não definem escopo de produto |
| páginas 1–3 | Endereço | R DOS FARRAPOS, 5000, SAO FRANCISCO, PORTO VELHO/RO, CEP 76.813-284 | Fato cadastral no extrato fornecido |
| páginas 1–3 | E-mail / telefone | CISNELTDA@HOTMAIL.COM · (69) 9976-7888 | Contato comercial + dado pessoal |
| páginas 1–3 | Situação cadastral | ATIVA desde 05/05/2010 | Snapshot cadastral na data de emissão |

## 3. CNAEs exibidos

O documento contém 1 CNAE principal e 48 secundários. Códigos secundários, na ordem das páginas:

```text
25.39-0-01, 28.69-1-00, 33.21-0-00, 38.11-4-00, 41.20-4-00,
42.11-1-01, 42.11-1-02, 42.12-0-00, 42.13-8-00, 42.22-7-01,
43.11-8-01, 43.11-8-02, 43.13-4-00, 43.19-3-00, 43.21-5-00,
43.22-3-01, 43.30-4-04, 43.91-6-00, 43.99-1-04, 43.99-1-05,
43.99-1-99, 45.11-1-01, 45.11-1-02, 45.11-1-04, 45.11-1-06,
45.12-9-01, 45.12-9-02, 45.30-7-05, 45.30-7-06, 45.41-2-01,
45.41-2-02, 45.41-2-03, 45.42-1-01, 46.69-9-99, 46.79-6-04,
46.79-6-99, 47.44-0-99, 49.23-0-02, 49.29-9-02, 49.30-2-01,
49.30-2-02, 50.30-1-01, 77.11-0-00, 77.32-2-01, 77.39-0-99,
78.10-8-00, 81.11-7-00, 81.30-3-00
```

Interpretação de engenharia: o conjunto de 49 CNAEs coincide com a baseline já existente em `packages/database/src/catalog/cisne-service-portfolio-data.ts`. Essa coincidência valida a referência legal do catálogo; não confirma preços, impostos, regras de execução nem escopo de release.

## 4. Limites da evidência

- A impressão tem cabeçalho `about:blank` e não contém código de autenticação visível; o hash prova integridade do arquivo recebido, não consulta independente ao órgão.
- Campos mascarados ou vazios não foram interpretados como inexistentes.
- O documento não informa inscrição estadual ou municipal, certificado digital, credencial de gateway, alíquota, CFOP, NCM, código de serviço, retenções ou tipo legal a emitir.
- Não autoriza NF-e, NFS-e, ativação de `FEATURE_MODULE_FISCAL`, exit do piloto ou go-live.

