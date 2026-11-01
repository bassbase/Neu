# Neu Chat

Dein eigener lokaler KI-Chat mit deutscher Oberflaeche, Modellwahl, laufend angezeigten Antworten und Verbindung zu FreeLLMAPI. Keine npm-Abhaengigkeiten fuer diesen Chat.

## Windows: starten

Voraussetzungen: Node.js 22 oder 24 und deine bereits eingerichtete FreeLLMAPI-Installation unter `%USERPROFILE%\FreeLLMAPI` mit mindestens einem funktionierenden Anbieter.

1. Diesen Projektordner herunterladen und entpacken.
2. `Start.cmd` doppelt anklicken. Der Starter startet FreeLLMAPI und den Chat, falls sie noch nicht laufen, und oeffnet deinen Browser.
3. Beim ersten Start den **zentralen FreeLLMAPI-Schluessel** aus dem lokalen FreeLLMAPI-Dashboard unter „Schluessel“ eintragen. Den Google-Schluessel verwaltest du ausschliesslich dort.
4. Eine Nachricht schreiben. Enter sendet, Shift+Enter macht einen Absatz. Mit „Stoppen“ brichst du die Antwort ab.

`Claude.cmd` startet alternativ Claude Code im Ordner `%USERPROFILE%\Claude-Projekte`, startet bei Bedarf den Gateway und fragt den zentralen Schluessel verdeckt ab. Es verwendet `auto`, sodass FreeLLMAPI das Modell waehlt. Der Starter aendert keine bestehende Claude-Konfiguration.

Lass die Serverfenster offen. Zum Beenden in den jeweiligen Fenstern Strg+C druecken. Beim naechsten Mal wieder `Start.cmd` oder `Claude.cmd` starten. Kein Administratorzugang erforderlich. Windows kann bei heruntergeladenen Skripten eine Sicherheitsrueckfrage anzeigen; pruefe die mitgelieferten lokalen Dateien vor dem Ausfuehren.

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
npm test
npm start
```

Gateway standardmaessig auf lokalem Port 3001, Chat auf Port 3210. Optional `NEU_CHAT_PORT` setzen. Fuer automatisierte Starts kann `FREELLMAPI_API_KEY` als Laufzeitvariable verwendet werden. Die Cloud-Umgebung kann alternativ `NEU_CHAT_ADMIN_FILE=/workspace/shared/freellmapi-state/credentials.json` setzen; der lokale Server meldet sich dann intern beim vorhandenen Gateway an. Nie Dateiinhalte oder Schluessel ausgeben.

Die Cloud ist vom Windows-PC getrennt. `Start.ps1` ist ausschliesslich fuer Windows; Cloud-Starts verwenden `node server.mjs`. Keine Git-Worktrees anlegen, sofern nicht ausdruecklich angefordert.

## Grenzen und Pruefungen

Die Tests pruefen Chat-Weiterleitung mit Verlauf, Streaming, Anbieterfehler, fehlende Schluessel, Browser-Ursprung, Authentifizierung und Schluesselspeicherung. Echte KI-Anfragen muessen mit dem vorhandenen Anbieterzugang separat geprueft werden. Ein Live-Wechsel zwischen mehreren Anbietern ist erst dann bestaetigt, wenn er tatsaechlich beobachtet wurde. Der Windows-Starter muss auf Windows geprueft werden; ein Linux-Test allein bestaetigt ihn nicht.

FreeLLMAPI ist ein eigenstaendiges Projekt: https://github.com/tashfeenahmed/freellmapi. Neu Chat ist keine offizielle OpenAI- oder Anthropic-Anwendung.
