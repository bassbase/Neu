@echo off
powershell.exe -NoProfile -File "%~dp0Start.ps1" -Claude
if errorlevel 1 (
  echo Start fehlgeschlagen. Bei einer Sicherheits- oder Richtlinienblockade nicht umgehen.
  pause
)
