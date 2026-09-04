Set-Location "C:\Users\bcher\Desktop\cannabis\frontend"
$env:PUPPETEER_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
Write-Output "Using PUPPETEER_EXECUTABLE_PATH=$env:PUPPETEER_EXECUTABLE_PATH"
npx --yes pa11y http://localhost:5173 --standard WCAG2AA --timeout 30000 --runner puppeteer
