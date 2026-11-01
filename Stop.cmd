@echo off
powershell.exe -NoProfile -File "%~dp0Stop.ps1"
if errorlevel 1 (
  echo Start fehlgeschlagen. Bei einer Sicherheits- oder Richtlinienblockade nicht umgehen.
  pause
)
