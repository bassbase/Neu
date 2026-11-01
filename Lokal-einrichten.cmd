@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Lokal-einrichten.ps1"
if errorlevel 1 pause
