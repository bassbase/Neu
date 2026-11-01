# USHERO Sheets V3 – Verbindung und Rückweg

Die Vorlage enthält 13 farbige Blätter einschließlich **Änderungen**. Der Bot
sendet seinen Datenstand nach Sheets. Zurück übernommen werden ausschließlich
**Lagerbestand und Dienstplan**, wie vereinbart. Verkäufe, Abrechnungen, Löhne
und andere Geldbuchungen werden weiterhin im Bot vorgenommen.

## Tabelle aus Discord öffnen

**`/sheets`** zeigt Leitung und Buchhaltung privat einen **Google Sheets öffnen**-
Button. Der Bot ermittelt die richtige Tabellenadresse automatisch durch einen
authentifizierten Statusaufruf deiner Web-App. Auch **Sheets-Status** und ein
erfolgreicher **Sheets-Abgleich** zeigen diesen Button. In Buchhaltung gibt es
zusätzlich **Sheets öffnen**. Ein Klick öffnet die Tabelle auf deinem Gerät;
Discord erlaubt dem Bot nicht, selbstständig Browserfenster bei Nutzern zu öffnen.
Die Google-Freigabe der Tabelle gilt weiterhin.

Damit der neue Link verfügbar ist, das mitgelieferte `Code.gs` auch bei einem
bestehenden V3-Deployment ersetzen und als **neue Web-App-Version** bereitstellen.
Bei fehlendem Link oder falscher Konfiguration zeigt der Bot die Ursache. Die
Bereitstellungs-URL ist kein Tabellenlink; Schlüssel werden nie in den Button
eingefügt. Normale Mitarbeiter erhalten keinen Zugriff auf das Gesamt-Workbook.

## Wichtig zu deinen Links

- Die URL `https://script.google.com/macros/s/…/exec` ist die Web-App-Adresse.
- Die lange Kennung mit `AKfy…` ist deren **Bereitstellungs-ID**, kein geheimer
  Verbindungsschlüssel. Sie gehört nicht in `SHEETS_SHARED_KEY`.
- Ein Link mit `/macros/library/…` ist ein Bibliothekslink und kein Bot-Endpunkt.
- Der Verbindungsschlüssel wird separat im **USHERO-Menü der Tabelle** erzeugt.
  Er bleibt auf deinem PC und in Script Properties. Nicht im Chat teilen.

## Bestehende Google-Tabelle aktualisieren

1. Die vorhandene Google-Tabelle öffnen. Für einen neuen Aufbau die enthaltene
   `USHERO-Dashboard.xlsx` in Google Drive importieren und als Google-Tabelle
   speichern. Ein XLSX-Import allein verbindet den Bot noch nicht.
2. **Erweiterungen → Apps Script**. Den alten USHERO-Backendcode vollständig
   durch die aktuelle `Code.gs` ersetzen. Nur eine aktuelle Version von
   `doPost`, `doGet` und `onEdit` im Projekt behalten; keine zweite alte Kopie
   oder zusätzliche USHERO-Bibliothek für diesen Backendcode einbinden.
3. **`USHERO_einrichten`** einmal ausführen und die Berechtigungen für deine
   eigene Tabelle bestätigen. Dadurch werden Gestaltung und Änderungsblatt
   angelegt. Bestehende Blätter mit alten Spalten werden vorher archiviert.
4. Tabelle neu laden → **✦ USHERO → Verbindungsschlüssel einrichten**. Leer
   bestätigen erzeugt einen neuen langen Schlüssel. Diesen lokal bereithalten.
5. **Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Neue Version**
   und erneut bereitstellen. Nur Speichern im Editor aktualisiert eine alte
   Web-App-Bereitstellung nicht. Bei einer neuen Bereitstellung „Web-App“ wählen.
   Ausführung als dein Konto; der Bot-Aufruf muss ohne interaktive Google-
   Anmeldung erlaubt sein. Das Backend prüft zusätzlich den langen Schlüssel.
   Die Tabelle selbst muss nicht öffentlich freigegeben werden. Workspace-
   Richtlinien können diese Verbindungsart verhindern.
6. Auf deinem PC **`Sheets-verbinden.bat`** öffnen. Die `/exec`-URL und den
   separat erzeugten Schlüssel eingeben. Die Eingabe des Schlüssels ist verborgen.
   Der Bot-Token bleibt erhalten. Das Programm testet die tatsächliche Web-App-
   Antwort und meldet Fehler, statt die Verbindung ungeprüft als fertig zu melden.
7. Bot neu starten. Unter **Buchhaltung → Sheets-Status / Sheets abgleichen**
   den ersten bestätigten Abgleich prüfen. Erst danach Zellen in Sheets bearbeiten.

