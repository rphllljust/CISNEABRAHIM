# Scratch root for CISNE scripts and agent work.
# Always C:\CISNEABRAHIM\tmp or the repo tmp folder. Never Windows TEMP / user profile.
function Resolve-CisneTmpRoot {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)
  $root = if ($env:CISNE_TMP -and $env:CISNE_TMP.Trim()) {
    $env:CISNE_TMP.Trim()
  } else {
    Join-Path $RepoRoot 'tmp'
  }
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  return (Resolve-Path $root).Path
}
