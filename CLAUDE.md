# Skiresortle

Tägliches Browser-Rätsel im Stil von Worldle/Wordle: Spieler erraten ein Skigebiet.
Rein statische Seite ohne Backend, gehostet auf GitHub Pages.

**Die Spielregeln stehen in `SPEC.md` und sind noch nicht fertig.**
Implementiere nur, was dort festgelegt ist. Wenn eine Regel fehlt oder unklar ist, frag nach, statt selbst zu entscheiden.

## Befehle

- `npm run dev`: Dev-Server
- `npm run check`: Typecheck + Tests. Muss vor jedem Commit grün sein, CI führt es ebenfalls aus.
- `npm run build`: Produktionsbuild nach `dist/`

## Stack

- Vite + Vanilla TypeScript (strict)
- Vitest für Tests
- Deploy: `.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht auf GitHub Pages
- Keine UI-Frameworks und keine neuen Dependencies ohne Rückfrage

## Konventionen

- UI-Texte und Kommentare auf Deutsch, Bezeichner auf Englisch
- Spiellogik als reine Funktionen ohne DOM-Zugriff, jeweils mit Vitest-Test; DOM-Code getrennt davon
- Muss auf dem Handy funktionieren
- Kleine Commits, ein Feature pro Commit
