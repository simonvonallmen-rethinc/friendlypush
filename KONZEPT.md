# friendly push

Haltungs-Mini-App. 10 Minuten, 3x pro Woche, gegen Rundrücken, vorgezogene Schultern und vorgekipptes Becken.

Primärer Mechanismus ist eine einseitige Geste: du trainierst, du motivierst eine Person, fertig. Es kommt nichts zurück und es gibt nichts zu schliessen. Wer über einen Link mitmacht, bekommt am Ende den Hinweis, sich bei der Person zu melden und ihr beim nächsten Mal selber den Push zu geben. Eine weitere Person zu motivieren ist eine Option, kein zweiter Vorgang.

Stand: 2026-10-26. Entscheide aus dem Grill-Durchgang, Iteration 1 gebaut.

## Entscheide

| Thema | Entscheid |
|---|---|
| Share-Tech | URL-Payload im Hash, kein Backend, kein Konto |
| Push-Modell | einseitig, eine Linkart: `invite`. Kein Rückweg, kein Abschluss |
| Nach dem Push | nichts. Wer mitmacht, gibt beim nächsten Mal selber weiter |
| Sidequest | noch eine Person motivieren, zählt als weiterer Push |
| Session-Logik | 6 Funktions-Slots, pro Slot rotierende Varianten aus dem Pool |
| Visualisierung | ein SVG-Skelett-Renderer, pro Übung 2 Posen plus Pfeile |
| Flow | ein Screen pro Übung, Timer auf Tap, manuelles Weiter |
| Erfolg | Wochenansicht als sieben Tage plus ein Satz zur Lage. Der Streak steht als Verlauf unten |
| Equipment | Tags none / towel / band, Pool filtert, Default none |
| Position | Tags floor / standing, pro Einheit umschaltbar (Am Arbeitsplatz / Andere) |
| Dosierung | fix, keine Progression. Variantenreihenfolge im Slot geht leicht nach schwer |
| Zählung | zählt ab 4 von 6, Abbruch 2 h resumable, max. 1 Einheit pro Tag fürs Wochenziel |
| Onboarding | Einladungs-Screen, dann sofort Übung 1. Name erst im Share-Schritt |
| Design | freundlich und rund, Pastellfläche pro Slot, Dark Mode über Tokens |
| Struktur | mehrere Dateien, ES-Module, kein Build |
| Hosting | friendlypush.ch, Upload von Hand auf einen Standard-Hoster |
| Einstieg | Landing-Screen beim ersten Besuch im Browser, danach nie wieder |
| Installation | PWA: Manifest, Icons, Service Worker. Kein Store, kein Wrapper |
| Aktualität | Service Worker fragt immer zuerst das Netz, der Cache ist nur Offline-Reserve |
| Umfang It. 1 | Push komplett, Pool 12 Übungen |

## Slots

1. `mobility-bws` Brustwirbelsäule mobilisieren
2. `pull-upper` Zugbewegung oberer Rücken
3. `scapula` Schulterblatt und Rotatoren
4. `hipflexor` Hüftbeuger dehnen (gegen Beckenkippe)
5. `glutes-core` Glutes und tiefe Bauchmuskulatur (gegen Beckenkippe)
6. `haltung-finish` Haltungsabschluss, Nacken und Aufrichtung

Rotation: `slot.variants[(sessionCount + slotOffset) % n]`, deterministisch aus der History.

Pool-Regel: pro Slot und Position mindestens zwei Varianten mit `equipment: none`. Minimum für volle Abdeckung 24 Übungen, mit Band-Varianten rund 30. Iteration 1 startet mit 12.

## Dateien

```
friendly-push/
  index.html
  styles.css
  app.js            State, Routing, Session-Flow
  data/slots.js     6 Slots, Reihenfolge, Offsets
  data/exercises.js Pool: Posen, Dosierung, Tags
  lib/skeleton.js   SVG-Renderer aus Gelenkkoordinaten
  lib/store.js      localStorage, History, Wochenziel, Streak
  lib/share.js      Payload encode / decode
  lib/library.js    Übungsübersicht und, lokal, der Editor
  lib/pwa.js        Installieren, Update anbieten, Cache anwärmen
  manifest.webmanifest
  sw.js             Service Worker: Netz zuerst, Cache als Reserve
  assets/           icon.svg als einzige Quelle, PNGs daneben
  dev/uebungen.html Raster über den ganzen Pool mit Filtern
  dev/flow.html     fährt die App im iframe durch einen Flow
  dev/icons.mjs     rastert alle Icons aus assets/icon.svg
  dev/pwa-check.html prüft auf der laufenden Adresse, ob installierbar
  dev/deploy-check.mjs vergleicht den Host mit dem, was zur App gehört
  .htaccess         optional, nur für Apache und LiteSpeed
```

