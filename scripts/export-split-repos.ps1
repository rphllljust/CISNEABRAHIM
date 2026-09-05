# Export monorepo into cisne-backend, cisne-frontend, cisne-infra (standalone repos)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\resolve-cisne-tmp.ps1')
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'pnpm-workspace.yaml'))) {
  throw "Monorepo root not found near script ($Root). Run from a checkout that contains pnpm-workspace.yaml."
}

$Templates = Join-Path $PSScriptRoot 'split-repos\templates'
$SplitScripts = Join-Path $PSScriptRoot 'split-repos'

function Copy-Tree {
  param([string]$Source, [string]$Dest)
  if (-not (Test-Path $Source)) { return }
  New-Item -ItemType Directory -Force -Path $Dest | Out-Null
  robocopy $Source $Dest /E /NFL /NDL /NJH /NJS /nc /ns /np `
    /XD node_modules dist .turbo .backup playwright-report test-results coverage .object-storage-test .object-storage-e2e .object-storage-hml `
    | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $Source -> $Dest (exit $LASTEXITCODE)" }
}

function Backup-RepoMeta {
  param([string]$RepoName)
  $src = Join-Path $Root $RepoName
  $dest = Join-Path (Resolve-CisneTmpRoot -RepoRoot $Root) "cisne-export-meta\$RepoName"
  if (-not (Test-Path $src)) { return $null }
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  foreach ($f in @('package.json', 'pnpm-workspace.yaml', 'README.md', '.gitignore', '.env.example', 'Dockerfile', 'pnpm-lock.yaml')) {
    $file = Join-Path $src $f
    if (Test-Path $file) { Copy-Item $file (Join-Path $dest $f) }
  }
  $gh = Join-Path $src '.github'
  if (Test-Path $gh) { Copy-Tree $gh (Join-Path $dest '.github') }
  $docker = Join-Path $src 'docker'
  if (Test-Path $docker) { Copy-Tree $docker (Join-Path $dest 'docker') }
  return $dest
}

function Restore-RepoMeta {
  param([string]$RepoPath, [string]$BackupPath)
  if (-not $BackupPath -or -not (Test-Path $BackupPath)) { return }
  Get-ChildItem $BackupPath -Force | ForEach-Object {
    $target = Join-Path $RepoPath $_.Name
    if ($_.PSIsContainer) { Copy-Tree $_.FullName $target }
    else { Copy-Item $_.FullName $target -Force }
  }
}

$Backend = Join-Path $Root 'cisne-backend'
$Frontend = Join-Path $Root 'cisne-frontend'
$Infra = Join-Path $Root 'cisne-infra'

$BackendMeta = Backup-RepoMeta 'cisne-backend'
$FrontendMeta = Backup-RepoMeta 'cisne-frontend'
$InfraMeta = Backup-RepoMeta 'cisne-infra'

foreach ($d in @($Backend, $Frontend, $Infra)) {
  if (Test-Path $d) { Remove-Item -Recurse -Force $d }
}

# --- cisne-backend ---
New-Item -ItemType Directory -Force -Path $Backend | Out-Null
Restore-RepoMeta $Backend $BackendMeta
Copy-Tree (Join-Path $Root 'apps\api') (Join-Path $Backend 'apps\api')
Copy-Tree (Join-Path $Root 'packages\database') (Join-Path $Backend 'packages\database')
Copy-Tree (Join-Path $Root 'packages\eslint-config') (Join-Path $Backend 'packages\eslint-config')
Copy-Tree (Join-Path $Root 'packages\tsconfig') (Join-Path $Backend 'packages\tsconfig')
New-Item -ItemType Directory -Force -Path (Join-Path $Backend 'scripts') | Out-Null
foreach ($s in @('wait-for-postgres.mjs', 'migrate-test-database.mjs', 'run-drizzle-migrate.mjs', 'sync-drizzle-journal.mjs', 'ci-emit-build-metadata.mjs')) {
  $src = Join-Path $Root "scripts\$s"
  if (Test-Path $src) { Copy-Item $src (Join-Path $Backend "scripts\$s") -Force }
}
if (Test-Path (Join-Path $Root 'scripts\lib')) {
  Copy-Tree (Join-Path $Root 'scripts\lib') (Join-Path $Backend 'scripts\lib')
}
Copy-Item (Join-Path $Root '.node-version') (Join-Path $Backend '.node-version') -Force
if (Test-Path (Join-Path $Root 'turbo.json')) {
  Copy-Item (Join-Path $Root 'turbo.json') (Join-Path $Backend 'turbo.json') -Force
}
Copy-Item (Join-Path $Root 'pnpm-lock.yaml') (Join-Path $Backend 'pnpm-lock.yaml') -Force
Copy-Item (Join-Path $Templates 'Dockerfile.backend') (Join-Path $Backend 'Dockerfile') -Force

