# Neu Chat

Dein eigener lokaler KI-Chat mit deutscher Oberflaeche, Modellwahl, Datei-Anhaengen, laufend angezeigten Antworten und Verbindung zu FreeLLMAPI.

## Windows: starten

Voraussetzungen: Node.js 22 oder 24 und deine bereits eingerichtete FreeLLMAPI-Installation unter `%USERPROFILE%\FreeLLMAPI` mit mindestens einem funktionierenden Anbieter.

1. Diesen Projektordner herunterladen und entpacken.
2. `Start.cmd` doppelt anklicken. Der Starter installiert bei Bedarf die im Lockfile festgelegten Pakete einschliesslich des Videowerkzeugs (Internet erforderlich). Beim ersten Start dauert dies einige Minuten. Danach startet er FreeLLMAPI und den Chat im Hintergrund und oeffnet deinen Browser. Es muessen keine Server-Terminals geoeffnet bleiben.
3. Beim ersten Start den **zentralen FreeLLMAPI-Schluessel** aus dem lokalen FreeLLMAPI-Dashboard unter „Schluessel“ eintragen. Den Google-Schluessel verwaltest du ausschliesslich dort.
4. Eine Nachricht schreiben. Enter sendet, Shift+Enter macht einen Absatz. Mit „Stoppen“ brichst du die Antwort ab.

`Claude.cmd` startet alternativ Claude Code im Ordner `%USERPROFILE%\Claude-Projekte` und bei Bedarf den Gateway im Hintergrund. Es verwendet den einmal im Chat gespeicherten zentralen Schluessel automatisch; falls noch keiner gespeichert ist, fragt es ihn verdeckt ab. Ein vorhandenes `FREELLMAPI_API_KEY` wird bevorzugt und bleibt erhalten. Der Schluessel wird nur im Kindprozess verwendet, nicht als Befehlsargument uebergeben. Es verwendet `auto`, sodass FreeLLMAPI das Modell waehlt. Der Starter aendert keine bestehende Claude-Konfiguration.

Zum Beenden der durch diesen Starter gestarteten Dienste `Stop.cmd` doppelt anklicken. Der Starter merkt sich Prozess-ID, Startzeit und Skriptpfad und beendet keine fremden oder manuell gestarteten Dienste. Das Schliessen des Chat-Browserfensters beendet die Hintergrunddienste nicht. Beim naechsten Mal wieder `Start.cmd` oder `Claude.cmd` starten. Kein Administratorzugang erforderlich. Windows kann bei heruntergeladenen Skripten eine Sicherheitsrueckfrage anzeigen; pruefe die mitgelieferten lokalen Dateien vor dem Ausfuehren.

**Umstieg von der bisherigen Version:** Alte manuell gestartete Server in ihren PowerShell-Fenstern zuerst mit Strg+C beenden. Danach `Start.cmd` aus dem aktualisierten Projektordner starten. Ein bereits in einem alten Fenster laufender Dienst wird wiederverwendet und kann nicht automatisch versteckt werden. Claude Code bleibt ein interaktives Terminalprogramm; fuer die Chat-Webseite benoetigst du dieses Terminal nicht.

Die einmal gespeicherte Chat-Verbindung bleibt unter `%LOCALAPPDATA%\NeuChat\gateway.json` erhalten. Der Browser mit dem FreeLLMAPI-Dashboard kann geschlossen werden. Laufzeit-Protokolle liegen unter `%LOCALAPPDATA%\NeuChat\logs`; sie koennen persoenliche Details enthalten und sollten nicht ungeprueft weitergegeben werden. Es wird kein Windows-Autostart eingerichtet: Nach einer Neuanmeldung einfach wieder `Start.cmd` oeffnen.

## Dateien anhaengen und verbessern lassen

Mit **„+ Dateien“**, per Drag-and-drop auf das Eingabefeld oder durch Einfuegen eines Bildes aus der Zwischenablage. Danach eine Frage oder einen Verbesserungswunsch schreiben und senden. Die App zeigt vorab an, welche Inhalte gelesen wurden. Erst beim Senden gehen diese Inhalte an den KI-Anbieter. „Speichern“ an einer Antwort laedt deren Text als TXT herunter; „Kopieren“ uebernimmt ihn in die Zwischenablage.

