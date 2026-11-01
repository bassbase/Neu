# Gepruefter Stand am 1. November 2026

- Node.js 24.19.0, keine zusaetzlichen Laufzeitpakete fuer Neu Chat.
- 7 HTTP-Integrationstests bestanden: Chatverlauf, Streaming/Unicode, Sitzungen, Origin-/Host-Pruefung, Anbieterfehler, Eingabevalidierung, lokale Schluesselspeicherung und Wiederverwendung nach Neustart, statische Dateien.
- Echte Browseranfrage durch Neu Chat und FreeLLMAPI erfolgreich: `CHAT BEREIT`, bedient durch `openai/gpt-oss-120b`.
- Desktopansicht 1440 x 960 und Mobilansicht 390 x 844 mit Chromium geprueft. Neuer Chat leert den Verlauf; KI-generiertes HTML bleibt Text. Bildschirmfotos unter `docs/`.
- 40 ausgewaehlte Tests des vorhandenen FreeLLMAPI bestanden: Wiederholungsversuche und Anthropic-Fallback-Konvergenz. Diese Tests verwenden simulierte Anbieterantworten.
- Claude Code und Gemini waren bereits zuvor in der Cloud mit echter Anfrage getestet worden; der Nutzer hat die funktionierende lokale Windows-Verbindung bestaetigt.

## Noch nicht bestaetigt

- Die Windows-Starter (einschliesslich `Background.ps1`, `Stop.ps1` und `Stop.cmd`) sind fuer Hintergrundstart und gezieltes Beenden der eigenen Dienste erstellt, aber in dieser Linux-Umgebung nicht auf Windows ausgefuehrt worden.
- Ein echter, durch erschoepftes Kontingent ausgeloester Wechsel zwischen zwei Anbietern wurde nicht erzwungen.
- Weitere Anbieter werden erst durch die eigenen Konten und Schluessel des Nutzers nutzbar. Es wurden keine Konten angelegt und keine 600 Modelle freigeschaltet.
- Eine Veroeffentlichung der Cloud-Konfiguration und ein erneuter Snapshot-Start nach dieser App-Erstellung wurden nicht durch den Agenten ausgefuehrt.

## Datei-Anhaenge, Version 1.1.0

- 14 Tests bestanden: zusaetzlich Multipart-Dateiupload, Text/Bild-Weiterleitung als echte Bildbloecke, PDF-, DOCX-, ZIP- und RAR-Auslesen, Videostandbild-Extraktion, Ablehnung von Archivbomben/Pfadmanipulation, Groessen-/Anzahlgrenzen und fehlendem Bildmodell.
- Echter Browserdurchlauf mit einer blauen PNG-Datei und einer Textdatei: Gemini `gemini-3-flash-preview` antwortete „Das Testwort lautet BLATT42 und die Hauptfarbe des Bildes ist Blau.“ Keine JavaScript-Fehler beobachtet; Mobilansicht ohne horizontalen Ueberlauf.
- Reproduzierbare Installation mit `npm ci` erfolgreich; `npm audit --omit=dev` meldete keine bekannten Schwachstellen zum Pruefzeitpunkt.
- Dateiparser und FFmpeg wurden auf Linux mit Node.js 24.19.0 ausgefuehrt. Windows-Paketinstallation und Hintergrundstarter sind weiterhin nicht auf einem Windows-System verifiziert.
- Videos werden nur als begrenzte Standbildfolge analysiert. Vollstaendige Video-/Audioanalyse und echtes Bearbeiten von Bild-/Videodateien wurden nicht implementiert oder behauptet.

## Arbeitsmodi und Update-Pruefung, Version 1.2.0

- 18 HTTP-/Integrationstests bestanden. Neu: Versions-/Build-Erkennung, echte PNG-Verarbeitung einer simulierten Bildanbieter-Antwort, klare Fehler bei fehlendem Bildanbieter, Ablehnung reiner externer Bild-URLs und CSP-getrennte HTML-Vorschau.
- `npm run test:browser` bestanden: Datei-Upload, Markdown und Code-Dateien, Projekt-ZIP mit den richtigen Inhalten, interaktive HTML/CSS/JS-Vorschau, gesperrter Zugriff auf das Chat-Dokument, gesperrtes Fetch aus der Vorschau, bereinigtes KI-HTML, Bildmodus mit simuliertem Anbieter, Mobilansicht und Update-Hinweis statt „Nicht gefunden“ bei einem simulierten alten Server.
- Echte Code-Erstellung mit `openai/gpt-oss-120b` durch FreeLLMAPI: eine vollstaendige HTML-Notiz-App wurde erzeugt und als Vorschau geoeffnet. Keine Browser-JavaScript-Fehler beobachtet.
- Die Bildgeneration wurde mit simulierten Antworten getestet. Die ausgelesenen Cloud-Gateway-Metadaten enthielten kein aktiviertes Bildmodell mit verbundenem Anbieter. Deshalb wurde keine echte Bild-Erzeugung als erfolgreich behauptet oder ohne bekannten Tarif aufgerufen.
- Installation aus dem Lockfile mit `npm ci` und Paketpruefung erfolgreich; keine gemeldeten Schwachstellen zum Pruefzeitpunkt.
- Die neue Windows-Versionspruefung wurde hier nicht auf einem Windows-System ausgefuehrt. Der beobachtete Upload-404 passt zu einem alten Hintergrundserver; der konkrete Prozess auf dem PC des Nutzers war nicht direkt zugaenglich.
