# ✦ USHERO – neue Gesamtversion mit farbigen Sheets

- [Vollständigen Bot als ZIP herunterladen](https://github.com/bassbase/Neu/raw/refs/heads/main/downloads/USHERO-Discord-Bot-Sheets-Neu.zip)
- [Farbige Tabellen-Vorlage herunterladen](https://github.com/bassbase/Neu/raw/refs/heads/main/downloads/USHERO-Dashboard.xlsx)
- [Sheets einmal einrichten](SHEETS-EINRICHTEN.md)

Die Vorlage enthält zwölf gestaltete Blätter mit dunklem Hintergrund, Neon-
Akzenten, Dashboard, Filtern, Zahlenformaten und Warnfarben. In der ZIP liegen
auch das aktuelle `sheets/Code.gs`, die Google-Einrichtungsanleitung und
`Sheets-verbinden.bat` für die lokale URL-/Schlüsseleingabe. Ein XLSX-Import allein
verbindet den Bot noch nicht. In Google muss das Script einmal autorisiert und
als Web-App bereitgestellt werden; die Anleitung führt durch diese Schritte.

Der Bot gleicht den vollständigen Datenstand etwa jede Minute ab. Wiederholte
Snapshots erzeugen keine zusätzlichen Verkaufszeilen. Alte Tabellenlayouts
werden archiviert. Die lokale Datenbank bleibt die Buchungsbasis. Ohne explizite
Aktivierung bleibt die Google-Verbindung aus.

In Discord bleiben nur `/menu` und `/panel` sichtbar. Die Fachfunktionen bleiben
über die Bereichsbuttons erreichbar. Alte globale und serverbezogene Einträge
dieses Bots werden beim Start bereinigt. Die Kanalmenüs und deren Bereinigung
bleiben enthalten; Rollenprüfungen gelten weiterhin für alle Menüaktionen.

## Bot aktualisieren

1. Alten Bot beenden, bisherigen Ordner sichern und die neue ZIP neu entpacken.
2. Die bestehende `.env` und die aktuellste eigene `data/bot.db` übernehmen.
3. `start.bat` öffnen und in Discord einmal `/panel` ausführen.
4. Für Sheets die verlinkte Anleitung verwenden. Nach der Verbindung Bot neu
   starten und im Leitungsmenü „Sheets-Status“ oder „Sheets abgleichen“ öffnen.

Die Downloads enthalten weder Schlüssel noch private Buchungen. 40 Offline-Tests
auch aus der fertigen ZIP bestanden, einschließlich XLSX-Design, Apps-Script-
Simulation und Befehlsbereinigung. Ein echter Google-Sheets-Abgleich, Live-Discord,
Windows-Ausführung und Antivirus-Freigabe wurden nicht durchgeführt. Bei einem
Virenschutzfund den Schutz aktiv lassen und den konkreten Fund klären.

SHA-256-Dateien bestätigen Dateigleichheit und ersetzen keinen Sicherheitscheck.
`USHERO-Discord-Bot.zip` ist zusätzlich als aktuelle Downloadkopie verfügbar.
