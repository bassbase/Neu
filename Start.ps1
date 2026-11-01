param([switch]$Claude)
$ErrorActionPreference = 'Stop'
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js fehlt. Bitte zuerst Node.js 22 installieren und das Fenster neu oeffnen.' }
    $major = [int]((& node --version) -replace '^v(\d+).*$', '$1')
    if ($major -lt 22 -or $major -ge 25) { throw 'Bitte Node.js 22 oder 24 verwenden.' }
    $gatewayRoot = Join-Path $env:USERPROFILE 'FreeLLMAPI'
    function Test-Gateway {
        try { return ((Invoke-RestMethod 'http://127.0.0.1:3001/livez' -TimeoutSec 2).status -eq 'ok') } catch { return $false }
    }
    function Start-NodeWindow([string]$Directory, [string]$Script) {
        $safeDir = $Directory.Replace("'", "''")
        $safeScript = $Script.Replace("'", "''")
        $command = "Set-Location -LiteralPath '$safeDir'; & node '$safeScript'"
        # Use an encoded PowerShell command to handle spaces, umlauts and quotes in paths.
        $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
        Start-Process powershell.exe -ArgumentList '-NoProfile', '-NoExit', '-EncodedCommand', $encoded | Out-Null
    }
    if (-not (Test-Gateway)) {
        $server = Join-Path $gatewayRoot 'server\dist\index.js'
        if (-not (Test-Path $server)) { throw "FreeLLMAPI fehlt unter $gatewayRoot. Bitte die vorhandene Installation dorthin legen oder gatewayRoot in Start.ps1 anpassen." }
        Write-Host 'Starte FreeLLMAPI ...'
        Start-NodeWindow $gatewayRoot $server
        for ($i = 0; $i -lt 30 -and -not (Test-Gateway); $i++) { Start-Sleep -Milliseconds 500 }
        if (-not (Test-Gateway)) { throw 'FreeLLMAPI startet nicht. Bitte die Fehlermeldung im neuen Fenster pruefen.' }
    }
    if ($Claude) {
        if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { throw 'Claude Code fehlt. Installieren mit: npm.cmd install -g @anthropic-ai/claude-code@2.1.316' }
        $projects = Join-Path $env:USERPROFILE 'Claude-Projekte'
        New-Item -ItemType Directory -Force $projects | Out-Null
        Set-Location -LiteralPath $projects
        Write-Host 'Zentralen FreeLLMAPI-Schluessel bereithalten. Die Eingabe bleibt verborgen.'
        & node (Join-Path $gatewayRoot 'cli\dist\index.js') launch --model auto
        exit $LASTEXITCODE
    }
    $running = $false
    try { $running = (Invoke-WebRequest 'http://127.0.0.1:3210' -UseBasicParsing -TimeoutSec 2).Content.Contains('Neu') } catch {}
    if (-not $running) {
        Write-Host 'Starte deinen Chat ...'
        Start-NodeWindow $PSScriptRoot (Join-Path $PSScriptRoot 'server.mjs')
        for ($i = 0; $i -lt 30; $i++) {
            try {
                if ((Invoke-WebRequest 'http://127.0.0.1:3210' -UseBasicParsing -TimeoutSec 2).Content.Contains('Neu')) { $running = $true; break }
            } catch {}
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $running) { throw 'Der Chat startet nicht. Bitte die Fehlermeldung im neuen Fenster pruefen.' }
    Start-Process 'http://127.0.0.1:3210'
    Write-Host 'Chat geoeffnet. Die Serverfenster bitte offen lassen.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
