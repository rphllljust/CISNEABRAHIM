# REQ-AC-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo de critérios de aceite |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |
| Total ACs | 52 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## AC-001 — FR-001

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que um ator autorizado candidato inicia registro de solicitação

**QUANDO** informa dados mínimos disponíveis

**ENTÃO** o sistema registra solicitação com identificador interno único

## AC-002 — FR-001

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que duas solicitações distintas são registradas

**QUANDO** consultadas por identificador

**ENTÃO** cada uma possui identificador interno diferente

## AC-003 — FR-002

**Status:** PENDING_BUSINESS_DECISION

**DADO** que origem e canal são informados na solicitação

**QUANDO** a solicitação é registrada

**ENTÃO** o sistema preserva origem e canal informados

## AC-004 — FR-003

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que solicitante candidato é informado

**QUANDO** a solicitação é registrada

**ENTÃO** o sistema associa solicitante à solicitação

## AC-005 — FR-004

**Status:** PENDING_BUSINESS_DECISION

**DADO** que política empresarial exige evidência na solicitação

**QUANDO** evidência é associada

**ENTÃO** o sistema vincula evidência documental à solicitação

## AC-006 — FR-005

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que existe solicitação registrada

**QUANDO** ator autorizado consulta processamento

**ENTÃO** o sistema apresenta estado de processamento candidato

## AC-007 — FR-006

**Status:** PENDING_BUSINESS_DECISION

**DADO** que ator autorizado candidato e solicitação elegível

**QUANDO** registra aprovação

**ENTÃO** o sistema registra decisão de aprovação com autoria

## AC-008 — FR-006

**Status:** PENDING_BUSINESS_DECISION

**DADO** que ator autorizado candidato e solicitação elegível

**QUANDO** registra rejeição

**ENTÃO** o sistema registra decisão de rejeição com autoria

## AC-009 — FR-007

**Status:** PENDING_BUSINESS_DECISION

**DADO** que solicitação é rejeitada e regra exige motivo

**QUANDO** motivo é informado

**ENTÃO** o sistema registra motivo associado à rejeição

## AC-010 — FR-008

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que solicitação já foi convertida em OS oficial

**QUANDO** ator tenta nova conversão da mesma solicitação

**ENTÃO** o sistema impede conversão duplicada

## AC-011 — FR-009

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que solicitação elegível e ator autorizado

**QUANDO** solicita conversão

**ENTÃO** o sistema cria OS vinculada à solicitação

## AC-012 — FR-009

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que ator sem autorização candidata

**QUANDO** tenta converter solicitação

**ENTÃO** o sistema impede conversão

## AC-013 — FR-010

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que ator autorizado candidato

**QUANDO** cria rascunho de OS

**ENTÃO** o sistema registra OS em rascunho sem liberar execução

## AC-014 — FR-011

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação

**QUANDO** ator registra conteúdo operacional

**ENTÃO** o sistema persiste conteúdo editável

## AC-015 — FR-011

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação com conteúdo existente

**QUANDO** ator altera conteúdo

**ENTÃO** o sistema atualiza conteúdo preservando histórico candidato

## AC-016 — FR-012

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação

**QUANDO** ator registra item planejado

**ENTÃO** o sistema associa item planejado à OS

## AC-017 — FR-013

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação

**QUANDO** ator planeja recursos necessários

**ENTÃO** o sistema registra tipos e quantidades planejadas

## AC-018 — FR-014

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS elegível e autorizador empresarial autorizado

**QUANDO** confirma liberação

**ENTÃO** o sistema registra liberação da OS

## AC-019 — FR-014

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS não elegível ou ator não autorizado

**QUANDO** tenta liberar OS

**ENTÃO** o sistema impede liberação

## AC-020 — FR-015

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS existente

**QUANDO** ator atribui responsável candidato

**ENTÃO** o sistema registra atribuição de responsável

## AC-021 — FR-016

**Status:** PENDING_BUSINESS_DECISION

**DADO** que regra empresarial exige confirmação de recebimento

**QUANDO** responsável confirma recebimento

**ENTÃO** o sistema registra confirmação com autoria e momento

## AC-022 — FR-017

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS liberada

**QUANDO** executor autorizado registra início

**ENTÃO** o sistema registra início de execução

## AC-023 — FR-018

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em execução

**QUANDO** executor registra progresso

**ENTÃO** o sistema registra realização parcial ou total candidata

## AC-024 — FR-019

**Status:** PENDING_BUSINESS_DECISION

**DADO** que OS elegível para conclusão

**QUANDO** ator autorizado registra conclusão

**ENTÃO** o sistema registra conclusão da OS

## AC-025 — FR-020

**Status:** PENDING_BUSINESS_DECISION

**DADO** que OS elegível e autorizador autorizado

**QUANDO** registra cancelamento

**ENTÃO** o sistema registra cancelamento com autoria

## AC-026 — FR-021

**Status:** PENDING_BUSINESS_DECISION

**DADO** que OS concluída e regra futura autoriza reabertura

**QUANDO** autorizador solicita reabertura

**ENTÃO** o sistema registra reabertura ou bloqueia por DDP-005

## AC-027 — FR-022

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que alterações relevantes ocorreram na OS

