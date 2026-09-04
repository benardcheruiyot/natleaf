param(
  [string]$TaskName = 'GreenstoneCatalogNightlySync'
)

$ErrorActionPreference = 'Stop'

schtasks.exe /Delete /F /TN $TaskName | Out-Null
Write-Host "Removed nightly sync task '$TaskName'"