`dev/` gehört nicht zur App und wird nirgends verlinkt.

Alle Pfade relativ, damit der Ordner 1:1 Repo-Root werden kann.

## Push und Payload

Eine Linkart, base64url-kodiertes JSON im Hash:

```
#p=<base64url>   { k: 'invite', f: Vorname, d: Datum }
```

`invite` heisst "ich habe trainiert, machst du mit?". Mehr tragen die Links nicht. Es gibt keine Kennung mehr: ohne Rückweg gibt es auch nichts, was zwei Seiten einander zuordnen müssten.

Der Link wird aus `location.origin + location.pathname` gebaut, überlebt also einen späteren Deploy ohne Codeänderung. Teilen über Web Share API, Fallback Clipboard.

### Ablauf

1. **A trainiert.** Abschluss-Screen: ein Schritt, "Eine Person motivieren". Verschickt `invite`, trägt den Push in `pushes` ein.
2. **B öffnet den Link.** Einladungs-Screen: "A hat heute trainiert", das Paar mit offenem Platz, ein Button. Der Start merkt sich A als `pushedBy`.
3. **B trainiert.** Abschluss-Screen: 🎉 plus der Hinweis, A Bescheid zu geben und A beim nächsten Mal den Push zu geben. Darunter derselbe eine Schritt wie bei A.
4. **B pusht beim nächsten Mal.** Geht der Link an einem späteren Tag raus, gilt die Geste als erwidert und `pushedBy` wird gelöscht. Am selben Tag nicht: der Link ging an jemand anderen.

Die Sidequest erscheint erst, nachdem der Hauptschritt wirklich rausgegangen ist, und zählt als weiterer Push.

Wer wirklich wen bekommen hat, weiss die App nicht: der Versand läuft ausserhalb. `pushes` hält nur die Tage fest.

## Annahmen, nicht eigens entschieden

- UI-Texte deutsch, nur der Name englisch
- Vorname in localStorage, jederzeit änderbar, kein Konto
- keine Analytics, keine externen Requests, keine Fonts von aussen
- kurzer Hinweis im Footer: bei Schmerzen abbrechen, kein medizinischer Rat
- Payload ist fälschbar. Bei einem Motivations-Push akzeptiert
- der Push ist sozial, nicht statistisch: die eigene Einheit zählt sofort fürs Wochenziel, unabhängig davon ob die andere Person mitmacht
- ob die gepushte Person wirklich trainiert, erfährt die App nie. Das ist Absicht: die Rückmeldung ist eine Nachricht zwischen Menschen, kein Zustand in der App

## Übungen ansehen und bearbeiten

"Alle Übungen" auf der Startseite zeigt den ganzen Pool, nach Bereichen gruppiert, mit Posenpaar, Dosierung und Hinweistext. Das kann jede Person.

Läuft die App auf einem Entwicklungs-Host (`localhost`, `127.0.0.1`, `::1`, oder eine Adresse auf `.localhost` oder `.test`), wird jede Karte antippbar und öffnet einen Editor:

- **Name und Hinweistext** als Felder.
- **Gelenke** als Kreise zum Ziehen. Die Knochenlängen bleiben fest, gezogen wird nur die Richtung.
- **Kontrollpunkte** als Rauten mit gestrichelter Führung: der Punkt der Rückenkurve (`spine`) und die Wölbung eines Pfeils (`curve`). Das sind die beiden Bezier-Grössen, die das Zeichenmodell kennt.
- **Lokal speichern** legt die Änderung unter `fp.dev.v1` in localStorage. Beim Start legt `applyOverrides()` sie auf den Pool, Übersicht und Training sehen also dasselbe.
- **Quelltext kopieren** gibt den Eintrag im Format von `data/exercises.js` aus, zum Dauerhaftmachen.
- **Zurücksetzen** wirft die lokale Änderung weg und stellt den Stand der Quelldatei wieder her.

Ohne lokalen Host gibt es keinen Editor: ein Werkzeug, dessen Ergebnis nirgends hinkommt, wäre nur Verwirrung.

