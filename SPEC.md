# Skiresortle – Spezifikation

Status: Entwurf. Offene Punkte sind mit `[ ]` markiert.

## Idee

Spieler erraten ein Skigebiet. Eine Karte zeigt, wie weit jeder Tipp vom gesuchten Gebiet entfernt ist.
Unter der Karte zeigt jeder Tipp Attribute mit richtig/falsch bzw. höher/niedriger.

## Attribute

- Land (wahr / falsch)
- Pistenkilometer (höher / niedriger)
- Anzahl Lifte (höher / niedriger)
- Höchster Punkt (m ü. NN) (höher / niedriger)
- maximale Höhendifferenz (höher / niedriger)

## Karte

- Karte zeigt über jedem Tipp die Entfernung in km
- Kartengrundlage: OpenStreetMap
- Kartendienst: OpenFreeMap mit MapLibre, Stil „Positron“
- Attribution „© OpenStreetMap-Mitwirkende“ ist immer sichtbar auf der Karte

## Spielablauf

- maximal 10 Tipps
- Modi: Tagesrätsel und Übungsmodus (für alle spielbar, zufälliges Gebiet, zählt nicht für die Serie)
- Tagesrätsel wechselt um 0:00 Uhr Berlin Zeit
- Eingabe: Zeile zum Eingeben, dabei werden zu eingabe passende Ergebnisse vorgeschlagen, wenn man nur ins Eingabefeld klickt werden alle Alphabetisch vorgeschlagen
- Tab-Taste im Eingabefeld schreibt den obersten Vorschlag in die Zeile (abgesendet wird erst mit Enter/Button)
- bei alternativen namen wird angezeigt: "Do you mean: " und dann der richtige Name, um das dann als guess einzuloggen muss man nochmal absenden
- Ende der Runde popup
- Serie, wie viele Tage hintereinander das Rätsel gelößt wurde

## Daten

- Datenquelle Skigebiete: OpenSkiData (openskidata.org), basiert auf OpenStreetMap
- Lizenz ODbL: Quellenangabe im Spiel, der abgeleitete Datensatz bleibt unter ODbL
- Weltweite abdeckung, es zählen nur tatsächliche Skigebiete, keine einzelnen Dorflifte (Bsp.: Skiarena Holzelfingen zählt,  Skilift Undingen vom TSV Undingen in Sonnenbühl zählt nicht) und keine Trainingsgelände, die nicht öffentlich zugänglich sind
- Mindestgröße: in Betrieb, mit Alpin-Pisten und Namen, mindestens 3 km Pisten und mindestens 3 Lifte
- Pistenkilometer: Gesamtlänge der Alpin-Pisten laut OpenSkiData (kein Langlauf)
- Lifte: alle Lifttypen außer Förderbändern. Ein Lift, der in OpenStreetMap in mehrere Abschnitte zerlegt ist, zählt einmal: Abschnitte mit gleichem Typ und Namen, die nahtlos aneinander anschließen, sind ein Lift (unbenannte Abschnitte nur bei Standseil- und Zahnradbahnen)
- Höchster Punkt: höchster Punkt von Pisten und Liften; Höhendifferenz: höchster minus tiefster Punkt von Pisten und Liften
- Länder eines Gebiets: die Länder, in denen seine Lifte stehen (ein Lift über die Grenze zählt für beide), sortiert nach Anzahl der Lifte. Ausnahmen in der Korrekturliste, z. B. wenn Pisten über die Grenze führen, aber alle Lifte auf einer Seite stehen
- Grenzüberschreitende Gebiete haben mehrere Länder; die Land-Zelle ist grün, wenn Tipp und Lösung mindestens ein Land gemeinsam haben
- Abgrenzung: Gebiete aus OpenSkiData werden übernommen, eine handgepflegte Korrekturliste schließt Verbünde und Fehleinträge aus, legt Teilgebiete zusammen und setzt Namen und Aliase. Gebiete, die OpenSkiData nur als Teil eines größeren Eintrags führt, bildet sie aus ihren Liften; eine Piste gehört dabei zum nächstgelegenen Lift
- Der Datensatz wird als Stand (Snapshot) eingecheckt, nicht bei jedem Deploy neu geladen

### Was zählt als ein Skigebiet

Ein Skigebiet ist ein zusammenhängendes Netz aus Liften und Pisten. Zwei Lifte gehören
zum selben Gebiet, wenn man zwischen ihnen in beide Richtungen nur mit Ski und Liften
wechseln kann.

