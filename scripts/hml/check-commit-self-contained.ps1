# Self-containment probe for an approved commit.
# Checks that every RELATIVE import present in the committed source of <Commit>
# resolves to a file that is ALSO part of that commit. Files referenced only by
# uncommitted work (WIP) are reported as MISSING — those commits cannot be built
# from a clean checkout, and deploying them would silently incorporate WIP.
# Exit code: 0 when fully self-contained; 1 when missing references are found.
param(
  [string]$Commit = 'HEAD'
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$commit = git -C $repo rev-parse --verify "$Commit^{commit}"
if ($LASTEXITCODE -ne 0) { throw "invalid commit: $Commit" }

$tmp = Join-Path $env:TEMP ('cisne-selfcheck-' + $commit.Substring(0, 12))
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host "== git archive $commit =="
  $archive = Join-Path $tmp 'tree.tar'
  git -C $repo archive --format=tar --output=$archive $commit
  if ($LASTEXITCODE -ne 0) { throw 'git archive failed' }
  tar -xf $archive -C $tmp
  if ($LASTEXITCODE -ne 0) { throw 'tar extraction failed' }
  Remove-Item $archive -Force

  $sourceFiles = Get-ChildItem -Path $tmp -Recurse -File |
    Where-Object { $_.Extension -in '.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx' }

  $importPattern = [regex]'(?:from\s+|import\s*\()\s*[''"]((?:\.{1,2})/[^''"]+)[''"]'
  $missing = @()

  foreach ($file in $sourceFiles) {
    $relative = $file.FullName.Substring($tmp.Length).TrimStart('\', '/')
    $text = Get-Content -Path $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $text) { continue }
    foreach ($match in $importPattern.Matches($text)) {
      $spec = $match.Groups[1].Value
      if ($spec -like '*.css' -or $spec -like '*.scss' -or $spec -like '*.json') { continue }
      $dir = Split-Path -Parent $file.FullName
      $resolvedBase = [System.IO.Path]::GetFullPath((Join-Path $dir ($spec -replace '/', '\')))
      $candidates = @($resolvedBase)
      foreach ($ext in @('.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx')) {
        $candidates += $resolvedBase + $ext
      }
      $candidates += (Join-Path $resolvedBase 'index.ts')
      $candidates += (Join-Path $resolvedBase 'index.tsx')
      $found = $candidates | Where-Object { Test-Path $_ -PathType Leaf } | Select-Object -First 1
      if (-not $found) {
        $missing += "$relative -> $spec"
      }
    }
  }

  $missing = $missing | Sort-Object -Unique
  if ($missing.Count -eq 0) {
    Write-Host 'SELF-CONTAINED: every relative import of the commit resolves inside the commit.'
    exit 0
  }
  Write-Host "NOT SELF-CONTAINED: $($missing.Count) import(s) resolve only to files outside commit $commit (WIP):"
  $missing | ForEach-Object { Write-Host "  $_" }
  exit 1
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