# --- cisne-frontend ---
New-Item -ItemType Directory -Force -Path $Frontend | Out-Null
Restore-RepoMeta $Frontend $FrontendMeta
Copy-Tree (Join-Path $Root 'apps\web\src') (Join-Path $Frontend 'src')
if (Test-Path (Join-Path $Root 'apps\web\e2e')) {
  Copy-Tree (Join-Path $Root 'apps\web\e2e') (Join-Path $Frontend 'e2e')
}
foreach ($f in @('index.html', 'vite.config.ts', 'playwright.config.ts', 'eslint.config.mjs', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.e2e.json')) {
  Copy-Item (Join-Path $Root "apps\web\$f") (Join-Path $Frontend $f) -Force
}
Copy-Tree (Join-Path $Root 'packages\eslint-config') (Join-Path $Frontend 'packages\eslint-config')
Copy-Tree (Join-Path $Root 'packages\tsconfig') (Join-Path $Frontend 'packages\tsconfig')
Copy-Item (Join-Path $Root '.node-version') (Join-Path $Frontend '.node-version') -Force
Copy-Item (Join-Path $Root 'pnpm-lock.yaml') (Join-Path $Frontend 'pnpm-lock.yaml') -Force
New-Item -ItemType Directory -Force -Path (Join-Path $Frontend 'docker') | Out-Null
Copy-Item (Join-Path $Templates 'Dockerfile.frontend') (Join-Path $Frontend 'Dockerfile') -Force
Copy-Item (Join-Path $Templates 'nginx.conf') (Join-Path $Frontend 'docker\nginx.conf') -Force

# --- cisne-infra ---
New-Item -ItemType Directory -Force -Path $Infra | Out-Null
Restore-RepoMeta $Infra $InfraMeta
Copy-Tree (Join-Path $Root 'docker') (Join-Path $Infra 'docker')
New-Item -ItemType Directory -Force -Path (Join-Path $Infra 'scripts\hml') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Infra 'scripts\split-repos') | Out-Null
Copy-Item (Join-Path $SplitScripts 'resolve-repo-paths.mjs') (Join-Path $Infra 'scripts\split-repos\resolve-repo-paths.mjs') -Force
Copy-Item (Join-Path $Templates 'infra-hml-deploy.mjs') (Join-Path $Infra 'scripts\hml\deploy.mjs') -Force
Copy-Item (Join-Path $Templates 'infra-hml-smoke.mjs') (Join-Path $Infra 'scripts\hml\smoke.mjs') -Force
Copy-Item (Join-Path $Templates 'infra-hml-bootstrap-synthetic.mjs') (Join-Path $Infra 'scripts\hml\bootstrap-synthetic.mjs') -Force
foreach ($dir in @('cd', 'prod', 'pilot', 'release', 'readiness', 'uat')) {
  $srcDir = Join-Path $Root "scripts\$dir"
  if (Test-Path $srcDir) { Copy-Tree $srcDir (Join-Path $Infra "scripts\$dir") }
}
foreach ($s in @('wait-for-postgres.mjs', 'validate-src-002-gate.mjs')) {
  Copy-Item (Join-Path $Root "scripts\$s") (Join-Path $Infra "scripts\$s") -Force
}
Copy-Item (Join-Path $Templates 'env.hml.example') (Join-Path $Infra '.env.hml.example') -Force
Copy-Item (Join-Path $Templates 'cisne-infra.package.json') (Join-Path $Infra 'package.json') -Force

Write-Host "Regenerating lockfiles in split repos..."
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
Push-Location $Frontend
& corepack pnpm install --lockfile-only 2>&1 | Out-Null
$frontendLockExit = $LASTEXITCODE
Pop-Location
Push-Location $Backend
& corepack pnpm install --lockfile-only 2>&1 | Out-Null
$backendLockExit = $LASTEXITCODE
Pop-Location
$ErrorActionPreference = $prevEap
if ($frontendLockExit -ne 0) { throw "pnpm lockfile refresh failed for cisne-frontend (exit $frontendLockExit)" }
if ($backendLockExit -ne 0) { throw "pnpm lockfile refresh failed for cisne-backend (exit $backendLockExit)" }

Write-Host "Export directories created at:"
Write-Host "  $Backend"
Write-Host "  $Frontend"
Write-Host "  $Infra"
Write-Host ""
Write-Host "HML (split repos, sibling layout):"
Write-Host "  cd cisne-infra"
Write-Host "  cp .env.hml.example .env.hml"
Write-Host "  npm run hml:up && npm run hml:deploy && npm run hml:smoke"