| Datei | Was die KI erhaelt |
| --- | --- |
| PNG, JPG, WebP, AVIF, GIF | Verkleinertes Bild; bei GIF nur erstes Einzelbild. Ein Vision-Modell ist erforderlich. |
| TXT, Markdown, CSV, JSON, Quellcode und weitere UTF-8-Textformate | Textinhalt. |
| PDF | Text aus maximal 30 Seiten, ohne eingebettete Bilder und Layout. Gescannten PDFs fehlt oft der Text; OCR ist nicht enthalten. |
| DOCX | Text, ohne Bilder und Layout. |
| ZIP, RAR | Bis zu 20 lesbare Dokumente, Code-/Textdateien oder Bilder. Uebersprungene Dateien werden aufgefuehrt. Keine Programme oder verschachtelten Archive. |
| MP4, MOV, M4V, WebM, MKV, AVI | Bis zu sechs Standbilder, ab Beginn etwa alle zehn Sekunden, nur erste 60 Sekunden. Kein Ton und keine vollstaendige Videoanalyse. |

Grenzen: maximal 5 Dateien pro Nachricht, 25 MB je Datei und 50 MB je Upload; Bilder maximal 25 Megapixel. Archive maximal 60 Eintraege und 15 MB entpackter Inhalt, keine Passwoerter oder mehrteiligen RARs. Text wird pro Datei auf 40.000 Zeichen begrenzt, mit Hinweis. Der Verlauf darf insgesamt maximal 120.000 Zeichen aus Anhaengen und 12 Bilder enthalten. Unterstuetzt ein gewaehltes Modell keine Bilder, „Automatisch“ verwenden und ein Vision-Modell in der FreeLLMAPI-Fallback-Kette aktivieren.

Die KI kann Texte oder Code ueberarbeiten sowie Bilder und Videostandbilder beurteilen und Verbesserungsvorschlaege machen. Sie bearbeitet keine Originaldateien auf dem PC. Bild-Retusche, Bildgenerierung, Video-Schnitt, OCR und Audio-Transkription sind hier nicht enthalten. Unbekannte Formate, alte DOC-Dateien, Tabellen im XLS/XLSX-Format, ausfuehrbare und passwortgeschuetzte Dateien werden nicht pauschal unterstuetzt. Eine Dateiendung allein ist kein Nachweis, dass ihr Inhalt gelesen wurde.

Dateien werden in einem separaten Prozess mit Zeit- und Speichergrenzen gelesen. Archive werden in den Speicher entpackt und niemals ausgefuehrt. Rohdaten und Videostandbilder liegen waehrend der Verarbeitung in einem zufaelligen temporaeren Ordner, der danach entfernt wird. Verarbeitete Inhalte bleiben im Arbeitsspeicher des lokalen Servers fuer bis zu 30 Minuten (Bereinigung im Minutentakt), solange du sie nicht vorher entfernst oder „Neuer Chat“ waehlst. Nach Ablauf oder Server-Neustart ist ein neuer Upload erforderlich. Es wird kein Dateiarchiv auf GitHub oder im Browser-Speicher angelegt.

**Update:** Im alten Projektordner zuerst `Stop.cmd` starten. Die neue ZIP entpacken und `Start.cmd` aus dem neuen Ordner verwenden. Vorhandene Anbieter- und Chat-Schluessel bleiben in ihren getrennten Datenordnern erhalten.

## Anbieter und automatischer Wechsel

Im FreeLLMAPI-Dashboard unter „Schluessel“ eigene Anbieter hinzufuegen, zum Beispiel Google/Gemini, Groq, Cerebras, Mistral oder OpenRouter. Nur Schluessel von eigenen Konten verwenden. Die kostenlosen Tarife, regionale Verfuegbarkeit und Zahlungsanforderungen direkt beim Anbieter pruefen; keine kostenpflichtigen Tarife ungeprueft aktivieren.

