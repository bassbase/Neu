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

**Umstieg von der bisherigen Version:** Alte manuell gestartete Server in ihren PowerShell-Fenstern zuerst mit Strg+C beenden. Danach `Start.cmd` aus dem aktualisierten Projektordner starten. Ein passender Gateway wird wiederverwendet; beim Chat wird zusaetzlich die Programmversion geprueft. Claude Code bleibt ein interaktives Terminalprogramm; fuer die Chat-Webseite benoetigst du dieses Terminal nicht.

Die einmal gespeicherte Chat-Verbindung bleibt unter `%LOCALAPPDATA%\NeuChat\gateway.json` erhalten. Der Browser mit dem FreeLLMAPI-Dashboard kann geschlossen werden. Laufzeit-Protokolle liegen unter `%LOCALAPPDATA%\NeuChat\logs`; sie koennen persoenliche Details enthalten und sollten nicht ungeprueft weitergegeben werden. Es wird kein Windows-Autostart eingerichtet: Nach einer Neuanmeldung einfach wieder `Start.cmd` oeffnen.

## Versionspruefung und Upload-Fehler

Ab Version 1.2 prueft `Start.cmd` den Build ueber `/healthz`. Ein veralteter, vom eigenen Starter registrierter Chat-Dienst wird gezielt beendet und aus dem neuen Ordner gestartet. Laeuft auf Port 3210 noch eine manuell gestartete oder fremde App, wird sie nicht ungeprueft beendet: der Starter erklaert, dass sie in ihrem eigenen Fenster mit Strg+C zu beenden ist. Danach im Browser Strg+F5 druecken. So arbeitet eine neue Webseite nicht weiter gegen einen alten Server ohne Datei-Endpunkt. Die Webseite erkennt fehlende Versionsinformationen ebenfalls und zeigt eine Update-Anleitung statt nur „Nicht gefunden“.

## Chat, fertige Code-Projekte und Bilder

### Ein vollstaendiges bearbeitetes Projekt als ZIP

1. Das Original-ZIP oder RAR ueber „Dateien“ hochladen. Es erscheint oben als **Projektbasis** mit der Zahl der Originaldateien.
2. Die gewuenschten Verbesserungen anfordern. Die App sammelt vollstaendige geaenderte Dateien auch ueber mehrere KI-Antworten hinweg.
3. Oben oder unter einer Code-Antwort **„Ganzes Projekt als ZIP“** anklicken. Der Browser startet einen echten ZIP-Download. Im Download-Ordner liegt `<Originalname>-bearbeitet.zip`.

Das Paket enthaelt alle akzeptierten Originaldateien einschliesslich nicht von der KI gelesener Dateien, Binaerdateien und leerer Ordner. Nur eindeutig benannte, vollstaendige Codebloecke ersetzen Dateien; die neueste vollstaendige Version gewinnt. Fehlende neue Dateien werden ergaenzt. Originaldateien werden nicht automatisch geloescht. Mehrdeutige Pfade werden abgelehnt. Bei mehreren Archiven die richtige Projektbasis oben auswaehlen. Fuer ein ganz neues Projekt die Basis „Neues Projekt“ verwenden.

Erkannt werden `python filename=cogs/menu.py` im Kopf des Codeblocks, eine unzitierte erste Metadatenzeile `filename=cogs/menu.py` im Codeblock und ein eindeutiger Pfadkommentar wie `# cogs/menu.py`. Eine Metadatenzeile wird nicht in den heruntergeladenen Python-Code geschrieben. Ein Verzeichnisbaum als Text wird nicht als Programmdatei gepackt. Relative Pfade werden nur bei eindeutigem Treffer vorhandenen Originaldateien zugeordnet.

Abgeschnittene Codebloecke sind keine fertigen Dateien und werden nicht uebernommen. Die Anzeige nennt offene Dateien; **„Antwort fortsetzen“** fordert sie vollstaendig neu an. Nur lose Restzeilen ohne vollstaendigen Codeblock werden nicht an vorhandenen Code angehaengt. So bleiben Einrueckungen und zuvor fertige Dateien erhalten.

Jede ZIP enthaelt einen `NEU-PROJEKTBERICHT.json` mit unveraenderten, ersetzten und neuen Dateipfaden. Der Bericht sagt ausdruecklich, dass der Code nicht automatisch ausgefuehrt oder funktional getestet wurde. Eine vollstaendige ZIP-Struktur bedeutet nicht automatisch, dass der Bot inhaltlich fertig oder fehlerfrei ist. Ohne neue Code-Dateien ist der Export noch eine Kopie des Originals; die Oberflaeche zeigt das an.

