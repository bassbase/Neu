# Gepruefter Stand am 1. November 2026

- Node.js 24.19.0, keine zusaetzlichen Laufzeitpakete fuer Neu Chat.
- 7 HTTP-Integrationstests bestanden: Chatverlauf, Streaming/Unicode, Sitzungen, Origin-/Host-Pruefung, Anbieterfehler, Eingabevalidierung, lokale Schluesselspeicherung und Wiederverwendung nach Neustart, statische Dateien.
- Echte Browseranfrage durch Neu Chat und FreeLLMAPI erfolgreich: `CHAT BEREIT`, bedient durch `openai/gpt-oss-120b`.
- Desktopansicht 1440 x 960 und Mobilansicht 390 x 844 mit Chromium geprueft. Neuer Chat leert den Verlauf; KI-generiertes HTML bleibt Text. Bildschirmfotos unter `docs/`.
- 40 ausgewaehlte Tests des vorhandenen FreeLLMAPI bestanden: Wiederholungsversuche und Anthropic-Fallback-Konvergenz. Diese Tests verwenden simulierte Anbieterantworten.
- Claude Code und Gemini waren bereits zuvor in der Cloud mit echter Anfrage getestet worden; der Nutzer hat die funktionierende lokale Windows-Verbindung bestaetigt.

## Noch nicht bestaetigt

- Die neuen Dateien `Start.ps1`, `Start.cmd` und `Claude.cmd` sind fuer Windows erstellt, aber in dieser Linux-Umgebung nicht auf Windows ausgefuehrt worden.
- Ein echter, durch erschoepftes Kontingent ausgeloester Wechsel zwischen zwei Anbietern wurde nicht erzwungen.
- Weitere Anbieter werden erst durch die eigenen Konten und Schluessel des Nutzers nutzbar. Es wurden keine Konten angelegt und keine 600 Modelle freigeschaltet.
- Eine Veroeffentlichung der Cloud-Konfiguration und ein erneuter Snapshot-Start nach dieser App-Erstellung wurden nicht durch den Agenten ausgefuehrt.
