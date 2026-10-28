# friendly push

Haltungs-Mini-App. 10 Minuten, 3x pro Woche, gegen Rundrücken, vorgezogene Schultern und vorgekipptes Becken.

Läuft auf **[friendlypush.ch](https://friendlypush.ch)**.

## Was das ist

Ein Fun-Side-Projekt und Experiment: eine Fitness-App, die unterhaltsam ist und Leute gegenseitig motiviert, **ohne Account, ohne Datenbank, ohne Backend**. Der ganze Zustand liegt im `localStorage`, geteilt wird über einen Link mit base64url-kodiertem Payload im Hash. Nichts kommt zurück, nichts muss abgeschlossen werden: du trainierst, du gibst einer Person einen Push, fertig. Wer über den Link mitmacht, gibt beim nächsten Mal selber weiter.

## Wie es gemacht ist

- **Code**: vibe coded.
- **Illustrationen**: handgezeichnet.
- **Texte**: generiert.
- Insgesamt experimentell. Keine Garantie auf saubere Architektur, Tests oder Rückwärtskompatibilität.

## Stand und Ziel

21 Übungen in 6 Funktions-Slots (Brustwirbelsäule, oberer Rücken, Schulterblatt, Hüftbeuger, Glutes und Core, Aufrichtung), pro Slot rotierende Varianten. Ziel ist, die Übungen weiter auszubauen: mehr Varianten pro Slot und Position (Boden / stehend), damit die Rotation länger abwechslungsreich bleibt.

## Technik

Statische PWA, kein Build, kein Framework. ES-Module, relative Pfade, Upload von Hand. Service Worker fragt immer zuerst das Netz, der Cache ist nur Offline-Reserve.

Details zu Konzept, Entscheiden und Dateistruktur: [KONZEPT.md](KONZEPT.md).

`dev/` gehört nicht zur App und wird nirgends verlinkt.
