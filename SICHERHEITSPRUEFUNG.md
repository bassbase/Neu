# Offene Defender-Meldung und Ueberarbeitung 1.4.1

Stand: 1. November 2026. **Keine Freigabe zum Ausfuehren betroffener Downloads.**

## Beobachteter Fund

Microsoft Defender meldete beim Nutzer `Trojan:Script/Sabsik.FL.A!ml` mit Status
„Unter Quarantaene“. Das Video zeigt einen durch den Browser blockierten
Projekt-ZIP-Download. Die Detailansicht nennt einen Opera-Cache-Eintrag und eine
temporaere Datei im Download-Ordner. Sie nennt keinen konkreten Eintrag innerhalb
der ZIP. Der unter Quarantaene gestellte Download selbst liegt dieser Pruefung nicht vor.

Damit ist weder die Ursache bestimmt noch ein Fehlalarm nachgewiesen. Der
untersuchte Git-Ausgangsstand ist
`a88a4facd0e1caab9f8bd2681358378112331795` (Version 1.4.0). Dass dieser Stand
bytegenau dem tatsaechlich erkannten Download entspricht, ist nicht bestaetigt.

## Konkrete Aenderungen an den Startern

- Alle fuenf CMD-Starter rufen PowerShell ohne Aenderung der Ausfuehrungsrichtlinie
  auf. Blockaden durch Windows werden respektiert; die Skripte sind nicht signiert.
- Chat-, Gateway- und gegebenenfalls Ollama-Server starten in sichtbaren Fenstern.
  Servermeldungen werden dort ausgegeben. Diese Fenster muessen offen bleiben.
- Die lokale Einrichtung laedt keinen Ollama-Installer herunter und fuehrt keinen
  Paketmanager fuer dessen Installation aus. Ollama muss vorher separat installiert
  sein.
- Vor `npm ci` werden Paketinstallation und Installationsskripte erklaert und mit
  `JA` bestaetigt. Der ungefaehr 2 GB grosse Modelldownload benoetigt ebenfalls eine
  ausdrueckliche Bestaetigung.
- Die bestehende enge Prozesspruefung fuer das Beenden eigener registrierter
  Server bleibt erhalten. Es werden keine Schutzprogramme, Signaturen,
  Defender-Einstellungen oder Quarantaenedaten geaendert.

Diese Aenderungen reduzieren unnoetige Automatisierung und machen den Betrieb
nachvollziehbarer. Sie belegen nicht, dass die Erkennung beseitigt wurde. Es
wurden keine Dateien zur Umgehung einer Erkennung verschleiert, umbenannt oder
aus einem Downloadpaket ausgespart. Die RAR-Testdateien bleiben unveraendert.

## Umfang und Ergebnisse der Quelltextpruefung

Geprueft wurden die Windows-Starter sowie die Aufrufstellen fuer Netzwerk,
Unterprozesse und Datei-Verarbeitung im Anwendungscode. In diesen geprueften
Stellen wurde kein Code zum Abschalten des Virenschutzes, fuer Autostart,
verschleierte Befehle oder zum Herunterladen und Ausfuehren von KI-generiertem
Code festgestellt. Das ist eine begrenzte Quelltextpruefung, keine vollstaendige
Malwareanalyse aller Abhaengigkeiten.

Der Chat-Server ist an Loopback gebunden. KI-Anfragen gehen an den lokalen
Ollama-Dienst oder nach ausdruecklicher Moduswahl an den lokalen FreeLLMAPI-Gateway.
Der eigenstaendige Gateway leitet dann an externe Anbieter weiter. Dateiinhalte
werden durch Parser verarbeitet; der Projekt-Export fuehrt den enthaltenen Code
nicht aus. FFmpeg wird fuer Videostandbilder mit festen Argumenten und ohne Shell
als Unterprozess gestartet. Diese kurzen Werkzeugaufrufe oeffnen weiterhin kein
eigenes Konsolenfenster; das ist vom sichtbaren Serverstart zu unterscheiden.

Alle 84 im Lockfile verzeichneten Pakete haben npm-Registry-HTTPS-Adressen und
SHA-512-Integritaetswerte. Das Lockfile deklariert ein Installationsskript fuer
`ffmpeg-static`; dieses laedt eine zusaetzliche FFmpeg-Binaerdatei herunter. Die
npm-Paketintegritaet allein ist keine Antiviruspruefung dieser Binaerdatei.
Abhaengigkeiten koennen weitere native Binaerdateien enthalten.

`npm audit --omit=dev` meldete beim erneuten Lauf keine bekannten Schwachstellen.
Das ist weder ein Malware-Scan noch ein Nachweis fuer einen Defender-Fehlalarm.
Funktionstests und Browserpruefung werden in [VALIDIERUNG.md](VALIDIERUNG.md)
getrennt dokumentiert.

## Noch notwendig

In dieser Linux-Umgebung stehen weder Microsoft Defender noch Windows PowerShell
zur Verfuegung. Die ueberarbeiteten Starter sind deshalb nicht auf Windows
ausgefuehrt und der Download ist nicht mit Defender freigegeben worden. Es wurden
keine Dateien an externe Scanner oder an Microsoft uebermittelt.

Betroffene Downloads in Quarantaene lassen, keine Ausnahme anlegen und Schutz
nicht deaktivieren. Auf dem betroffenen Windows-PC die Schutzupdates aktualisieren
und einen vollstaendigen Scan durchfuehren. Ein sauberer Scan bei weiterhin
quarantinisierten Downloads gibt diese Downloads nicht frei. Fuer die Klaerung
bleiben die genaue betroffene Dateiversion und eine Analyse des konkreten Fundes
erforderlich; eine eventuelle Uebermittlung an Microsoft muss der Nutzer bewusst
veranlassen. Bis dahin sind die Aenderungen ein zur Pruefung vorliegender
Quelltextstand und keine Zusage, dass das Paket sicher ausgefuehrt werden kann.