Originaldateien bleiben nur im lokalen Arbeitsspeicher bis zum bisherigen Anhang-Ablauf (30 Minuten, Bereinigung im Minutentakt) oder „Neuer Chat“. Nach Server-Neustart oder Ablauf das Originalarchiv erneut hochladen und als Basis auswaehlen. Es wird dann kein unvollstaendiger Ersatz ohne Originaldateien ausgeliefert. Der ZIP-Export ist auf 100 Aenderungsdateien und 600.000 Byte Aenderungstext begrenzt; Upload-/Archivgrenzen gelten weiterhin. Aufgenommene Rohdateien werden nicht pauschal an die KI uebertragen.

Oben stehen drei Arbeitsmodi zur Auswahl:

- **Chat:** Schreiben, Fragen und Anhaenge analysieren. Antworten erscheinen als bereinigtes Markdown mit Tabellen und Codebloecken. „Chat exportieren“ speichert den Textverlauf als Markdown; Dateiinhalte und erzeugte Bilddaten werden nicht in diesen Export eingebettet.
- **Programmieren:** Die KI bekommt den Auftrag, mit vernuenftigen Standards direkt vollstaendige Dateien zu liefern. Jeder Codeblock bietet Kopieren und Datei-Download. Mehrere Dateien koennen als Projekt-ZIP heruntergeladen werden. Code mit Dateinamen wie `html filename=index.html` oder `javascript filename=app.js` wird erkannt. Bei einem Antwortlimit erscheint „Antwort fortsetzen“.
- **Bild erstellen:** Sendet deine Beschreibung an den FreeLLMAPI-Endpunkt `/v1/images/generations` und zeigt ein tatsaechlich zurueckgeliefertes PNG mit Download an. Es wird ein separater aktivierter Bildanbieter mit eigenem Bildkontingent gebraucht. Unter FreeLLMAPI → Modelle → Bilder einen verfuegbaren Anbieter aktivieren. Ein funktionierender Textzugang allein belegt keine Bildgenerierungs-Freigabe. Es gilt der Tarif des Bildanbieters; kostenlose Text-Token garantieren keine kostenlosen Bilder. Fehlt ein Bildmodell, erscheint eine konkrete Fehlermeldung. Externe Bild-URLs werden nicht automatisch abgerufen.

**HTML-Vorschau:** HTML-Dateien koennen direkt im Chat in einem separaten Sandbox-Frame angesehen werden. Zum Projekt passende CSS-/JS-Dateien werden fuer die Vorschau eingebunden. JavaScript kann innerhalb der Vorschau laufen, bekommt aber keinen Zugriff auf das Chat-Dokument, dessen Cookies oder Anbieter-Schluessel. Die Vorschau blockiert externe Ressourcen, Fetch-/XHR-Verbindungen, Unterframes und Formulare ueber CSP. Sie ist keine Betriebssystem-Sandbox: Node-, Python-, Shell- oder Backend-Code wird nicht ausgefuehrt. Solche Projekte kannst du herunterladen und bewusst in einer eigenen Entwicklungsumgebung starten. Externe Bibliotheken und Server-APIs sind in der Vorschau nicht verfuegbar. Die Vorschau ist nach 30 Minuten nicht mehr abrufbar.

Die Modellanweisungen kennen diese bereits installierte Anwendung. Sie sollen sinnvolle Entwuerfe direkt liefern und nur bei wirklich notwendigen fehlenden Angaben nachfragen, statt wiederholt eine neue Grundinstallation vorzuschlagen. Qualitaet und Fachwissen haengen weiterhin vom verbundenen Modell ab. Die KI kann auch bei einem als fertig bezeichneten Entwurf Fehler machen; pruefe Projekte vor produktivem Einsatz.

## Dateien anhaengen und verbessern lassen

Mit **„+ Dateien“**, per Drag-and-drop auf das Eingabefeld oder durch Einfuegen eines Bildes aus der Zwischenablage. Danach eine Frage oder einen Verbesserungswunsch schreiben und senden. Die App zeigt vorab an, welche Inhalte gelesen wurden. Erst beim Senden gehen diese Inhalte an den KI-Anbieter. „Speichern“ an einer Antwort laedt deren Text als Markdown-Datei herunter; „Kopieren“ uebernimmt ihn in die Zwischenablage.

