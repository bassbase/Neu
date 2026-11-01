$ErrorActionPreference = 'Stop'
try {
    Write-Host 'Lokale KI: keine externen KI-API-Gebuehren. Strom, Hardware und Internet fuer den Modelldownload bleiben notwendig.'
    Write-Host 'Das Startmodell qwen2.5:3b braucht ungefaehr 2 GB Download und ausreichend freien Arbeitsspeicher.'
    $ollama = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollama) {
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Bitte Ollama von https://ollama.com/download/windows installieren und dieses Skript erneut starten.' }
        & winget install --id Ollama.Ollama --exact --source winget --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw 'Ollama-Installation nicht abgeschlossen. Bitte die Meldung oben pruefen.' }
    }
    $ollamaPath = if ($ollama) { $ollama.Source } else { Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe' }
    if (-not (Test-Path -LiteralPath $ollamaPath)) { throw 'Ollama-Pfad nicht gefunden. PowerShell neu oeffnen und Lokal-einrichten.cmd erneut starten.' }
    $running = $false
    try { $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2; $running = $true } catch {}
    if (-not $running) { Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden | Out-Null }
    for ($i = 0; $i -lt 30 -and -not $running; $i++) {
        Start-Sleep -Milliseconds 500
        try { $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2; $running = $true } catch {}
    }
    if (-not $running) { throw 'Ollama startet nicht. Bitte die Ollama-App im Windows-Startmenue oeffnen.' }
    & $ollamaPath pull qwen2.5:3b
    if ($LASTEXITCODE -ne 0) { throw 'Modelldownload fehlgeschlagen. Bitte freien Speicherplatz und Internetverbindung pruefen.' }
    Write-Host 'Lokales Text-/Code-Startmodell eingerichtet. Im Chat Lokal waehlen. Es ist kein Bildmodell und kein unbegrenzter Ersatz fuer alle kommerziellen Modelle.'
    & (Join-Path $PSScriptRoot 'Start.ps1')
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
