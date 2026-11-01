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

## Vollstaendiger ZIP-Export, Version 1.3.0

- 23 Tests bestanden: neu sind Dateinamen im Codeblock, Erhalt von Python-Einrueckungen, Ausschluss abgeschnittener Dateien und Verzeichnisbaeume, komplette Projekt-ZIPs mit Original-Binaerdateien/Konfiguration/leeren Ordnern, neueste vollstaendige Dateiversion, Ablehnung mehrdeutiger Pfade und echter Upload-zu-ZIP-Download.
- Browser-Test ueber mehrere Antworten: erste Code-Dateien blieben erhalten, eine spaetere CSS-Aenderung ersetzte die vorherige, das hochgeladene Original-Binaerfile blieb bytegenau gleich, ein unvollstaendiger Codeblock wurde nicht exportiert. ZIP-Download und entpackte Inhalte wurden geprueft.
- Nicht gelesene private Konfigurationsinhalte wurden beim Test im Export erhalten, aber nicht an den simulierten KI-Gateway weitergegeben. Testdaten sind kuenstlich.
- Der konkrete USHERO-Bot wurde nicht als fertig oder getestet bestaetigt: In diesem Auftrag lag sein Chat-Verlauf vor, nicht das Originalprojekt als ZIP. Die Anwendung stellt den technischen Export bereit; sie kann fehlende oder falsche KI-Implementierungen nicht durch Verpacken korrigieren.

## Lokaler Standard und Fortsetzung, Version 1.4.0

- 26 Integrationstests bestanden. Neu: Lokaler Standard ohne Weitergabe von Anbieter-Schluesseln, keine Gateway-Aufrufe bei fehlendem lokalem Modell, Sperre von Cloud-Aliasen und Bildanbieter-Aufrufen im lokalen Modus.
- Browser-Test prueft zusaetzlich automatische Folgeantwort, Stopp bei Anbieterfehler, expliziten Abbruch und maximal drei automatische Fortsetzungen. Die Gateway-Tests waehlen ihren externen Modus ausdruecklich.
- Es ist kein echter Ollama-Dienst oder heruntergeladenes lokales Modell in dieser Umgebung installiert. Lokale Antwortlogik ist gegen einen simulierten Dienst geprueft. Keine echte lokale Inferenz oder Windows-Installation behauptet.
- Kostenlos-unbegrenzt mit allen Funktionen proprietaerer KI-Dienste ist nicht implementiert oder zugesichert. Lokaler Chat hat keine externen KI-API-Aufrufe; Hardware-/Kontextgrenzen bleiben. Optionaler Gateway-Betrieb unterliegt Anbieterpreisen.

## Sicherheitsueberarbeitung der Starter, Version 1.4.1

- Anlass ist die reale Defender-Meldung `Trojan:Script/Sabsik.FL.A!ml` beim Nutzer. Ursache und betroffener Eintrag innerhalb des Downloads sind offen; kein Fehlalarm oder beseitigter Fund bestaetigt. Siehe [SICHERHEITSPRUEFUNG.md](SICHERHEITSPRUEFUNG.md).
- Ausfuehrungsrichtlinien werden nicht mehr durch Starter uebergangen. Serverfenster sind sichtbar, Ollama wird nicht automatisch installiert, Paketinstallation und Modelldownload verlangen eine ausdrueckliche Bestaetigung.
- Alle 26 Integrationstests nach der Ueberarbeitung bestanden. `npm audit --omit=dev` meldete keine bekannten Schwachstellen. Beides ist kein Malware-Scan.
- Browser-Test nach dem Versionswechsel bestanden: Upload, Markdown, kompletter Projekt-ZIP-Download, interaktive getrennte Vorschau, HTML-Bereinigung, Bildmodus mit simuliertem Anbieter, Fortsetzungsgrenzen, Mobilansicht und Update-Fehlerhinweis.
- Windows-Ausfuehrung, PowerShell-Syntaxpruefung durch den Windows-Parser und Microsoft-Defender-Scan bleiben offen. Es wurden keine Quarantaenedateien wiederhergestellt, Schutzregeln veraendert oder Dateien an fremde Scanner hochgeladen.
