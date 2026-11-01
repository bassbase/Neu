param([switch]$Claude, [switch]$GatewayOnly)
$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'Background.ps1')
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js fehlt. Bitte zuerst Node.js 22 installieren und das Fenster neu oeffnen.' }
    $major = [int]((& node --version) -replace '^v(\d+).*$', '$1')
    if ($major -lt 22 -or $major -ge 25) { throw 'Bitte Node.js 22 oder 24 verwenden.' }
    if (-not $Claude -and -not $GatewayOnly) {
        $lockHash = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'package-lock.json') -Algorithm SHA256).Hash
        $stampFile = Join-Path $PSScriptRoot 'node_modules\.neu-lock-hash'
        $installedHash = if (Test-Path -LiteralPath $stampFile) { (Get-Content -Raw -LiteralPath $stampFile).Trim() } else { '' }
        if ($installedHash -ne $lockHash) {
            Write-Host 'Die im package-lock.json festgelegten npm-Pakete fehlen oder wurden geaendert.'
            Write-Host 'npm ci laedt Pakete und fuehrt deren Installationsskripte aus, unter anderem fuer FFmpeg und Bildverarbeitung.'
            if ((Read-Host 'Diese Abhaengigkeiten jetzt installieren? Tippe JA zum Bestaetigen') -cne 'JA') { throw 'Installation abgebrochen. Es wurden keine Pakete installiert.' }
            Write-Host 'Installiere Dateiverarbeitung und Videowerkzeug. Beim ersten Start kann das einige Minuten dauern ...'
            Push-Location -LiteralPath $PSScriptRoot
            try {
                & npm.cmd ci --omit=dev --no-audit --no-fund
                if ($LASTEXITCODE -ne 0) { throw 'Installation fehlgeschlagen. Bitte die Meldung oben pruefen.' }
                Set-Content -LiteralPath $stampFile -Value $lockHash -Encoding ASCII
            } finally { Pop-Location }
        }
    }
    $gatewayRoot = Join-Path $env:USERPROFILE 'FreeLLMAPI'
    function Test-Gateway {
        try { return ((Invoke-RestMethod 'http://127.0.0.1:3001/livez' -TimeoutSec 2).status -eq 'ok') } catch { return $false }
    }
    if (($Claude -or $GatewayOnly) -and -not (Test-Gateway)) {
        $server = Join-Path $gatewayRoot 'server\dist\index.js'
        if (-not (Test-Path $server)) { throw "FreeLLMAPI fehlt unter $gatewayRoot. Bitte die vorhandene Installation dorthin legen oder gatewayRoot in Start.ps1 anpassen." }
        Write-Host 'Starte FreeLLMAPI ...'
        Start-NeuBackground 'gateway' $gatewayRoot $server
        for ($i = 0; $i -lt 30 -and -not (Test-Gateway); $i++) { Start-Sleep -Milliseconds 500 }
        if (-not (Test-Gateway)) { throw 'FreeLLMAPI startet nicht. Bitte die Meldung im sichtbaren Gateway-Fenster pruefen.' }
    }
    if ($GatewayOnly) { Write-Host 'FreeLLMAPI bereit. Im Browser bewusst FreeLLMAPI waehlen; Anbietertarife gelten.'; exit 0 }
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
    $expected = (& node (Join-Path $PSScriptRoot 'runtime-info.mjs')) | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or -not $expected.build) { throw 'Projektdateien sind unvollstaendig. Bitte die neue ZIP komplett entpacken.' }
    function Test-CurrentChat {
        try {
            $health = Invoke-RestMethod 'http://127.0.0.1:3210/healthz' -TimeoutSec 2
            return ($health.app -eq 'neu-chat' -and $health.build -eq $expected.build)
        } catch { return $false }
    }
    $running = Test-CurrentChat
    if (-not $running) {
        # Only a process recorded by our starter may be stopped automatically.
        Stop-NeuBackground 'chat'
        $occupied = Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue
        if ($occupied) { throw 'Auf Port 3210 laeuft noch eine alte oder manuell gestartete App. In deren PowerShell-Fenster Strg+C druecken; danach diesen neuen Starter erneut oeffnen. Keine fremden Programme werden beendet.' }
    }
    if (-not $running) {
        Write-Host 'Starte deinen Chat ...'
        Start-NeuBackground 'chat' $PSScriptRoot (Join-Path $PSScriptRoot 'server.mjs')
        for ($i = 0; $i -lt 30; $i++) {
            try {
                if (Test-CurrentChat) { $running = $true; break }
            } catch {}
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $running) { throw 'Der Chat startet nicht. Bitte die Meldung im sichtbaren Chat-Serverfenster pruefen.' }
    Start-Process 'http://127.0.0.1:3210'
    Write-Host 'Chat geoeffnet. Das sichtbare Serverfenster offen lassen. Zum Beenden dort Strg+C oder Stop.cmd verwenden.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