| Datei | Was die KI erhaelt |
| --- | --- |
| PNG, JPG, WebP, AVIF, GIF | Verkleinertes Bild; bei GIF nur erstes Einzelbild. Ein Vision-Modell ist erforderlich. |
| TXT, Markdown, CSV, JSON, Quellcode und weitere UTF-8-Textformate | Textinhalt. |
| PDF | Text aus maximal 30 Seiten, ohne eingebettete Bilder und Layout. Gescannten PDFs fehlt oft der Text; OCR ist nicht enthalten. |
| DOCX | Text, ohne Bilder und Layout. |
| ZIP, RAR | Bis zu 20 lesbare Dokumente, Code-/Textdateien oder Bilder. Uebersprungene Dateien werden aufgefuehrt. Keine Programme oder verschachtelten Archive. |
| MP4, MOV, M4V, WebM, MKV, AVI | Bis zu sechs Standbilder, ab Beginn etwa alle zehn Sekunden, nur erste 60 Sekunden. Kein Ton und keine vollstaendige Videoanalyse. |

Grenzen: maximal 5 Dateien pro Nachricht, 25 MB je Datei und 50 MB je Upload; Bilder maximal 25 Megapixel. Archive maximal 60 Eintraege und 15 MB entpackter Inhalt, keine Passwoerter oder mehrteiligen RARs. Text wird pro Datei auf 40.000 Zeichen begrenzt, mit Hinweis. Der Verlauf darf insgesamt maximal 120.000 Zeichen aus Anhaengen und 12 Bilder enthalten. Unterstuetzt ein gewaehltes Modell keine Bilder, „Automatisch“ verwenden und ein Vision-Modell in der FreeLLMAPI-Fallback-Kette aktivieren.

Die KI kann Texte oder Code ueberarbeiten sowie Bilder und Videostandbilder beurteilen und Verbesserungsvorschlaege machen. Sie bearbeitet keine Originaldateien auf dem PC. Neue Bilder sind mit eigenem Bildanbieter im Modus „Bild erstellen“ moeglich. Bild-Retusche, Video-Schnitt, OCR und Audio-Transkription sind hier nicht enthalten. Unbekannte Formate, alte DOC-Dateien, Tabellen im XLS/XLSX-Format, ausfuehrbare und passwortgeschuetzte Dateien werden nicht pauschal unterstuetzt. Eine Dateiendung allein ist kein Nachweis, dass ihr Inhalt gelesen wurde.

Dateien werden in einem separaten Prozess mit Zeit- und Speichergrenzen gelesen. Archive werden in den Speicher entpackt und niemals ausgefuehrt. Rohdaten und Videostandbilder liegen waehrend der Verarbeitung in einem zufaelligen temporaeren Ordner, der danach entfernt wird. Verarbeitete Inhalte bleiben im Arbeitsspeicher des lokalen Servers fuer bis zu 30 Minuten (Bereinigung im Minutentakt), solange du sie nicht vorher entfernst oder „Neuer Chat“ waehlst. Nach Ablauf oder Server-Neustart ist ein neuer Upload erforderlich. Es wird kein Dateiarchiv auf GitHub oder im Browser-Speicher angelegt.

**Update:** Im alten Projektordner zuerst `Stop.cmd` starten. Die neue ZIP entpacken und `Start.cmd` aus dem neuen Ordner verwenden. Vorhandene Anbieter- und Chat-Schluessel bleiben in ihren getrennten Datenordnern erhalten.

## Anbieter und automatischer Wechsel

Im FreeLLMAPI-Dashboard unter „Schluessel“ eigene Anbieter hinzufuegen, zum Beispiel Google/Gemini, Groq, Cerebras, Mistral oder OpenRouter. Nur Schluessel von eigenen Konten verwenden. Die kostenlosen Tarife, regionale Verfuegbarkeit und Zahlungsanforderungen direkt beim Anbieter pruefen; keine kostenpflichtigen Tarife ungeprueft aktivieren.