Unter „Fallback-Ketten“ geeignete Chat-Modelle aktivieren und die Reihenfolge festlegen. Fuer Claude Code Modelle mit Werkzeug-Unterstuetzung waehlen. Im Chat „Automatisch · mit Fallback“ verwenden. FreeLLMAPI verwaltet Limits und Wiederholungsversuche; es kann nur auf konfigurierte, passende Modelle mit verfuegbarem Kontingent wechseln. Angezeigte Modelle sind vom Gateway gemeldete Endpunkte und keine Garantie auf eine erfolgreiche Anfrage. Ein virtuelles `auto:<profil>` erscheint ebenfalls in der Modellwahl, wenn der Gateway es meldet.

600+ Katalogeintraege sind keine automatisch freigeschalteten Modelle. Milliarden kostenlose Token sind kein persoenlich zugesichertes Guthaben. Claude Code wird hier als Bedienoberflaeche benutzt; Anthropic-Claude-Modelle oder die Claude-Webseite werden nicht kostenlos freigeschaltet. Es gibt keine Garantie, dass Aufgaben bei erschoepften Kontingenten ohne Unterbrechung weiterlaufen.

## Daten und Schluessel

Chatverlaeufe bleiben nur im Speicher dieses Browser-Tabs. „Neuer Chat“ verwirft den Verlauf. Neuladen schliesst den Verlauf ebenfalls. Nachrichten werden zur Antworterzeugung ueber FreeLLMAPI an den ausgewaehlten Anbieter geschickt. Dieser Chat besitzt keine eigenen Werkzeuge und fuehrt KI-Antworten nicht als Code aus.

Der zentrale Gateway-Schluessel wird serverseitig unter `%LOCALAPPDATA%\NeuChat\gateway.json` gespeichert (Linux: `~/.config/NeuChat/gateway.json`). Er wird nie in einer API-Antwort ausgegeben. Die Datei enthaelt ihn im Klartext; unter Linux werden private Dateirechte gesetzt, unter Windows gelten die Rechte deines Benutzerprofils. Gib diese Datei, FreeLLMAPI-Datenbanken, `.env` oder API-Schluessel nicht weiter und lade sie nicht auf GitHub. Mit „Verbindung“ kannst du den Schluessel ersetzen. Zum Entfernen die genannte Datei bei gestopptem Chat loeschen.

Der Chat lauscht ausschliesslich auf Loopback, prueft Host und Browser-Ursprung und verwendet eine HttpOnly-Sitzung. Nicht ins oeffentliche Internet freigeben. Browser-Cache und Web-Storage werden nicht zur Speicherung von Schluesseln verwendet.

## Entwicklung und Cloud

```sh
npm ci
npm test
npm start
```

Gateway standardmaessig auf lokalem Port 3001, Chat auf Port 3210. Optional `NEU_CHAT_PORT` setzen. Fuer automatisierte Starts kann `FREELLMAPI_API_KEY` als Laufzeitvariable verwendet werden. Die Cloud-Umgebung kann alternativ `NEU_CHAT_ADMIN_FILE=/workspace/shared/freellmapi-state/credentials.json` setzen; der lokale Server meldet sich dann intern beim vorhandenen Gateway an. Nie Dateiinhalte oder Schluessel ausgeben.

Die Cloud ist vom Windows-PC getrennt. `Start.ps1` ist ausschliesslich fuer Windows; Cloud-Starts verwenden `node server.mjs`. Keine Git-Worktrees anlegen, sofern nicht ausdruecklich angefordert.

## Grenzen und Pruefungen

Die Tests pruefen Chat-Weiterleitung mit Verlauf, Streaming, Anbieterfehler, fehlende Schluessel, Browser-Ursprung, Authentifizierung, Schluesselspeicherung, echte Dateiextraktion aus PDF/DOCX/ZIP/RAR, Videostandbilder, Multimodal-Nachrichten und Upload-Grenzen. Eine echte gemeinsame Bild-/Textanfrage wurde mit Gemini im Browser bestaetigt. Ein Live-Wechsel zwischen mehreren Anbietern ist erst dann bestaetigt, wenn er tatsaechlich beobachtet wurde. Der Windows-Starter muss auf Windows geprueft werden; ein Linux-Test allein bestaetigt ihn nicht.

FreeLLMAPI ist ein eigenstaendiges Projekt: https://github.com/tashfeenahmed/freellmapi. Neu Chat ist keine offizielle OpenAI- oder Anthropic-Anwendung.