Maßgeblich ist die Infrastruktur: Es zählt, was bei ausreichender Schneelage maximal
möglich ist. Ob eine Verbindung tatsächlich offen ist, spielt keine Rolle, also auch
nicht Saisonzeiten, Schneelage, Lawinensperren oder Betriebstage.

Als Verbindung zählen:
- markierte Pisten und Skirouten
- Lifte jeder Art, auch reine Zubringer- oder Verbindungsbahnen ohne Piste zurück

Keine Verbindung sind:
- Skibus, Auto, öffentliche Bahn
- Wege, für die man die Ski abschnallen muss
- Varianten und Touren ohne Markierung

Lifte und Pisten, die stillgelegt, abgebaut oder erst geplant sind, zählen nicht.

Ticket- und Marketingverbünde (z. B. OK Bergbahnen, Ski amadé, Dolomiti Superski)
sind keine Skigebiete und erscheinen nicht als Eintrag.

Name: der gängigste Name des zusammenhängenden Gebiets (z. B. „Fellhorn/Kanzelwand“).
Orte und Teilgebiete werden als Aliase hinterlegt (z. B. „Lech“ → Ski Arlberg).

## UI

- Website komplett auf englisch
- Fußzeile mit Rechtlichem
- hintergrundfarbe sehr helles grau
- viel whitespace (hellgrau), schlichtes design 
- alle Elemente mit abgerundeten Ecken (Apple design language)
- Buttons (Play today's Ski-Resortle, Practice, Show result, Challenge a friend, Back) sind Rechtecke mit leicht abgerundeten Ecken, keine Pillenform; gleicher Radius (14px) wie Eingabezeile, Absenden-Button und Tabellenzeilen

### Startseite

- oben mittig groß das Logo bzw. der Name
- darunter mittig ein Button "Play today's Ski-Resortle"
- darunter eine Anzeige für die Streak, wie viele Tage hintereinader das Ski-Resortle gelößt wurde
  - als illustrierte Bergkette (flach, blaugrau, Schneekappen): jeder Tag ist ein Gipfel, von links nach rechts, Tag 0 ist der Startpunkt im Tal
  - die Kette wandert mit: sichtbar sind die letzten 3 erreichten Gipfel, der aktuelle und die nächsten 3 (7 insgesamt)
  - zurückgelegter Weg als blaue Linie entlang des Grats, auf jedem erreichten Gipfel ein rotes Fähnchen; der offene Weg ist grau gestrichelt
  - jeder Gipfel trägt seine Zahl im Berg unter der Schneekappe: die aktuelle groß und weiß, alle anderen abgeschwächt

### Innerhalb einer Runde
- oben mittig groß Karte mit allen möglichen Skiegebieten, sonst keine Karteninformationen, die bisherigen Tipps sind rot markiert, wird der richtige gefunden wird er grün markiert
- unter der Karte mit etwas abstand die Zeile zum Eingeben des Tipps
- rechts neben der Zeile ein quadratischer Button zum Absenden des guesses, alternativ mit Enter absenden
- unter der Zeile zum Eingeben mit etwas Abstand eine "Tabelle" in der untereinader die Tipps stehen, dabei in dem Format: "Name des Resorts | Entfernung zur Lösung in km wie auf der Karte (graues Feld, beim Treffer grün) | Flagge des Landes (grün hinterlegt wenn richtig, sonst grau wie die anderen Felder) | Pistenkilometer (dahinter Pfeil mit higher / lower; wenn genau richtig, dann grün hinterlegt) | Anzahl Lifte (dahinter Pfeil mit higher / lower; wenn genau richtig, dann grün hinterlegt) | Gipfelsymbol mit Punkt an der Spitze für höchsten Punkt (dahinter Pfeil mit higher / lower; wenn genau richtig, dann grün hinterlegt) | Pfeil mit 2 Enden als Symbol für maximaler Höhendifferenz (dahinter Pfeil mit higher / lower; wenn genau richtig, dann grün hinterlegt)"
- über der obersten Zeile steht eine Kopfzeile mit den Kategorien: Resort | Distance | Country | Slopes | Lifts | Highest Point | Elevation Gain (erscheint ab dem ersten Tipp; die Zellen behalten ihre kleinen Beschriftungen/Icons). Auf dem Handy steht Distance rechts neben dem Namen
- die "Tabelle besteht hat keine Trennlinien, jede Zeile ist ein "Feld" in weiß, dazwischen ist etwas Platz
- gibt man einen neuen Tipp ab, wird die "Tabelle" um eine Zeile erweitert
- Karte, Eingabezeile und "Tabelle" passen zusammen auf den Bildschirm: die "Tabelle" scrollt in sich (Kopfzeile bleibt stehen) und scrollt nach jedem Tipp automatisch nach unten zum neuesten Tipp; auf dem Handy ist die Karte dafür etwas kleiner
- ganz unten Button "show result", dann zeigt es die Lösung und das Raten ist beendet
- wenn es richtig erraten wurde popup mit oben Groß die Karte herangezoomt aufs richtige Resort, unter der Karte Anzahl versuche und Zusammenfassung der abgegebenen Tipps, im popout außerdem der Button "Challenge a friend" (siehe unten); klickt man das popup weg kommt man wieder auf die Startseite

## Entscheidungen (Rückfragen vom 2026-11-04)

- Karte: alle Gebiete mit Namen eingezeichnet (grauer Punkt, grauer Name). Falsch getippte: roter Name, daneben Entfernung in km. Lösung: grüner Name
- Karte startet mit der Weltansicht und zoomt nach jedem Tipp so, dass alle Tipps sichtbar sind
- Klick auf ein Gebiet in der Karte schreibt den Namen ins Eingabefeld, abgesendet wird erst mit Button/Enter
- Pfeil höher/niedriger zeigt die Richtung der Lösung (Pfeil hoch = Lösung hat mehr)
- Doppelter Tipp: Hinweis „Already guessed“, zählt nicht als Versuch
- Unbekannte Eingabe: Hinweis „Unknown resort“, zählt nicht als Versuch
- Länderflaggen als Emoji
- Tagesrätsel: Liste mit festem Seed gemischt, Tag n nimmt Eintrag n (Tag 0 = 2026-01-01), danach von vorne
- Übungsmodus: Button „Practice“ auf der Startseite für alle, zufälliges Gebiet, zählt nicht für die Serie
- 10 Fehlversuche oder „show result“: gleiches Popup wie beim Gewinnen, Überschrift „The resort was“, Serie wird 0
- Erneuter Klick auf „Play today’s Ski-Resortle“ nach Rundenende: beendete Runde mit gesperrter Eingabe, Popup darüber
- Zusammenfassung im Popup: getippte Namen mit Entfernung
- Serie: +1 pro gelöstem Tag, bleibt sichtbar, solange gestern gelöst wurde; Niederlage oder ausgelassener Tag setzt auf 0
- Name/Logo: „Ski-Resortle“ als Text
- Fußzeile: Quellenangaben (OSM, OpenSkiData, ODbL) und Links „Legal notice“ / „Privacy“ auf Platzhalterseiten

### Challenge a friend

- ersetzt das frühere Teilen des Ergebnisses; Button "Challenge a friend" im End-Popup, auch im Übungsmodus
- erzeugt einen Link: auf Touch-Geräten über das System-Teilen-Menü, sonst in die Zwischenablage ("Link copied to clipboard")
- mitgeschickter Text ohne Spoiler: "I solved today's Ski-Resortle in 4 guesses. Can you beat me?" bzw. "I couldn't solve today's Ski-Resortle. Can you?" (Übungsmodus: "this Ski-Resortle")
- der Link enthält Datum, Gebiet, Tippfolge und Ergebnis des Herausforderers (kein Backend); im Übungsmodus spielt der Freund dadurch dasselbe Gebiet
- die Daten im Link sind verschleiert, damit man die Lösung nicht durch einfaches Base64-Dekodieren lesen kann (kein echter Schutz)
- wer den Link öffnet, landet direkt im heutigen Spiel; hat er heute schon gespielt, sieht er sofort das End-Popup mit dem Vergleich
- die Challenge wird für den Tag gespeichert: der Vergleich erscheint auch, wenn man später über die Startseite ins heutige Spiel kommt; ein zweiter Link vom selben Tag ersetzt den ersten
- Link von einem anderen Tag: wird ignoriert, über der Karte steht "This challenge has expired – here is today's Ski-Resortle"
- Vergleich im Popup unter "Solved in … / Not solved …" (ohne zusätzlichen Vergleichstext): beide Tippfolgen nebeneinander ("You" | "Challenger"), Tipp 1 neben Tipp 1 usw., jeweils Name und km, Treffer grün umrandet; der Kopf der Spalte mit weniger Tipps ist grün hinterlegt
