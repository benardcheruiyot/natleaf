$ErrorActionPreference = 'Stop'

$repoRoot = 'C:\Users\bcher\Desktop\cannabis'
Set-Location $repoRoot

$bashCandidates = @(
    'C:\Program Files\Git\bin\bash.exe',
    'C:\Program Files\Git\usr\bin\bash.exe',
    'C:\Program Files\Git\bin\sh.exe',
    'C:\Program Files\Git\bin\bash'
)

$bashPath = $null
foreach ($candidate in $bashCandidates) {
    if (Test-Path $candidate) {
        $bashPath = $candidate
        break
    }
}

if (-not $bashPath) {
    Write-Host ''
    Write-Host 'Git Bash was not found on this machine.' -ForegroundColor Yellow
    Write-Host 'Install Git for Windows, then run this script again.' -ForegroundColor Yellow
    Write-Host 'Download: https://git-scm.com/download/win' -ForegroundColor Cyan
    exit 1
}

$keyPath = Join-Path $HOME '.ssh\id_ed25519'
if (-not (Test-Path $keyPath)) {
    Write-Host "SSH key not found at $keyPath" -ForegroundColor Red
    exit 1
}

# Ensure Unix permissions are correct when run through Git Bash.
# Inject the actual SSH private key directly so the script does not fail early.
$keyText = (Get-Content $keyPath -Raw).Replace("`r`n", "\n").Replace("`n", "\n")
& $bashPath -lc "mkdir -p ~/.ssh && chmod 700 ~/.ssh && if [ -f ~/.ssh/id_ed25519 ]; then chmod 600 ~/.ssh/id_ed25519; fi && cd /c/Users/bcher/Desktop/cannabis && SSH_PRIVATE_KEY='${keyText}' SSH_USER=root INTERSERVER_HOST=153.75.247.188 ./scripts/deploy-server.sh 153.75.247.188"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Deployment failed.' -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host 'Deployment finished successfully.' -ForegroundColor Green