## Abweichungen aus der Umsetzung

- **Erste Einheit immer leicht.** `pickExercise` ignoriert den Slot-Offset bei `sessionCount === 0`, sonst startet die allererste Einheit in der Hälfte der Slots mit der schweren Variante.
- **Abschluss unterscheidet den Grund.** Unter 4 von 6 heisst "Zählt noch nicht" mit Hinweis, zweite Einheit am selben Tag heisst "Heute schon erledigt".
- **Einstieg erklärt sich.** Beim ersten Besuch zeigt die Startseite drei Schritte und das Paar mit offenem Platz statt eines leeren Wochenziels.
- **Abschluss führt, statt zu berichten.** Oben der Push-Moment und genau ein Schritt, direkt darunter der Weg zurück, erst danach Wochenziel und Streak. Der Vorname wird im eigenen Platz des Paares eingetragen, nicht in einem Feld darunter: dort steht er nachher, also wird er auch dort gesetzt. Ist er gesetzt, steht im Platz der Name und daneben ein Stift; eine Zeile "Du teilst als …" darunter braucht es dafür nicht. Solange er fehlt, nimmt das Feld beim Aufschlagen den Fokus, wackelt kurz und der Knopf wartet abgeblendet; ab dem ersten Buchstaben steht er bereit, ohne dass erst aus dem Feld geklickt werden muss.
- **Woche statt Bruchzahl.** Die Startseite zeigt die laufende Woche als sieben Tage und darunter einen Satz, was jetzt dran ist: "Heute erledigt. Noch 2 Einheiten diese Woche." oder "Noch 3 Einheiten, aber nur 2 Tage. Das wird knapp." Die Punktreihe 1/3 und die 12-Wochen-Heatmap sind weg; unter "Verlauf" steht nur noch der Streak. `store.heatmap()` liegt weiter in `lib/store.js`, hat aber keinen Aufrufer mehr.
- **Push-Tage stehen im Kalender.** Ein Tag aus `pushes` ist ein Trainingstag und einer mehr: er behält die Fläche des erledigten Tages und bekommt zum Haken den Stern dazu. Auf der Startseite steht eine Karte: entweder wer dich gepusht hat, oder wie viele Personen du motiviert hast.
- **Bedienung unten.** Im Übungsmodus sitzen Fortschritt, Dosis und Schritte in einer festen Leiste am unteren Rand, der Inhalt steht darüber. Die Dosis hat eine eigene Zeile über den Schritten und zwei Formen: eine Zeitvorgabe ist erhaben und antippbar, der Füllstand läuft als Balken durch die Zeile; Wiederholungen liegen flach in der Slotfarbe und sind kein Bedienelement. Überspringen ist aus der Leiste in den Kopf der Übung gewandert, oben rechts, nur als Icon.
- **Icons aus Phosphor.** Phosphor Regular (MIT), als Inline-Sprite in `index.html` statt vom CDN, damit die App ohne Netz und ohne Abhängigkeit läuft. Sechs Symbole: FastForward, ArrowLeft, Play, Pause, Check, Repeat.
- **Rückwärts in der Einheit.** Ein Pfeil links neben dem Weiter-Knopf springt eine Übung zurück, bei der ersten ist er ausgeblendet. Übersprungene Übungen stehen in `active.skipped` und erscheinen im Fortschritt transparent gefüllt: angefasst, aber nicht abgehakt.
- **Vorlieben vor der Einheit.** Eine Frage, zwei Antworten: am Arbeitsplatz, oder andere. Steht offen über dem Startknopf, auf der Übersicht wie auf der Einladung. "Am Arbeitsplatz" ist der feste Filter `WORK_FILTER` (im Stehen, ohne Hilfsmittel) und der Default; "Andere" klappt die Merkmale des Pools als Wolke unter dem Toggle auf, jede Marke einzeln an- und abtippbar. Das Startband der Übersicht hat darum keine Mindesthöhe und keine Zentrierung mehr: es wächst nach unten, statt den Inhalt in gleicher Höhe zusammenzurücken. `variantsFor` filtert danach und fällt auf die volle Liste zurück, wenn ein Slot keine passende Übung hat; der Hinweis darunter sagt, für wie viele Slots das zutrifft.
- **Die Merkmale kommen aus dem Pool.** `ATTRS` nennt Reihenfolge und Beschriftungen, die Werte liest `attrValues` aus den Übungen. Eine neue Lage oder ein neues Hilfsmittel in `uebung.md` steht ohne Codeänderung in der Auswahl; ein Merkmal mit nur einem Wert bleibt aus der Auswahl weg, weil es nichts zu wählen gibt. Im Filter heisst ein nicht genanntes Merkmal "keine Einschränkung", darum verliert eine gespeicherte Auswahl nichts, wenn der Pool wächst.
- **Die eigene Auswahl bleibt.** `prefs.filter` hält genau die letzte Auswahl unter "Andere" und ist beim nächsten Mal wieder vorbelegt. Ein älterer Eintrag kannte nur `prefs.floor`: `false` wird zu `mode: 'work'`, `true` zu `mode: 'free'` ohne Einschränkung.
- **Die Übung sagt, was sie ist.** Über dem Bild stehen die Merkmale der laufenden Übung als Marken (Lage, Hilfsmittel). Wer aufgefordert wird, soll vor dem Anfangen sehen, worauf er sich einlässt, ohne die Anleitung aufzuklappen.
- **Ein Ton pro Merkmal.** Jeder Merkmalswert trägt einen Ton der Markenpalette, und zwar überall denselben: an der Marke in der Auswahl wie an der Marke über der Übung. Die Zuordnung steht bei den Merkmalen (`ATTRS.tints` in `data/exercises.js`), das Stylesheet übersetzt sie über `[data-tint]` in die `--tint-*`-Tokens, die im dunklen Modus von sich aus die aufgehellten Fassungen tragen. So ist die Farbe die Eigenschaft und nicht die Dekoration.
- **Die Startseite trägt eine Kopfzeile.** Marke, direkt daneben Einstellungen und "So funktioniert's" als `linkbtn`, dieselbe Form wie die Sprünge in der Kopfzeile der Erklärung. Die schwebende Leiste mit Zahnrad und Fragezeichen bleibt deshalb auf der Startseite weg; auf den übrigen Screens steht sie weiter. Ein Wort sagt mehr als ein Zeichen, und auf der Startseite ist der Platz dafür da.
- **"App Starten" führt in die App, nicht in eine Einheit.** Der Knopf in der Kopfzeile der Erklärung (`data-action="enter"`) geht auf die Übersicht, sobald etwas auf dem Gerät liegt (`store.hasData()`), und startet nur bei leerem Speicher direkt eine Einheit. Die Knöpfe im Hero und am Fuss der Seite bleiben der Weg ins Training.
- **Der Satz einer Einheit wird eingefroren.** `active.set` hält die sechs Übungs-Ids ab dem Start. Vorher wurde pro Screen neu gewählt, womit ein Wechsel der Vorlieben mitten im Lauf die schon erledigten Übungen ausgetauscht hätte. Resume und Zurück lesen aus demselben Satz.
- **Der Push nimmt die Übungen mit.** Der Payload trägt neben Name und Tag die Ids der zuletzt abgeschlossenen Einheit (`s`, höchstens acht). Wer den Link öffnet, hat die Wahl: dieselben Übungen oder ein eigener Satz nach den eigenen Vorlieben.
- **Jeder Slot hat eine Übung im Stehen.** Damit "Am Arbeitsplatz" einen vollständigen Satz ergibt und nicht auf den Boden zurückfällt: Stehende Katze, Y und T im Stand, Stehender Schub, Ausfallschritt, Hüftstreckung im Stand, Kinn-Nicken im Stand. Alle mit `position: standing` und `difficulty: 3`, damit sie in die Rotation kommen, ohne die erste Einheit zu besetzen.

