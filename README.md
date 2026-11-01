# Neu Chat

Dein eigener lokaler KI-Chat mit deutscher Oberflaeche, Modellwahl, laufend angezeigten Antworten und Verbindung zu FreeLLMAPI. Keine npm-Abhaengigkeiten fuer diesen Chat.

## Windows: starten

Voraussetzungen: Node.js 22 oder 24 und deine bereits eingerichtete FreeLLMAPI-Installation unter `%USERPROFILE%\FreeLLMAPI` mit mindestens einem funktionierenden Anbieter.

1. Diesen Projektordner herunterladen und entpacken.
2. `Start.cmd` doppelt anklicken. Der Starter startet FreeLLMAPI und den Chat bei Bedarf im Hintergrund und oeffnet deinen Browser. Es muessen keine Server-Terminals geoeffnet bleiben.
3. Beim ersten Start den **zentralen FreeLLMAPI-Schluessel** aus dem lokalen FreeLLMAPI-Dashboard unter „Schluessel“ eintragen. Den Google-Schluessel verwaltest du ausschliesslich dort.
4. Eine Nachricht schreiben. Enter sendet, Shift+Enter macht einen Absatz. Mit „Stoppen“ brichst du die Antwort ab.

`Claude.cmd` startet alternativ Claude Code im Ordner `%USERPROFILE%\Claude-Projekte` und bei Bedarf den Gateway im Hintergrund. Es verwendet den einmal im Chat gespeicherten zentralen Schluessel automatisch; falls noch keiner gespeichert ist, fragt es ihn verdeckt ab. Ein vorhandenes `FREELLMAPI_API_KEY` wird bevorzugt und bleibt erhalten. Der Schluessel wird nur im Kindprozess verwendet, nicht als Befehlsargument uebergeben. Es verwendet `auto`, sodass FreeLLMAPI das Modell waehlt. Der Starter aendert keine bestehende Claude-Konfiguration.

Zum Beenden der durch diesen Starter gestarteten Dienste `Stop.cmd` doppelt anklicken. Der Starter merkt sich Prozess-ID, Startzeit und Skriptpfad und beendet keine fremden oder manuell gestarteten Dienste. Das Schliessen des Chat-Browserfensters beendet die Hintergrunddienste nicht. Beim naechsten Mal wieder `Start.cmd` oder `Claude.cmd` starten. Kein Administratorzugang erforderlich. Windows kann bei heruntergeladenen Skripten eine Sicherheitsrueckfrage anzeigen; pruefe die mitgelieferten lokalen Dateien vor dem Ausfuehren.

**Umstieg von der bisherigen Version:** Alte manuell gestartete Server in ihren PowerShell-Fenstern zuerst mit Strg+C beenden. Danach `Start.cmd` aus dem aktualisierten Projektordner starten. Ein bereits in einem alten Fenster laufender Dienst wird wiederverwendet und kann nicht automatisch versteckt werden. Claude Code bleibt ein interaktives Terminalprogramm; fuer die Chat-Webseite benoetigst du dieses Terminal nicht.

Die einmal gespeicherte Chat-Verbindung bleibt unter `%LOCALAPPDATA%\NeuChat\gateway.json` erhalten. Der Browser mit dem FreeLLMAPI-Dashboard kann geschlossen werden. Laufzeit-Protokolle liegen unter `%LOCALAPPDATA%\NeuChat\logs`; sie koennen persoenliche Details enthalten und sollten nicht ungeprueft weitergegeben werden. Es wird kein Windows-Autostart eingerichtet: Nach einer Neuanmeldung einfach wieder `Start.cmd` oeffnen.

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