Das Öffnen einer geschützten `/exec`-URL im Browser ohne Schlüssel darf eine
Ablehnung zeigen. Die lokale Verbindungshilfe sendet den authentifizierten
Status-Aufruf. Sie unterscheidet Bibliothekslink, fehlenden/falschen Schlüssel,
HTML-/Anmeldeseite, alte Code-Version, fehlende Tabelleneinrichtung und HTTP-Fehler.
Die Cloud hat weder dein Google-Konto autorisiert noch dein Deployment geändert.

## Sheets → Discord / Bot

Nach dem ersten bestätigten Abgleich:

- **Lagerbestand:** Im Blatt `Lagerbestand` nur die Spalte **Bestand** ändern.
  Artikelbezeichnungen und versteckte Baselines unverändert lassen.
- **Dienstplan:** Mitarbeiter-ID, Datum, Bereich, Von, Bis und Notiz bearbeiten.
  IDs aus `Team` verwenden. Für einen neuen Eintrag eine leere Zeile ohne eigene
  Plan-ID füllen; die ID wird automatisch vergeben. Datum als `YYYY-MM-DD` oder
  `DD.MM.YYYY`, Uhrzeiten als `HH:MM`. Mitarbeiter müssen zum aktuellen Team gehören.
- **Plan löschen:** Die gewünschte Zeile auswählen und im Menü **✦ USHERO →
  Ausgewählten Dienstplaneintrag löschen** bestätigen. Leeren von Zellen allein
  löscht keine gespeicherte Schicht.

Der Rückweg läuft ungefähr jede Minute oder über **Sheets abgleichen**. Im Blatt
**Änderungen** steht pro Änderung **Offen**, **Übernommen** oder **Fehler** samt
Rückmeldung. Erst „Übernommen“ bestätigt, dass die lokale Datenbank aktualisiert
ist. Die Discord-Buttons lesen anschließend diese neuen Lager-/Planwerte.
Normale Mitarbeiter sehen im Discord-Dienstplan nur ihre eigenen Einträge;
Leitung und Schichtleitung dürfen die Übersicht sehen.

Jede Änderung wird nur einmal verarbeitet, auch bei Verbindungsfehlern und
erneuter Übertragung. Hat der Bot den betreffenden Bestand oder Planeintrag
inzwischen geändert, wird die veraltete Änderung als **Konflikt** abgewiesen.
Dann erst neu abgleichen und die gewünschte Änderung erneut eingeben. Unfertige
neue Planzeilen werden als Entwürfe behalten; gültige Einträge erscheinen nach
Bestätigung mit der Datenbank-ID. Höchstens 100 Zeilen auf einmal bearbeiten.

Geldzellen werden niemals als Buchung importiert. Änderungen dort werden mit
Hinweis beim nächsten Abgleich durch den gültigen Bot-Stand ersetzt. Private
Bewerbungs- und Verwarnungstexte gehören nicht zum Finanz-/Team-Export.

## Rechte und Datenhaltung

Das Gesamt-Workbook nur mit vertrauenswürdiger Leitung/Buchhaltung teilen.
Discord-Kanalrechte ändern keine Google-Freigaben. Versteckte oder geschützte
Tabellenblätter sind keine sichere Trennung für Personen, die die gesamte
Datei lesen dürfen. Reguläre Mitarbeiter benutzen ihre getrennten Discord-
Bereiche. Der gemeinsame Verbindungsschlüssel ist eine administrative Freigabe
für die erlaubten Rückweg-Aktionen und gehört nicht in Mitarbeiter-Chats.

Die lokale Datenbank bleibt die Buchungsbasis. Bei einer anderen Datenbank
schützt die Quellenbindung vorhandene Sheets-Daten. Ein bewusster Wechsel über
**Andere Bot-Datenquelle erlauben** archiviert vorher Tabellen und Änderungsblatt.
Eigene freie Notizen auf einem separaten Blatt führen. In verwalteten Datentabellen
nur die oben genannten Rückweg-Felder bearbeiten.

Grenzen: 10.000 Zeilen je exportiertem Datenblatt, etwa 7 MB je Snapshot,
50 Rückweg-Aktionen je Abgleich; Google hat zusätzliche Kontingente. Zu große
Datenstände werden nicht als unvollständige Kopie übertragen. Langtexte werden
gegebenenfalls mit sichtbarem Hinweis gekürzt. Ein kostenpflichtiges KI-Modell
wird für diesen Datenabgleich nicht benötigt.

Vorlage, Datenlogik und Apps-Script-Verhalten wurden offline geprüft. Echte
Google-Autorisierung, tatsächliches Deployment und Live-Abgleich müssen mit der
lokalen Verbindungshilfe bestätigt werden.
