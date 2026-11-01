$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'Background.ps1')
    $failed = $false
    foreach ($name in @('chat', 'gateway')) {
        try { Stop-NeuBackground $name }
        catch { Write-Host $_.Exception.Message -ForegroundColor Red; $failed = $true }
    }
    if ($failed) { exit 1 }
    Write-Host 'Eigene registrierte Dienste beendet. Manuell gestartete Dienste und Ollama bleiben unberuehrt.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