- **Drei Slots haben eine zweite im Stehen.** Schultern, Rücken und Becken sind das, woran die App arbeitet, und das, was im Stehen am meisten hergibt: Rudern im Stand (oberer Rücken), Engel an der Wand (Schulterblatt), Beckenheben im Stand (Glutes und Core), alle `difficulty: 4`. Erst dadurch wechselt die Einheit auch im Stehen die Variante, statt jedes Mal dieselbe zu zeigen.
- **Ein Ordner pro Übung.** `uebungen/<id>/uebung.md` trägt die Angaben im Frontmatter und die Ansage als Text darunter, `uebungen/<id>/illustration.svg` die fertige Illustration mit beiden Posen. Damit lässt sich eine Übung für sich pflegen, ohne die App anzufassen. `data/exercises.js` ist nur noch das Ergebnis: `node dev/build.mjs` giesst die Ordner hinein, die App importiert es wie bisher und kommt weiter ohne Fetch aus.
- **Frontmatter mit JSON-Werten.** Werte, die mit `{`, `[` oder `"` beginnen, sind JSON, sonst Zahl, Wahrheitswert oder blanker Text; Listen stehen eingerückt als `- <json>`. Mehr Syntax hat `lib/front.js` nicht, und mehr braucht es nicht, damit die Dateien von Hand lesbar bleiben und kein YAML-Paket dazukommt.
- **Die Illustration ist eine Datei, kein Code.** `uebungen/<id>/illustration.svg` wird von Hand gezeichnet und über `<img>` geladen. Der gezeichnete Figurenrenderer (`lib/skeleton.js`), der Posen-Editor mit Griffen und die Posen im Frontmatter sind gestrichen: beides zu pflegen hiess, zwei Quellen für dasselbe Bild zu haben.

