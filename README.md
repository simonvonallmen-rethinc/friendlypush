#### 🚀 Beta: Die Idee steht. Alles andere ist noch experimentell und kann sich jeden Tag ändern. Die Übungen sind bisher Platzhalter und werden später verfeinert, ergänzt oder ersetzt. Stay tuned!


# friendly push

Haltungs-Mini-App. 10 Minuten, 3x pro Woche, gegen Rundrücken, vorgezogene Schultern und vorgekipptes Becken.

Läuft auf **[friendlypush.ch](https://friendlypush.ch)**


## Was das ist

Ein Fun-Side-Projekt und Experiment: eine Fitness-App, die unterhaltsam ist und Leute gegenseitig motiviert, **ohne Account, ohne Datenbank, ohne Backend**. Der ganze Zustand liegt im `localStorage`, geteilt wird über einen Link mit base64url-kodiertem Payload im Hash. Nichts kommt zurück, nichts muss abgeschlossen werden: du trainierst, du gibst einer Person einen Push, fertig. Wer über den Link mitmacht, gibt beim nächsten Mal selber weiter.


## Wie es gemacht ist

- **Code:** Vibe coded
- **Illustrationen:** Handgezeichnet (dgital)
- **Texte:** Generiert
- **Insgesamt:** Experimentell. Keine Garantie auf saubere Architektur, Tests oder Rückwärtskompatibilität.


## Stand und Ziel

Work in progress. Grundgerüst und Konzept steht. Inhalt ist noch ein grosses TODO :) 


## Technik

Statische PWA, kein Build, kein Framework. Ziel möglichst ohne Hosting Gebühren, Datenbank, etc. Unt trotzdem spannende motivierende user flows :) 


## Dev-Notes

### Lokal starten

```
node dev/server.mjs
```

Dann **http://127.0.0.1:8731**. Mit `PORT=1234 node dev/server.mjs` auf einem anderen Port. Der Server liefert nur Dateien aus, lesend und nur aus dem Projektordner: ES-Module laden über `file://` nicht, mehr braucht es dafür nicht.

### Eine Übung pflegen

Jede Übung ist ein Ordner unter `uebungen/<id>/`:

- `uebung.md` trägt die Angaben im Frontmatter und die Ansage als ersten Absatz darunter
- `illustration.svg` ist die fertige Zeichnung mit beiden Posen
- **oder** `pos-1.svg`, `pos-2.svg`, `pos-3.svg` … als Einzelposen: dann spielt die App sie als Daumenkino in Schleife ab, 700 ms pro Bild, und die `illustration.svg` bleibt liegen

Ordner mit Unterstrich bleiben aussen vor, `_archiv/` ist also ein Versteck, ohne etwas zu löschen.

### Nach jeder Änderung: bauen

```
node dev/build.mjs
```

Das giesst die Ordner nach `data/exercises.js`. Die App importiert diese Datei und kommt darum ohne Fetch aus. **Ohne diesen Schritt sieht die App nichts:** eine neue `pos-3.svg` ist erst nach dem Build da, und der Browser braucht danach ein Neuladen.

Gezählt wird nur die lückenlose Reihe ab `pos-1.svg`. `pos-1` und `pos-3` ohne `pos-2` ergibt eine einzelne Pose und keinen Ablauf: eine Lücke wäre ein Loch im Daumenkino.

### Deploy prüfen

```
node dev/deploy-check.mjs https://friendlypush.ch
```

Vergleicht jede Datei, die zur App gehört, mit dem, was auf dem Host wirklich liegt. Beim Hochladen von Hand geht leicht ein ganzer Ordner vergessen.

### WebStorm

`.idea/` ist nicht im Repo, die folgenden Einstellungen sind also pro Rechner neu zu machen.

**Run-Konfigurationen** (Run → Edit Configurations → `+` → Node.js), Working directory jeweils der Projektordner:

| Name | JavaScript file | Parameter |
| --- | --- | --- |
| Server | `dev/server.mjs` | |
| Uebungen bauen | `dev/build.mjs` | |
| Deploy pruefen | `dev/deploy-check.mjs` | `https://friendlypush.ch` |

**File Watcher**, damit der Build von selbst läuft (Settings → Tools → File Watchers → `+` → custom):

- File type: Any, Scope: ein eigener Scope `uebungen` mit dem Muster `file[friendlypush]:uebungen//*`
- Program: der Pfad zu `node` (aus dem Dock gestartet findet WebStorm `node` oft nicht im PATH, darum absolut)
- Arguments: `dev/build.mjs`, Working directory: `$ProjectFileDir$`
- Output paths to refresh: `$ProjectFileDir$/data/exercises.js`
- «Auto-save edited files to trigger the watcher» aus, «Trigger the watcher on external changes» an: eine aus Figma exportierte `pos-3.svg` landet von aussen im Ordner und soll den Build anstossen.
