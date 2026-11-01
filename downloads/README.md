# ✦ USHERO – getrennte Abteilungen und Sheets V3

- [Vollständigen Bot als ZIP herunterladen](https://github.com/bassbase/Neu/raw/refs/heads/main/downloads/USHERO-Discord-Bot-Rechte-Sheets-V3.zip)
- [Farbige Tabellen-Vorlage V3 herunterladen](https://github.com/bassbase/Neu/raw/refs/heads/main/downloads/USHERO-Dashboard-V3.xlsx)
- [Sheets einrichten und bestehende Verbindung aktualisieren](SHEETS-EINRICHTEN.md)

Diese Version ersetzt die früheren Bot-Downloads auf dieser Seite. Die ZIP
enthält den vollständigen Quellcode, Windows-Starter, ein einziges aktuelles
`sheets/Code.gs`, die Vorlage und `Sheets-verbinden.bat`. Sie enthält keine
Schlüssel, keine `.env` und keine private Datenbank.

## Bot aktualisieren und Bereiche trennen

1. Alten Bot beenden und den bisherigen Ordner als Sicherung behalten.
2. Die neue ZIP in einen neuen Ordner entpacken. Die bestehende `.env` und die
   aktuellste eigene `data/bot.db` aus dem gestoppten Bot übernehmen. Ohne diese
   Datenbank fehlen die bisherigen Buchungen.
3. `start.bat` öffnen und als Leitung in Discord einmal `/panel` ausführen.
   Der Bot benötigt Rechte zum Verwalten der Kanäle und Nachrichten. Die
   Rückmeldung zeigt erfolgreiche Zuordnungen und fehlende Rechte.
4. Mitarbeitern gezielt ihre Fachrolle zuweisen: zum Beispiel **Verkauf**,
   **Warehouse**, **VIP**, **Tänzer/in** oder **Security**. Die Rolle
   **Mitarbeiter** allein öffnet nur gemeinsame persönliche Funktionen.

Bestehende USHERO-Kanalrechte werden bei der Einrichtung korrigiert und
gespeicherte Kanäle beim Neustart wieder abgesichert. Die Bereichskanäle zeigen
ihre eigenen Buttons. Das öffentliche Hauptmenü bietet nur den persönlichen
Einstieg; die anschließende private Auswahl enthält ausschließlich berechtigte
Bereiche. Alte private Antworten schließen und `/menu` neu öffnen.

**Serverinhaber und Rollen mit Discords Administrator-Berechtigung sehen
weiterhin alle Kanäle.** Discord umgeht für sie Kanalverbote. Solche globalen
Rechte werden nicht automatisch entzogen. Reguläre Mitarbeiter sollten keine
Administratorrolle erhalten. Buchhaltung erhält Finanzfunktionen; KI bleibt
beim Serverinhaber. Normale Mitarbeiter sehen nur ihren eigenen Dienstplan.

Nur `/menu` und `/panel` bleiben als Slash-Befehle sichtbar. Alte Einträge dieses
Bots werden beim Start bereinigt. Kanalmenüs bleiben angeheftet, soweit erlaubt;
Discord bietet keine schwebenden Menüs. Bereinigt werden neue Arbeitsnachrichten
in registrierten Kanälen, keine alten Chatverläufe oder Buchungsdaten.

## Sheets tatsächlich verbinden

Die Vorlage enthält **13 farbige Blätter** mit dunklem Hintergrund, Dashboard,
Filtern, Formeln und Warnfarben. Für eine bestehende Tabelle den neuen
`Code.gs`-Inhalt einsetzen, **`USHERO_einrichten`** ausführen und die Web-App als
**neue Version bereitstellen**. Speichern im Editor allein aktualisiert ein
bestehendes Deployment nicht.

Die Kennung mit **AKfy… ist eine Bereitstellungs-ID, kein Verbindungsschlüssel**.
Den separaten geheimen Schlüssel über das USHERO-Menü der Tabelle erzeugen.
`Sheets-verbinden.bat` fragt lokal nach `/exec`-URL und Schlüssel und prüft die
echte Antwort. Ein `/macros/library/`-Link ist kein Bot-Endpunkt. Danach den Bot
neu starten und unter **Buchhaltung → Sheets-Status / Sheets abgleichen** prüfen.
Die verlinkte Anleitung beschreibt jeden Google-Schritt.

Der Bot exportiert seinen Datenstand ungefähr jede Minute. Aus Sheets werden
ausschließlich **Lagerbestand und Dienstplan** übernommen. Im neuen Blatt
**Änderungen** steht dazu Offen, Übernommen oder Fehler. Nur Übernommen bestätigt
die Änderung in der lokalen Datenbank. Geldbuchungen bleiben im Bot. Konflikte
werden abgewiesen; wiederholte Übertragungen buchen nichts doppelt.

Das Gesamt-Workbook nur mit vertrauenswürdiger Leitung/Buchhaltung teilen.
Discord-Rechte verändern keine Google-Freigaben; versteckte Blätter verhindern
keinen Zugriff durch Personen, die das gesamte Workbook lesen dürfen.

## Prüfung und Grenzen

**49 Offline-Tests aus der fertig entpackten ZIP bestanden**, einschließlich
echter Discord-Rechteberechnung, SQLite-Transaktionen, Importbestätigung,
Konfliktbehandlung, Apps-Script-Simulation und XLSX-Design. Die lokale Datenbank
bleibt die Buchungsbasis. Die Cloud-Netzwerkrichtlinie erlaubt keinen Zugriff
auf den genannten Google-Endpunkt; Google-Deployment, Live-Discord und Windows-
Ausführung wurden nicht hier bestätigt. Die lokale Verbindungshilfe muss den
echten Abgleich prüfen. Ein Antivirus-Scan mit Microsoft Defender ist hier nicht
verfügbar; bei einem Fund Schutz aktiv lassen und den konkreten Fund klären.

SHA-256-Dateien bestätigen Dateigleichheit und ersetzen keinen Sicherheitscheck.
`USHERO-Discord-Bot.zip` und `USHERO-Dashboard.xlsx` sind zusätzlich als aktuelle
Downloadkopien verfügbar.