- **Bewegung als Daumenkino, nicht als Code.** Liegen im Ordner statt der einen Illustration die Einzelposen `pos-1.svg`, `pos-2.svg` und so weiter, spielt die App sie der Reihe nach in Schleife ab, 700 ms pro Bild. `dev/build.mjs` zählt die lückenlose Reihe ab 1 und schreibt sie als `frames` in den Pool. Gezeichnet wird dafür nichts Neues: dieselbe Datei pro Pose, nur ohne Platte und ohne Trennlinie, die Fläche gehört dem Bildfeld. Abgespielt wird mit einer CSS-Animation auf einem Streifen aller Posen nebeneinander, der in Stufen weiterrückt. Ein Zeitgeber in JavaScript müsste beim Screenwechsel angehalten werden und liefe sonst für jede einmal gesehene Übung weiter.
- **Eine neue Übung bekommt zuerst einen Entwurf.** `node dev/illu-entwurf.mjs` setzt aus zwei Posen der frontalen Figur (`lib/figure-front.js`) eine Karte im selben Aufbau zusammen: Platte, Pose oben, Pose unten, dazwischen die Lücke. Das ist kein Ersatz für Figma, sondern der Platzhalter davor: ein leeres Bildfeld sagt weniger als eine grobe Figur. Die Figur steht frontal, die gezeichneten Vorlagen stehen meist von der Seite; sobald die Zeichnung da ist, ersetzt sie die Datei. Das Skript läuft nicht im Build mit.

- **Fläche und Trennlinie gehören dem Container.** Die SVG bringt nur die Zeichnung. Hätte sie ihre eigene Fläche, könnte die Karte den Bildschirm nie ganz füllen, weil ein Bild mit festem Seitenverhältnis immer Ränder lässt. Die Trennlinie zwischen den beiden Posen zieht `.ex-figure::after` auf halber Höhe über die volle Breite; weil das Bild mittig sitzt, trifft sie die Lücke in jeder Containergrösse.
- **Ein fester Kartenton, eine Akzentfarbe.** `--card-bg: #2f6f5e` für jede Übungskarte, unabhängig vom Bereich und vom Modus: derselbe Teal trägt die Platte jeder `illustration.svg`, die Figur darauf ist `#fbf8f4`. Weil die Fläche so kräftig ist, liest sie sich hell wie dunkel gleich, und die Zeichnung braucht keine zweite Fassung. `--accent` ist derselbe Teal und schaltet darum ebenfalls nicht um; auf ihm steht Weiss. Die sechs Slotfarben sind weg; Farbe kommt aus der Illustration, nicht aus dem Bereich. Beide Dosis-Formen liegen weiss auf dem Hintergrund, sie unterscheiden sich darin, dass die Zeitvorgabe antippbar ist und Wiederholungen nur dastehen.
- **Gelöschtes wird archiviert, nicht entfernt.** Was der Editor löscht, wandert nach `uebungen/_archiv/<id>-<zeit>`. Ordner mit Unterstrich übergeht der Build, die Übung ist damit aus der App und trotzdem nicht weg.
- **Ein Screen vor der ersten Übung.** "Ready?" mit dem Maskottchen, einem Satz, der zur Lage passt (wer gepusht hat, angefangene Einheit, Wochenziel fast voll, Streak), und zwei Knöpfen. Vorher fiel man aus der Übersicht mitten in den Timer. Der Screen trägt denselben Aufbau wie eine Übung (Kopf, Fläche, Bedienung unten) und die Figur dieselbe Stelle und dasselbe Mass: der Start ist damit kein Sprung, sondern ein Wechsel des Inhalts.
- **Kein Editor mehr.** Angaben und Text stehen im `uebung.md`, die Zeichnung in der `illustration.svg` daneben. Beides bearbeitet man direkt, mit dem Texteditor und mit Figma. Eine Oberfläche dazwischen hätte nur dieselben Felder nochmal angezeigt. `node dev/build.mjs` giesst die Ordner in `data/exercises.js`, `node dev/server.mjs` liefert die App lokal aus, weil ES-Module über file:// nicht laden.
- **Ein Editor, zwei Oberflächen.** Karten, Posenpaar und Quelltext-Ausgabe liegen in `lib/library.js` und werden von der App und vom Raster in `dev/` geteilt. Die frühere Werkbank hatte eine eigene Kopie davon samt eigenem Drag-Code; die ist weg, das Raster filtert nur noch.
- **Kette gestrichen.** Die Vorgängerliste bis 8 Glieder ist dem Zweier-Loop gewichen. Sie verwässerte den Moment, auf den die App hinarbeitet.
- **Rückweg gestrichen.** Der Zweier-Loop mit `done`-Link, Loop-Kennung, `closedLoops` und eigenem "Ihr habt es beide geschafft"-Screen ist weg. Er verlangte von der zweiten Person einen zweiten Schritt, der nur dem Zählwerk der ersten diente. Geblieben ist die Geste selbst: eine Person motivieren, und wer motiviert wurde, meldet sich von sich aus und gibt beim nächsten Mal weiter.
- **Farben aus Figma.** `--hue-teal` `#2f6f5e`, `--hue-brick` `#833722`, `--hue-plum` `#7e446d`, `--hue-green` `#478147`, `--hue-blue` `#226383`, Hintergrund `#fbf8f4`. Die Slotflächen sind diese Hues als 20-Prozent-Tint auf dem Hintergrund, genau die Stufen aus dem Figma-Set. Fünf Hues auf sechs Slots: Slot 4 nimmt Teal in der kräftigeren Stufe.

