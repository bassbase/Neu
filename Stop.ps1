$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'Background.ps1')
    $failed = $false
    foreach ($name in @('chat', 'gateway')) {
        try { Stop-NeuBackground $name }
        catch { Write-Host $_.Exception.Message -ForegroundColor Red; $failed = $true }
    }
    if ($failed) { exit 1 }
    Write-Host 'Eigene Hintergrunddienste beendet. Manuell gestartete Dienste bleiben unberuehrt.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