**QUANDO** ator consulta histórico

**ENTÃO** o sistema apresenta histórico preservado

## AC-028 — FR-023

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação

**QUANDO** ator planeja mão de obra

**ENTÃO** o sistema registra tipo e quantidade sem exigir pessoa executora definida

## AC-029 — FR-024

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS em preparação

**QUANDO** ator planeja equipamentos e veículos

**ENTÃO** o sistema registra tipos e quantidades planejadas

## AC-030 — FR-025

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que item planejado existente

**QUANDO** ator aloca ativo ou pessoa específica

**ENTÃO** o sistema registra alocação vinculada ao item

## AC-031 — FR-026

**Status:** PENDING_BUSINESS_DECISION

**DADO** que recurso alocado em execução

**QUANDO** ator registra substituição

**ENTÃO** o sistema registra substituição preservando histórico

## AC-032 — FR-027

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que quantidade efetiva difere da planejada

**QUANDO** ator registra quantidade utilizada

**ENTÃO** o sistema registra quantidade efetiva distinta

## AC-033 — FR-028

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que mesmo recurso candidato alocado simultaneamente

**QUANDO** alocação é registrada ou consultada

**ENTÃO** o sistema sinaliza possível conflito de alocação

## AC-034 — FR-029

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que referência comercial candidata informada

**QUANDO** associada à OS

**ENTÃO** o sistema vincula referência comercial à OS

## AC-035 — FR-030

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que identificador externo comercial informado

**QUANDO** persistido pelo sistema

**ENTÃO** o identificador externo permanece inalterado silenciosamente

## AC-036 — FR-031

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que item elegível com custo e preço

**QUANDO** valores são registrados

**ENTÃO** o sistema mantém distinção entre custo interno e preço comercial

## AC-037 — FR-032

**Status:** PENDING_BUSINESS_DECISION

**DADO** que ator autorizado candidato a custo

**QUANDO** consulta custo ou margem

**ENTÃO** o sistema permite visualização

## AC-038 — FR-032

**Status:** PENDING_BUSINESS_DECISION

**DADO** que ator não autorizado candidato

**QUANDO** tenta consultar custo ou margem

**ENTÃO** o sistema restringe visualização

## AC-039 — FR-033

**Status:** PENDING_BUSINESS_DECISION

**DADO** que PO vinculado à OS

**QUANDO** ator registra consumo candidato

**ENTÃO** o sistema registra saldo autorizado e consumo candidato

## AC-040 — FR-034

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que dados de pedido, execução e cobrança candidata divergem

**QUANDO** comparação é solicitada

**ENTÃO** o sistema identifica e registra divergência comercial

## AC-041 — FR-035

**Status:** PENDING_BUSINESS_DECISION

**DADO** que itens executados elegíveis com origem identificável

**QUANDO** ator prepara medição

**ENTÃO** o sistema registra medição preparada com origem

## AC-042 — FR-036

**Status:** PENDING_BUSINESS_DECISION

**DADO** que medição preparada

**QUANDO** ator submete para decisão

**ENTÃO** o sistema registra submissão candidata

## AC-043 — FR-037

**Status:** PENDING_BUSINESS_DECISION

**DADO** que medição submetida e autorizador autorizado

**QUANDO** registra aprovação ou rejeição

**ENTÃO** o sistema registra decisão sobre medição

## AC-044 — FR-038

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que item candidato a cobrança sem origem identificável

**QUANDO** tentativa de preparar cobrança

**ENTÃO** o sistema impede ou sinaliza ausência de origem

## AC-045 — FR-039

**Status:** PENDING_BUSINESS_DECISION

**DADO** que documento de faturamento ou nota informada externamente

**QUANDO** ator registra documento

**ENTÃO** o sistema registra documento sem presumir emissão fiscal interna

## AC-046 — FR-040

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que OS com itens em execução ou concluídos

**QUANDO** ator registra evidência

**ENTÃO** o sistema vincula evidência ao item de OS

## AC-047 — FR-041

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que necessidade de documento lógico

**QUANDO** ator registra documento

**ENTÃO** o sistema cria documento lógico com versão inicial

## AC-048 — FR-041

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que documento lógico existente

**QUANDO** ator adiciona nova versão

**ENTÃO** o sistema registra versão documental e arquivo associado

## AC-049 — FR-042

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que documento com versão vigente

**QUANDO** ator autorizado substitui documento

**ENTÃO** o sistema preserva versões anteriores

## AC-050 — FR-042

**Status:** PENDING_SOURCE_VALIDATION

**DADO** que ator sem necessidade empresarial de acesso

**QUANDO** tenta acessar documento restrito

**ENTÃO** o sistema impede acesso

## AC-051 — FR-022

**Status:** PENDING_BUSINESS_DECISION

**DADO** que eventos operacionais relevantes ocorreram

**QUANDO** consulta de relatório candidato é solicitada

**ENTÃO** o sistema apresenta dados agregados disponíveis sem inventar indicadores

## AC-052 — FR-005

**Status:** PENDING_BUSINESS_DECISION

**DADO** que solicitações em múltiplos estados candidatos

**QUANDO** visão agregada é consultada

**ENTÃO** o sistema não inventa faixas de aging nem SLAs