Unter „Fallback-Ketten“ geeignete Chat-Modelle aktivieren und die Reihenfolge festlegen. Fuer Claude Code Modelle mit Werkzeug-Unterstuetzung waehlen. Im Chat „Automatisch · mit Fallback“ verwenden. FreeLLMAPI verwaltet Limits und Wiederholungsversuche; es kann nur auf konfigurierte, passende Modelle mit verfuegbarem Kontingent wechseln. Angezeigte Modelle sind vom Gateway gemeldete Endpunkte und keine Garantie auf eine erfolgreiche Anfrage. Ein virtuelles `auto:<profil>` erscheint ebenfalls in der Modellwahl, wenn der Gateway es meldet.

600+ Katalogeintraege sind keine automatisch freigeschalteten Modelle. Milliarden kostenlose Token sind kein persoenlich zugesichertes Guthaben. Claude Code wird hier als Bedienoberflaeche benutzt; Anthropic-Claude-Modelle oder die Claude-Webseite werden nicht kostenlos freigeschaltet. Es gibt keine Garantie, dass Aufgaben bei erschoepften Kontingenten ohne Unterbrechung weiterlaufen.

## Daten und Schluessel

Chatverlaeufe bleiben nur im Speicher dieses Browser-Tabs. „Neuer Chat“ verwirft den Verlauf. Neuladen schliesst den Verlauf ebenfalls. Nachrichten werden zur Antworterzeugung ueber FreeLLMAPI an den ausgewaehlten Anbieter geschickt. Die KI besitzt keinen Betriebssystemzugriff. HTML-Vorschauen koennen auf deinen Klick JavaScript im getrennten Browser-Sandbox-Frame ausfuehren.

Der zentrale Gateway-Schluessel wird serverseitig unter `%LOCALAPPDATA%\NeuChat\gateway.json` gespeichert (Linux: `~/.config/NeuChat/gateway.json`). Er wird nie in einer API-Antwort ausgegeben. Die Datei enthaelt ihn im Klartext; unter Linux werden private Dateirechte gesetzt, unter Windows gelten die Rechte deines Benutzerprofils. Gib diese Datei, FreeLLMAPI-Datenbanken, `.env` oder API-Schluessel nicht weiter und lade sie nicht auf GitHub. Mit „Verbindung“ kannst du den Schluessel ersetzen. Zum Entfernen die genannte Datei bei gestopptem Chat loeschen.

Der Chat lauscht ausschliesslich auf Loopback, prueft Host und Browser-Ursprung und verwendet eine HttpOnly-Sitzung. Nicht ins oeffentliche Internet freigeben. Browser-Cache und Web-Storage werden nicht zur Speicherung von Schluesseln verwendet.

## Entwicklung und Cloud

```sh
npm ci
npm test
npm run test:browser  # optional: Chromium erforderlich, CHROME_PATH bei Bedarf setzen
npm start
```

Gateway standardmaessig auf lokalem Port 3001, Chat auf Port 3210. Optional `NEU_CHAT_PORT` setzen. Fuer automatisierte Starts kann `FREELLMAPI_API_KEY` als Laufzeitvariable verwendet werden. Die Cloud-Umgebung kann alternativ `NEU_CHAT_ADMIN_FILE=/workspace/shared/freellmapi-state/credentials.json` setzen; der lokale Server meldet sich dann intern beim vorhandenen Gateway an. Nie Dateiinhalte oder Schluessel ausgeben.

Die Cloud ist vom Windows-PC getrennt. `Start.ps1` ist ausschliesslich fuer Windows; Cloud-Starts verwenden `node server.mjs`. Keine Git-Worktrees anlegen, sofern nicht ausdruecklich angefordert.

## Grenzen und Pruefungen

Die Tests pruefen Chat-Weiterleitung mit Verlauf, Streaming, Anbieterfehler, fehlende Schluessel, Browser-Ursprung, Authentifizierung, Schluesselspeicherung, echte Dateiextraktion aus PDF/DOCX/ZIP/RAR, Videostandbilder, Multimodal-Nachrichten und Upload-Grenzen. Eine echte gemeinsame Bild-/Textanfrage wurde mit Gemini im Browser bestaetigt. Ein Live-Wechsel zwischen mehreren Anbietern ist erst dann bestaetigt, wenn er tatsaechlich beobachtet wurde. Der Windows-Starter muss auf Windows geprueft werden; ein Linux-Test allein bestaetigt ihn nicht.

FreeLLMAPI ist ein eigenstaendiges Projekt: https://github.com/tashfeenahmed/freellmapi. Neu Chat ist keine offizielle OpenAI- oder Anthropic-Anwendung.
