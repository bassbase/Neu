# USHERO mit festen Kanalmenüs herunterladen

[Neue vollständige ZIP direkt herunterladen](https://github.com/bassbase/Neu/raw/refs/heads/main/downloads/USHERO-Discord-Bot-Kanalmenues.zip)

Verkauf in `verkauf`, VIP in `vip`, Bestellungen in `warehouse-bestellungen`,
Lagerbestand in `warehouse-lager`; dazu passende Menüs für die übrigen Bereiche.
Die Menüs sind dauerhaft sichtbar, werden gespeichert und nach Möglichkeit
angeheftet. Bei Bedarf rückt das eigene Menü gebündelt wieder nach unten.

1. Alten Bot mit Strg+C beenden und den bisherigen Ordner sichern.
2. Neue ZIP in einen neuen Ordner entpacken.
3. Bisherige `.env` neben `bot.py` und die aktuellste eigene Datenbank nach
   `data/bot.db` kopieren. Ohne Datenbank startet der Bot mit leeren Tabellen.
4. `start.bat` öffnen und gegebenenfalls Paketinstallation bestätigen.
5. Als Leitung in Discord einmal `/panel` ausführen. Der Bot richtet passende
   Kanalmenüs ein und meldet fehlende Rechte. Danach dort die Buttons benutzen.

Neu eingehende öffentliche Chatnachrichten in registrierten Arbeitskanälen werden
bei aktiver Bereinigung nach ca. zehn Sekunden entfernt. Interaktionsantworten
sind privat; einfache Ergebnisse verschwinden nach ca. zwei Minuten. Alte
Verläufe, angeheftete Nutzernachrichten, fremde Bots, getrennte Protokolle und
Buchungsdaten bleiben erhalten. `/menues-stop` stoppt die Automatik im aktuellen
Kanal. `/menues-einrichten` bietet Optionen für Kanalanlage und Chatbereinigung.

Discord hat keine schwebenden Menüs. Der Bot nutzt Anheften und begrenztes
Nachrücken, maximal ungefähr einmal je 15 Sekunden und Kanal. Er braucht dafür
passende Rechte: Verlauf lesen, Nachrichten senden, Links einbetten, Anheften
und für Chatbereinigung Nachrichten verwalten. Kanäle verwalten wird zum Anlegen
fehlender Kanäle gebraucht. Vorhandene Rollen/Kanalrechte werden nicht gelöscht
oder überschrieben.

Die ZIP enthält weder Zugangsdaten noch eine private Datenbank. 33 Offline-Tests
auch aus der frisch entpackten ZIP bestanden. Live-Discord, Windows-Ausführung
und Antivirus-Freigabe sind nicht bestätigt. Details: `PRUEFBERICHT.md` in der ZIP.
Bei einer Virenschutzwarnung den Schutz aktiv lassen und den konkreten Fund klären.

Die SHA-256-Datei bestätigt Dateigleichheit und ersetzt keinen Sicherheitscheck.
`USHERO-Discord-Bot.zip` ist zusätzlich als aktuelle Downloadkopie verfügbar.