- **Hover sagt nur an, was anfassbar ist.** Alle Hover-Regeln stehen in einem Block und nur hinter `@media (hover: hover) and (pointer: fine)`: auf dem Handy bliebe ein `:hover` nach dem Tippen stehen. Zwei Antworten reichen, eine Fläche wird eine Spur heller oder dunkler, ein Text tritt von `--ink-soft` nach `--ink` vor. Den Druck quittiert weiterhin `scale()`.
- **Die Anleitung ist eine Schublade.** Der Hinweistext einer Übung klappt über eine Zeile "Anleitung" auf und zu. Ab 740 Pixel Fensterhöhe steht er offen, darunter zu; ein Tipp gilt für die ganze Einheit. Der Übungsscreen hat dafür eine feste Höhe statt einer Mindesthöhe: aufgeklappt nimmt der Text der Illustration Platz weg, statt den Screen zu verlängern. Lesen soll kein Scrollen kosten, und die Bedienleiste darf nie aus dem Bild rutschen.

## Landing

Der Marketing-Einstieg, ein eigener Screen in derselben Datei. Er läuft, wenn kein Link im Hash steht, die History leer ist und die App im Browser statt installiert geöffnet wurde. Ab der ersten Einheit beginnt der Besuch auf der Übersicht; wer ihn nochmal sehen will, nimmt das Fragezeichen oben rechts.

Aufbau: Claim und Startknopf, der Push als eigene Fläche, drei Punkte zu dem, was die App nicht tut, warum Haltung kaputtgeht, die drei Schritte, die Installation, die Fragen, ein letzter Startknopf. Die sechs Bereiche standen hier auch einmal; das Band ist weg, die Übersicht der Bereiche steht in der Bibliothek. Breiter als die App und ab 720 Pixel mit der Illustration neben dem Text: er wird gelesen, nicht bedient.

Er erbt Knöpfe, Paar, Schritte und Karten aus der App. Eine zweite Seite mit eigenem CSS hätte dieselbe Marke zweimal gepflegt, und der Link aus einem Push würde dann auf die falsche Datei zeigen.

