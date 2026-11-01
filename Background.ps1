# Helpers for this application's own processes in visible console windows.
function Get-NeuStateDirectory {
    $directory = Join-Path $env:LOCALAPPDATA 'NeuChat'
    New-Item -ItemType Directory -Force $directory | Out-Null
    return $directory
}

function Start-NeuBackground([string]$Name, [string]$Directory, [string]$Script) {
    if ($Name -notin @('gateway', 'chat')) { throw 'Unbekannter Dienst.' }
    $state = Get-NeuStateDirectory
    $scriptPath = (Resolve-Path -LiteralPath $Script).Path
    $nodePath = (Get-Command node -ErrorAction Stop).Source
    Write-Host "Oeffne sichtbares $Name-Fenster. Dieses Fenster fuer den Betrieb offen lassen."
    $process = Start-Process -FilePath $nodePath -ArgumentList ('"' + $scriptPath + '"') -WorkingDirectory $Directory -WindowStyle Normal -PassThru
    try {
        $record = @{
            Id = $process.Id
            StartedUtc = $process.StartTime.ToUniversalTime().ToString('o')
            Script = $scriptPath
            Executable = $process.Path
        }
        $record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $state "$Name-process.json") -Encoding UTF8
    } catch {
        if (-not $process.HasExited) { $process.Kill() }
        throw 'Prozess konnte nicht registriert werden. Bitte die Meldung im Serverfenster pruefen.'
    }
}

function Stop-NeuBackground([string]$Name) {
    if ($Name -notin @('gateway', 'chat')) { throw 'Unbekannter Dienst.' }
    $recordPath = Join-Path (Get-NeuStateDirectory) "$Name-process.json"
    if (-not (Test-Path -LiteralPath $recordPath)) { return }
    $record = Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    $process = Get-Process -Id ([int]$record.Id) -ErrorAction SilentlyContinue
    if ($process) {
        # A recycled PID must never stop another application.
        $sameTime = $process.StartTime.ToUniversalTime().ToString('o') -eq $record.StartedUtc
        $sameExecutable = $process.Path -eq $record.Executable
        $details = Get-CimInstance Win32_Process -Filter ("ProcessId = " + [int]$record.Id)
        $sameScript = $details -and $details.CommandLine -and $details.CommandLine.IndexOf(('"' + $record.Script + '"'), [StringComparison]::OrdinalIgnoreCase) -ge 0
        if (-not ($sameTime -and $sameExecutable -and $sameScript)) { throw "$Name wurde nicht gestoppt: Prozess stimmt nicht mit dem eigenen Starter ueberein." }
        $process.Kill()
        if (-not $process.WaitForExit(10000)) { throw "$Name konnte nicht beendet werden." }
        Write-Host "$Name beendet."
    }
    Remove-Item -LiteralPath $recordPath
}
