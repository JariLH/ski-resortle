# Skiresortle – Spezifikation

Status: Entwurf. Offene Punkte sind mit `[ ]` markiert.

## Idee

Spieler erraten ein Skigebiet. Eine Karte zeigt, wie weit jeder Tipp vom gesuchten Gebiet entfernt ist.
Unter der Karte zeigt jeder Tipp Attribute mit richtig/falsch bzw. höher/niedriger.

## Attribute

- Land
- Pistenkilometer
- Höchster Punkt (m ü. NN)
- Anzahl Lifte

Offen:
- [ ] Vergleich bei Zahlen: nur höher/niedriger oder zusätzlich eine „nah dran“-Stufe? Ab welcher Abweichung?
- [ ] Bleibt es bei diesen vier Attributen?

## Karte

- [ ] Was wird pro Tipp angezeigt (Distanzkreis, Richtung, Entfernung in km)?
- [ ] Kartengrundlage

## Spielablauf

- [ ] Anzahl Tipps
- [ ] Modi (nur Tagesrätsel oder auch Übungsmodus)
- [ ] Wann wechselt das Tagesrätsel?
- [ ] Eingabe: Autocomplete, Umgang mit alternativen Namen
- [ ] Ende der Runde: was wird angezeigt, Teilen-Funktion
- [ ] Statistik und Serien

## Daten

- [ ] Was zählt als ein Gebiet (Ort oder Skiverbund)?
- [ ] Regionale Abdeckung und Mindestgröße
- [ ] Datenquelle und wie Pistenkilometer und Lifte gezählt werden
