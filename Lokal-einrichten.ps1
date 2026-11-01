$ErrorActionPreference = 'Stop'
try {
    Write-Host 'Lokale KI: keine externen KI-API-Gebuehren. Strom, Hardware und Internet fuer den Modelldownload bleiben notwendig.'
    Write-Host 'Das Startmodell qwen2.5:3b braucht ungefaehr 2 GB Download und ausreichend freien Arbeitsspeicher.'
    $ollama = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollama) {
        $installedPath = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
        if (-not (Test-Path -LiteralPath $installedPath)) { throw 'Ollama fehlt. Bitte selbst von https://ollama.com/download/windows installieren, danach dieses Skript erneut starten. Hier wird kein Installationsprogramm heruntergeladen oder ausgefuehrt.' }
    }
    $ollamaPath = if ($ollama) { $ollama.Source } else { Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe' }
    if (-not (Test-Path -LiteralPath $ollamaPath)) { throw 'Ollama-Pfad nicht gefunden. PowerShell neu oeffnen und Lokal-einrichten.cmd erneut starten.' }
    $running = $false
    try { $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2; $running = $true } catch {}
    if (-not $running) {
        Write-Host 'Oeffne sichtbares Ollama-Serverfenster. Zum lokalen Betrieb offen lassen.'
        Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Normal | Out-Null
    }
    for ($i = 0; $i -lt 30 -and -not $running; $i++) {
        Start-Sleep -Milliseconds 500
        try { $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2; $running = $true } catch {}
    }
    if (-not $running) { throw 'Ollama startet nicht. Bitte die Ollama-App im Windows-Startmenue oeffnen.' }
    if ((Read-Host 'Modell qwen2.5:3b jetzt herunterladen oder aktualisieren (ca. 2 GB)? Tippe JA') -cne 'JA') { throw 'Modelldownload abgebrochen.' }
    & $ollamaPath pull qwen2.5:3b
    if ($LASTEXITCODE -ne 0) { throw 'Modelldownload fehlgeschlagen. Bitte freien Speicherplatz und Internetverbindung pruefen.' }
    Write-Host 'Lokales Text-/Code-Startmodell eingerichtet. Im Chat Lokal waehlen. Es ist kein Bildmodell und kein unbegrenzter Ersatz fuer alle kommerziellen Modelle.'
    & (Join-Path $PSScriptRoot 'Start.ps1')
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