- **Eine Breite für die ganze Seite.** `--lp-max: 980px`, von der Kopfzeile und von jedem Band geteilt. Sie steht als Token, weil sonst zwei Stellen auseinanderlaufen und die Spalte über die Länge der Seite an zwei Kanten stünde.
- **Das Zeichen ist der Weg zurück.** Die Kopfzeile trägt keinen eigenen Pfeil mehr. Wer über das Fragezeichen hierherkommt, kommt über die Marke zurück; gibt es kein Zurück, bleibt die Marke eine Zeile Text (`role` und `tabindex` setzt `app.js`, nicht das Markup). Ein Knopf, der nirgends hinführt, wäre schlimmer als keiner.
- **Die Bilder kommen aus Figma.** Die drei Karten unter "Drei Dinge, die hier fehlen" tragen je ein Icon im Rahmen 40x40 (`assets/lp-fact-*.svg`), das Installations-Band und der Abschluss je eine Zeichnung im Rahmen 238x238 (`assets/lp-install.svg`, `assets/lp-final.svg`). Beide Zeichnungen stehen links, der Text daneben; auf dem Handy rutscht das Bild darüber und nimmt die halbe Spalte. Die Platzhalter davor sind ersetzt. Farben wie in den Übungszeichnungen fest, hell wie dunkel dasselbe: Teal `#2F6F5E` auf hellen Flächen (`#EAE4E7` für die Icon-Platte, `#EDF2ED` für den Gerätebildschirm, `#C9C3C5` für den Ring der Uhr). Das Installationsbild ist aus vier Figma-Teilen zu einer Datei zusammengesetzt, damit die Seite ein Bild lädt und nicht vier.
- **Im Hero stehen zwei Geräte.** Vorn der Übungsscreen, dahinter gekippt und angeschnitten der Abschluss: zwei Momente derselben Einheit. Das hintere ist Dekoration, trägt `aria-hidden` und fällt unter 720 Pixel weg, wo die Bühne zu eng dafür ist. Auch das hintere ist nachgebaut und nicht abfotografiert, sonst veraltete es mit dem nächsten Umbau der App.

## Als App installieren

`manifest.webmanifest` plus `sw.js`, beide im Wurzelordner, alle Pfade relativ. `start_url` und `scope` sind `./`, damit der Ordner auch in einem Unterordner eines Hosts liegen kann.

Die Icons liegen in `assets/`, nicht in `icons/`: Apache bringt von Haus aus ein `Alias /icons/` auf sein eigenes Icon-Verzeichnis mit, das mod_autoindex für Verzeichnislisten braucht. Ein eigener Ordner dieses Namens wird davon verdeckt, und zwar lautlos: das Verzeichnis antwortet, jede Datei darin ist 404.

`assets/icon.svg` ist die einzige Quelle, `node dev/icons.mjs` rastert daraus alle vier PNGs (192, 512, maskable 512, Apple 180). Gerastert wird mit dem Chrome, der ohnehin auf dem Rechner liegt; ein Paket dafür wäre die einzige Abhängigkeit des Projekts. Das Zeichen ist das Gesicht des Maskottchens, das auch auf dem Ready-Screen und der Landing steht.

Die maskable-Fassung wird gerechnet, nicht daneben gepflegt: randloser Hintergrund, die Zeichnung auf 0.76 um die Mitte geschrumpft, Rahmen inklusive. Android stanzt aus einem maskable-Icon einen Kreis, ein Quadrat mit runden Ecken oder sonst etwas; sicher ist nur die Mitte. 0.8 wäre die Regel, die ist aber auf das Quadrat gemünzt und lässt bei einem Kreis die Ecken des Motivs draussen.

Eine Falle dabei: die Quelle wird verschachtelt, nicht aufgeschnitten. Ihre Wurzel trägt `fill="none"`, und ohne das wird jeder gestrichene Bogen zur gefüllten Fläche. Verschachtelte SVG kann SVG, und die Verweise auf `defs` halten.

iOS liest kein Manifest. Was dort zählt, sind `apple-touch-icon` und die drei `apple-mobile-web-app-*`-Zeilen im Kopf. Darum sagt der Installationsteil der Landing auf Apple-Geräten "Teilen-Symbol, dann Zum Home-Bildschirm" und überall sonst entweder den Knopf aus `beforeinstallprompt` oder den Weg übers Browsermenü.

### Netz zuerst, nicht Cache zuerst

Der Worker fragt für jede Anfrage zuerst das Netz und legt die Antwort ab; der Cache springt nur ein, wenn das Netz nicht antwortet (nach vier Sekunden gilt es als nicht da). Damit ist eine geänderte `styles.css` oder ein neuer Übungstext beim nächsten Laden da, ohne dass jemand eine Versionsnummer hochzählt. Der umgekehrte Weg wäre schneller, aber er zeigt jede Änderung einen Besuch zu spät, und die App ist klein genug, dass der Unterschied nicht auffällt.

