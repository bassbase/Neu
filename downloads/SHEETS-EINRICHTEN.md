# ✦ USHERO – farbiges Google-Sheets-Dashboard

`USHERO-Dashboard.xlsx` ist eine leere, gestaltete Vorlage mit zwölf Blättern.
Sie enthält **keine** Benutzerbuchungen und keine Schlüssel. Das enthaltene
`Code.gs` gestaltet auch eine bestehende Google-Tabelle direkt und übernimmt
den aktuellen Datenbankstand deines Bots. Ein XLSX-Import allein verbindet den
Bot noch nicht und installiert kein Apps Script.

## Einmal in deiner Google-Tabelle einrichten

1. `USHERO-Dashboard.xlsx` in Google Drive hochladen und **mit Google Tabellen
   öffnen**, dann als Google-Tabelle speichern. Alternativ deine bereits
   vorhandene Google-Tabelle verwenden.
2. Dort **Erweiterungen → Apps Script** öffnen. Den bisherigen USHERO-Code durch
   den vollständigen Inhalt der mitgelieferten **`Code.gs`** ersetzen und speichern.
   Im Script-Projekt nur diese eine aktuelle Backend-Version behalten, damit
   alte `doPost`-/`doGet`-Funktionen nicht doppelt definiert sind.
3. Oben **`USHERO_einrichten`** auswählen und ausführen. Google fragt dabei nach
   deiner Berechtigung für deine eigene Tabelle. Danach die Tabelle neu laden.
   Unter **✦ USHERO → Verbindungsschlüssel einrichten** leer bestätigen, um einen
   langen Schlüssel zu erzeugen. Er wird in Script Properties gespeichert,
   nicht in Tabellenzellen. Den Schlüssel für den nächsten Schritt lokal
   bereithalten und nicht im Chat oder auf GitHub teilen.
4. **Bereitstellen → Neue Bereitstellung → Web-App**. Ausführen als dein Konto.
   Für den Bot-Zugriff muss die Web-App den Aufruf ohne interaktive Google-
   Anmeldung erlauben; das Backend prüft zusätzlich den langen gemeinsamen
   Schlüssel. Nur die **`/exec`-URL** der Web-App verwenden. Die Google-Tabelle
   selbst muss nicht öffentlich freigegeben werden. Falls dein Workspace-Admin
   diesen Web-App-Zugriff untersagt, funktioniert diese Verbindungsart nicht.
   Bei einem bestehenden Deployment die neue Version über „Bereitstellungen
   verwalten“ aktualisieren; bloßes Speichern ändert ein altes Deployment nicht.
5. Auf deinem PC **`Sheets-verbinden.bat`** öffnen. Die `/exec`-URL einfügen und
   den generierten Schlüssel verdeckt eingeben. Bestehende `.env`-Einträge,
   einschließlich des Discord-Tokens, bleiben erhalten. Den Bot anschließend
   neu starten. Unter **Leitung → Sheets-Status** bzw. **Sheets abgleichen**
   wird die erste erfolgreiche Bestätigung angezeigt.

Die Einrichtung in Google und die Freigabe deiner eigenen Tabelle musst du
selbst ausführen. Die Cloud-Arbeit hat weder dein Google-Konto autorisiert noch
bereits eine echte Tabelle verändert.

## Gestaltung und Daten

Dashboard, Verkäufe, VIP, Tanz-Sessions, Security, Dienstzeiten, Dienstplan,
Abrechnungen, Firmenkasse, Lagerbestand, Bestellungen und Team. Dunkler
Hintergrund, pinke/cyanfarbene Akzente, unterschiedliche Reiterfarben, fixierte
Überschriften, Filter und lesbare Geldformate. Lagerwarnungen und Status erhalten
passende Warnfarben. Google-Sheets-Menüs und Browserrahmen selbst werden nicht
umgefärbt; gestaltet werden deine Tabellenzellen und Diagramme.

Das Dashboard zeigt Gesamtumsatz, Firmenkasse, Mitarbeiteranteile, offene
Bestellungen, aktive Dienste und niedrigen Lagerbestand. Tanzumsätze sind
bereits in den Verkaufsbuchungen enthalten und werden im Gesamtumsatz nicht
noch einmal zusätzlich addiert. Der Zeitpunkt zeigt nur einen bestätigten
Abgleich, keine erfundene erfolgreiche Verbindung.

## Abgleich und bestehende Daten

Etwa jede Minute wird ein vollständiger, konsistenter Stand aus der lokalen
Datenbank übertragen. Dasselbe Snapshot schreibt keine zusätzlichen Zeilen;
Doppelklicks oder erneute Übertragung erzeugen keine weiteren Verkaufsbuchungen.
Bei unverändertem Datenstand wird nur die Bestätigung aktualisiert. Der Bot
führt seine Buchungen weiter lokal, auch wenn Sheets offline ist. „Sheets abgleichen“
kann den Spiegel bewusst vollständig aktualisieren.

Die Tabellen sind ein **Spiegel**, kein zweites Buchungssystem. Beträge und
Buchungen im Bot erfassen. Änderungen in verwalteten Datentabellen werden beim
nächsten veränderten Datenstand oder manuellen Vollabgleich überschrieben.
Eigene Notizen in einem separaten Blatt führen. Bei einem alten Spaltenaufbau
werden vorhandene Blätter zuerst als **Archiv …** umbenannt; die bisherigen
Inhalte werden nicht gelöscht. Private Bewerbungs- und Verwarnungstexte werden
nicht in diesen Finanz-/Team-Spiegel exportiert.

Die Datenquelle ist an die lokale Datenbank gebunden. Eine fremde/neue Datenbank
überschreibt nicht stillschweigend den verbundenen Stand. Für einen bewussten
Wechsel im Tabellenmenü **Andere Bot-Datenquelle erlauben** wählen; vorher
werden vorhandene Datentabellen archiviert. In der neuen Bot-Version immer die
aktuellste eigene `data/bot.db` übernehmen.

Grenzen: 10.000 Zeilen je Datenblatt und etwa 7 MB je Snapshot. Zu große Stände
werden vollständig abgewiesen und nicht als unvollständige Kopie übertragen.
Google Apps Script und Google Tabellen haben eigene Kontingente und Limits.
Der Export benötigt kein kostenpflichtiges KI-Modell, verspricht aber keine
unbegrenzten Google-Kontingente. Der Bot überträgt bei aktivierter Verbindung
die dargestellten Betriebsdaten und Mitarbeiter-IDs/-Namen an deine Google-
Tabelle; deren Freigaben sorgfältig wählen.

Die Logik wurde offline getestet. Google-Autorisierung, tatsächliche Bereitstellung,
Import und Live-Abgleich sind nicht als bereits erfolgreich bestätigt.
