param(
  [string]$TaskName = 'GreenstoneCatalogNightlySync',
  [string]$StartTime = '02:15'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runnerPath = Join-Path $PSScriptRoot 'run-nightly-sync.ps1'

if (-not (Test-Path $runnerPath)) {
  throw "Runner script not found: $runnerPath"
}

$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`""

schtasks.exe /Create /F /SC DAILY /ST $StartTime /TN $TaskName /TR $taskCommand | Out-Null

Write-Host "Installed nightly sync task '$TaskName' at $StartTime"
Write-Host "Task command: $taskCommand"
Write-Host "Log file: $(Join-Path $repoRoot 'logs\sync-products.log')"
