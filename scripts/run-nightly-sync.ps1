$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
$logFile = Join-Path $logDir 'sync-products.log'

if (-not (Test-Path $logDir)) {
  New-Item -Path $logDir -ItemType Directory | Out-Null
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
"[$timestamp] Nightly catalog sync started" | Out-File -FilePath $logFile -Append -Encoding utf8

Push-Location $repoRoot
try {
  npm run sync:products 2>&1 | Tee-Object -FilePath $logFile -Append

  $done = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  "[$done] Nightly catalog sync completed" | Out-File -FilePath $logFile -Append -Encoding utf8
} catch {
  $failed = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  "[$failed] Nightly catalog sync failed: $($_.Exception.Message)" | Out-File -FilePath $logFile -Append -Encoding utf8
  throw
} finally {
  Pop-Location
}
