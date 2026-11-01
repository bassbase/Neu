param([switch]$Claude)
$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'Background.ps1')
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js fehlt. Bitte zuerst Node.js 22 installieren und das Fenster neu oeffnen.' }
    $major = [int]((& node --version) -replace '^v(\d+).*$', '$1')
    if ($major -lt 22 -or $major -ge 25) { throw 'Bitte Node.js 22 oder 24 verwenden.' }
    $gatewayRoot = Join-Path $env:USERPROFILE 'FreeLLMAPI'
    function Test-Gateway {
        try { return ((Invoke-RestMethod 'http://127.0.0.1:3001/livez' -TimeoutSec 2).status -eq 'ok') } catch { return $false }
    }
    if (-not (Test-Gateway)) {
        $server = Join-Path $gatewayRoot 'server\dist\index.js'
        if (-not (Test-Path $server)) { throw "FreeLLMAPI fehlt unter $gatewayRoot. Bitte die vorhandene Installation dorthin legen oder gatewayRoot in Start.ps1 anpassen." }
        Write-Host 'Starte FreeLLMAPI ...'
        Start-NeuBackground 'gateway' $gatewayRoot $server
        for ($i = 0; $i -lt 30 -and -not (Test-Gateway); $i++) { Start-Sleep -Milliseconds 500 }
        if (-not (Test-Gateway)) { throw 'FreeLLMAPI startet nicht. Protokolle unter %LOCALAPPDATA%\NeuChat\logs pruefen.' }
    }
    if ($Claude) {
        if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { throw 'Claude Code fehlt. Installieren mit: npm.cmd install -g @anthropic-ai/claude-code@2.1.316' }
        $projects = Join-Path $env:USERPROFILE 'Claude-Projekte'
        New-Item -ItemType Directory -Force $projects | Out-Null
        Set-Location -LiteralPath $projects
        $previousApiKey = $env:FREELLMAPI_API_KEY
        try {
            $keyFile = Join-Path (Get-NeuStateDirectory) 'gateway.json'
            if (-not $env:FREELLMAPI_API_KEY -and (Test-Path -LiteralPath $keyFile)) {
                $connection = Get-Content -Raw -LiteralPath $keyFile | ConvertFrom-Json
                if ($connection.key -is [string] -and $connection.key.Length -ge 8) {
                    $env:FREELLMAPI_API_KEY = $connection.key
                }
            }
            if (-not $env:FREELLMAPI_API_KEY) { Write-Host 'Zentralen FreeLLMAPI-Schluessel bereithalten. Die Eingabe bleibt verborgen.' }
            & node (Join-Path $gatewayRoot 'cli\dist\index.js') launch --url 'http://127.0.0.1:3001' --model auto
            $claudeExitCode = $LASTEXITCODE
        } finally { $env:FREELLMAPI_API_KEY = $previousApiKey }
        exit $claudeExitCode
    }
    $running = $false
    try { $running = (Invoke-WebRequest 'http://127.0.0.1:3210' -UseBasicParsing -TimeoutSec 2).Content.Contains('Neu') } catch {}
    if (-not $running) {
        Write-Host 'Starte deinen Chat ...'
        Start-NeuBackground 'chat' $PSScriptRoot (Join-Path $PSScriptRoot 'server.mjs')
        for ($i = 0; $i -lt 30; $i++) {
            try {
                if ((Invoke-WebRequest 'http://127.0.0.1:3210' -UseBasicParsing -TimeoutSec 2).Content.Contains('Neu')) { $running = $true; break }
            } catch {}
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $running) { throw 'Der Chat startet nicht. Protokolle unter %LOCALAPPDATA%\NeuChat\logs pruefen.' }
    Start-Process 'http://127.0.0.1:3210'
    Write-Host 'Chat geoeffnet. Die Dienste laufen im Hintergrund. Zum Beenden Stop.cmd verwenden.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
