# Requires: docker compose (v5+) and git on PATH.
# Prova/build de HML exclusivamente a partir de um COMMIT aprovado:
# cria uma worktree DETACHED limpa no commit informado (nenhum arquivo não
# commitado da árvore de trabalho entra no contexto), copia .env.hml (não
# versionado, usado apenas para interpolação/env do container) e executa
# docker compose build api web com esse contexto.
#
# Falha com rc != 0 quando o commit NÃO é autocontido (ex.: arquivos que ele
# referencia só existem como WIP não commitado) — nesse caso o deploy NÃO é
# feito, evitando incorporar acidentalmente trabalho não aprovado.
param(
  [Parameter(Mandatory = $true)][string]$Commit,
  [switch]$Deploy
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $repo '.env.hml'
if (-not (Test-Path $envFile)) { throw ".env.hml not found at $envFile" }

$commit = git -C $repo rev-parse --verify "$Commit^{commit}"
if ($LASTEXITCODE -ne 0) { throw "invalid commit: $Commit" }

$wt = Join-Path $env:TEMP ('cisne-approval-' + $commit.Substring(0, 12))
if (Test-Path $wt) { git -C $repo worktree remove --force $wt | Out-Null }

Write-Host "== clean detached worktree at $commit =="
git -C $repo worktree add --detach $wt $commit | Out-Null
try {
  Copy-Item $envFile (Join-Path $wt '.env.hml') -Force

  if ($Deploy) {
    Write-Host '== build + deploy hml api/web from clean worktree =='
    docker compose -f (Join-Path $wt 'docker\hml\compose.yaml') --env-file $envFile up -d --build
  } else {
    Write-Host '== build hml api/web from clean worktree (no deploy) =='
    docker compose -f (Join-Path $wt 'docker\hml\compose.yaml') --env-file $envFile build api web
  }
  $rc = $LASTEXITCODE
  Write-Host "build-exit=$rc"
  if ($rc -ne 0) {
    Write-Host 'FALHA: o commit aprovado nao e autocontido para o build (ou erro de imagem). Nada foi deployado.'
  }
  exit $rc
} finally {
  git -C $repo worktree remove --force $wt | Out-Null
}