Eingelagert wird beim Installieren die Hülle: Seite, CSS, Module, Manifest, Icons, Maskottchen. Die Illustrationen stehen nicht in der Liste, sondern werden von der Seite nachgemeldet (`postMessage` mit `warm`), sobald sonst nichts läuft. So gibt es die Liste nur einmal, in `data/exercises.js`, und trotzdem läuft auch eine Einheit offline, die noch nie dran war.

### Deploy

Hochgeladen wird der Ordner wie er ist, alle Pfade sind relativ. `node dev/deploy-check.mjs https://friendlypush.ch` holt die Dateiliste aus git, lässt `dev/` und die Notizen weg und fragt jede übrige Datei beim Host ab. Beim Hochladen von Hand geht leicht ein ganzer Ordner vergessen; im Browser fällt das erst auf, wenn ein Icon fehlt, und dann steht in der Konsole nur eine der sechs Zeilen.

Zwei Dinge macht ein Standard-Hoster von sich aus falsch, beide stehen im optionalen `.htaccess`:

- **`.webmanifest` als `application/octet-stream`.** Chrome nimmt es hin, Safari ist strenger.
- **Keine Angabe zur Haltbarkeit.** Dann schätzt der Browser selbst und gibt eine Datei aus, ohne nachzufragen. `Cache-Control: no-cache` heisst nicht "nicht ablegen", sondern "immer nachfragen", und kostet bei unveränderten Dateien nur ein 304 ohne Inhalt.

Unabhängig davon fragt der Service Worker inzwischen selbst mit `cache: 'no-cache'` an. Sonst hinge das Versprechen "Netz zuerst" an den Kopfzeilen des Hosts: `fetch` geht normalerweise durch den HTTP-Cache des Browsers, und der hätte ohne Angabe geschätzt.

### Wenn kein Installationsangebot kommt

`dev/pwa-check.html` unter derselben Adresse öffnen, unter der die App läuft. Die Seite prüft sicheren Kontext, Manifest samt Content-Type, Pflichtfelder, jedes Icon, Scope, Anzeigemodus und ob `beforeinstallprompt` innerhalb von zehn Sekunden feuert, und trennt im Urteil, was die Installation verhindert und was nur Offline betrifft.

Die häufigsten Gründe, in dieser Reihenfolge:

1. **Kein sicherer Kontext.** Nur `https://`, `localhost` und `127.0.0.1` zählen. Eine Adresse wie `192.168.1.20:8731` oder `file://` fällt durch, ohne Fehlermeldung.
2. **Brave zeigt nie ein Symbol in der Adressleiste.** Der Weg dort ist das Menü ☰ → "App installieren…".
3. **Chrome versteckt das Symbol in schmalen Fenstern.** Dann steht es im Menü ⋮ unter "Übertragen, speichern und teilen".
4. **Falscher Content-Type.** Manche Server liefern `.webmanifest` als `text/plain` aus, dann verwirft der Browser das Manifest stillschweigend. `dev/server.mjs` liefert `application/manifest+json`.
5. **Schon installiert.** Dann gibt es kein Angebot mehr.
6. **Ein Ordnername, den der Server für sich beansprucht.** `/icons/` ist bei Apache belegt, siehe oben. `dev/deploy-check.mjs` findet so etwas, weil es jede Datei einzeln abfragt statt sich auf den Dateimanager zu verlassen.

Ein Service Worker ist für die Installation längst nicht mehr nötig, nur für Offline. Er fällt in der Prüfung darum nicht unter die Blocker.

### Updates werden angeboten

Eine neue Fassung übernimmt nicht von selbst. Sie wartet, und die Seite zeigt oben eine Zeile "Neue Fassung bereit" mit einem Knopf. Mitten in einer Einheit neu zu laden wäre ein Abbruch, und nötig ist es nicht: die Inhalte sind durch "Netz zuerst" ohnehin aktuell, der Austausch betrifft nur die Hülle. Der Knopf schickt `skip-waiting` an den wartenden Worker und lädt beim `controllerchange` neu.

## Iteration 2

18 weitere Varianten: `band`, `towel`, `standing`-Abdeckung aller Slots. Reine Datenarbeit in `data/exercises.js`.
