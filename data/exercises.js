// ERZEUGT aus uebungen/<id>/uebung.md. Nicht von Hand ändern, sondern dort,
// danach: node dev/build.mjs (oder im Editor speichern, der macht es selbst).
//
// Übungspool. Drei bis vier Varianten pro Slot, aufsteigend nach `difficulty`.
// Die Illustration liegt als uebungen/<id>/illustration.svg daneben,
// `illu` sagt, ob sie da ist. Liegen stattdessen Einzelposen im Ordner
// (pos-1.svg, pos-2.svg …), sagt `frames`, wie viele: die App spielt sie als
// Daumenkino in Schleife und lässt die fertige Illustration liegen.

export const EXERCISES = [
  // ---------------------------------------------------------------- Slot 1
  {
    id: 'bws-katze-kuh',
    slot: 'mobility-bws',
    name: 'Katze und Kuh',
    cue: 'Im Vierfüssler. Wirbel für Wirbel aufrollen und wieder strecken. Ruhig atmen, Tempo langsam.',
    dose: { type: 'time', seconds: 60 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
  },
  {
    id: 'bws-sphinx',
    slot: 'mobility-bws',
    name: 'Sphinx',
    cue: 'Bauchlage, Unterarme unter den Schultern. Brustbein nach vorn und oben schieben, Schultern weg von den Ohren. Lende locker lassen.',
    dose: { type: 'time', seconds: 45 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'bws-stehende-katze',
    slot: 'mobility-bws',
    name: 'Stehende Katze',
    cue: 'Hüfte beugen, Hände auf den Oberschenkeln. Rücken runden und wieder lang machen. Ruhig atmen, Tempo langsam.',
    dose: { type: 'time', seconds: 45 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },


  // ---------------------------------------------------------------- Slot 2
  {
    id: 'pull-liegend-yt',
    slot: 'pull-upper',
    name: 'Liegend Y heben',
    cue: 'Bauchlage, Arme schräg nach vorn, Daumen hoch. Brustbein und Arme vom Boden lösen, Nacken lang.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
    frames: 2,
  },
  {
    id: 'pull-boden-rudern',
    slot: 'pull-upper',
    name: 'Rudern am Boden',
    cue: 'Bauchlage, Arme nach vorn. Ellbogen eng am Körper nach hinten ziehen, Schulterblätter zusammen.',
    dose: { type: 'reps', reps: 12 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'pull-stehend-yt',
    slot: 'pull-upper',
    name: 'Y und T im Stand',
    cue: 'Hüfte leicht beugen, Rücken lang. Arme schräg nach oben zum Y, dann seitlich zum T. Daumen nach oben, Schultern weg von den Ohren.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },
  {
    id: 'pull-stehendes-rudern',
    slot: 'pull-upper',
    name: 'Rudern im Stand',
    cue: 'Hüfte beugen, Rücken lang, Arme hängen lassen. Ellbogen eng am Körper nach hinten ziehen, Schulterblätter zusammen. Langsam zurück.',
    dose: { type: 'reps', reps: 12 },
    equipment: 'none',
    position: 'standing',
    difficulty: 4,
    illu: true,
  },


  // ---------------------------------------------------------------- Slot 3
  {
    id: 'scapula-boden-engel',
    slot: 'scapula',
    name: 'Boden-Engel',
    cue: 'Rückenlage, Arme im rechten Winkel. Handrücken bleiben am Boden, Arme langsam über den Kopf schieben.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
  },
  {
    id: 'scapula-schub-vierfuessler',
    slot: 'scapula',
    name: 'Schulterblatt-Schub',
    cue: 'Vierfüssler, Arme bleiben gestreckt. Nur zwischen den Schulterblättern absinken und wieder wegdrücken.',
    dose: { type: 'reps', reps: 12 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'scapula-stehender-schub',
    slot: 'scapula',
    name: 'Stehender Schub',
    cue: 'Arme auf Schulterhöhe nach vorn. Schulterblätter auseinander schieben, dann wieder zusammen ziehen. Ellbogen bleiben lang.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },
  {
    id: 'scapula-wandengel',
    slot: 'scapula',
    name: 'Engel an der Wand',
    cue: 'Rücken an die Wand, Ellbogen und Handrücken anlegen. Arme langsam nach oben schieben und wieder herunter. Lende bleibt an der Wand.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'standing',
    difficulty: 4,
    illu: true,
  },


  // ---------------------------------------------------------------- Slot 4
  {
    id: 'hipflexor-halber-kniestand',
    slot: 'hipflexor',
    name: 'Halber Kniestand',
    cue: 'Ein Knie am Boden, anderes Bein vorn. Becken nach vorn schieben, Steissbein einrollen. Je Seite 30 Sekunden.',
    dose: { type: 'time', seconds: 60 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
  },
  {
    id: 'hipflexor-kniestand-streckung',
    slot: 'hipflexor',
    name: 'Kniestand mit Armzug',
    cue: 'Aufrechter Kniestand. Gesäss fest, Rippen nach unten, dann Arme lang über den Kopf. Kein Hohlkreuz.',
    dose: { type: 'time', seconds: 45 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'hipflexor-ausfallschritt',
    slot: 'hipflexor',
    name: 'Ausfallschritt',
    cue: 'Ein Schritt nach vorn, hinteres Bein lang. Becken nach vorn schieben, Gesäss anspannen. Arm der hinteren Seite nach oben.',
    dose: { type: 'time', seconds: 45 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },


  // ---------------------------------------------------------------- Slot 5
  {
    id: 'glutes-bruecke',
    slot: 'glutes-core',
    name: 'Gesässbrücke',
    cue: 'Rückenlage, Füsse aufgestellt. Steissbein zuerst einrollen, dann Becken heben. Oben Gesäss fest anspannen.',
    dose: { type: 'reps', reps: 12 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
  },
  {
    id: 'core-dead-bug',
    slot: 'glutes-core',
    name: 'Dead Bug',
    cue: 'Rückenlage, Arme und Knie über Hüft- und Schulterachse. Gegengleich Arm und Bein lang machen, Lende bleibt am Boden.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'glutes-stehende-hueftstreckung',
    slot: 'glutes-core',
    name: 'Hüftstreckung im Stand',
    cue: 'Auf einem Bein stehen, am Türrahmen abstützen. Anderes Bein gestreckt nach hinten führen, Gesäss anspannen, Lende ruhig lassen.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },
  {
    id: 'glutes-beckenheben-stand',
    slot: 'glutes-core',
    name: 'Beckenheben im Stand',
    cue: 'Auf einem Bein stehen, anderes Bein frei. Becken auf der freien Seite absinken lassen, dann aus dem Standbein wieder anheben. Oberkörper bleibt ruhig.',
    dose: { type: 'reps', reps: 12 },
    equipment: 'none',
    position: 'standing',
    difficulty: 4,
    illu: true,
  },


  // ---------------------------------------------------------------- Slot 6
  {
    id: 'finish-kinn-nicken',
    slot: 'haltung-finish',
    name: 'Kinn-Nicken',
    cue: 'Rückenlage, Hinterkopf bleibt am Boden. Kinn minimal Richtung Kehle nicken, Nacken lang. Keine Kraft.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'floor',
    difficulty: 1,
    illu: true,
  },
  {
    id: 'finish-aufrechter-sitz',
    slot: 'haltung-finish',
    name: 'Aufrechter Sitz',
    cue: 'Fersensitz. Scheitel zur Decke wachsen lassen, Brustbein hoch, Kinn leicht zurück. Drei tiefe Atemzüge halten.',
    dose: { type: 'time', seconds: 45 },
    equipment: 'none',
    position: 'floor',
    difficulty: 2,
    illu: true,
  },
  {
    id: 'finish-nicken-stehend',
    slot: 'haltung-finish',
    name: 'Kinn-Nicken im Stand',
    cue: 'Aufrecht stehen, Scheitel lang nach oben. Kinn leicht zurück nehmen, als würdest du ein Doppelkinn machen. Schultern locker.',
    dose: { type: 'reps', reps: 10 },
    equipment: 'none',
    position: 'standing',
    difficulty: 3,
    illu: true,
  },
]


/**
 * Die Merkmale einer Übung, in der Reihenfolge, in der sie überall stehen.
 * Welche Werte es gibt, sagt der Pool: eine neue Lage oder ein neues
 * Hilfsmittel in uebung.md steht ohne Codeänderung in der Auswahl. Fehlt eine
 * Beschriftung, steht der Wert selber da, statt dass die Zeile leer bleibt.
 *
 * `tints` gibt jedem Wert einen Ton aus der Markenpalette (--tint-* im
 * Stylesheet). Er steht an jeder Stelle, an der das Merkmal auftaucht: an der
 * Marke in der Auswahl und an der Marke über der Übung. So ist die Farbe die
 * Eigenschaft und nicht die Dekoration. Fehlt ein Ton, bleibt die Marke grau.
 */
export const ATTRS = [
  {
    key: 'position',
    label: 'Lage',
    labels: {
      floor: 'Am Boden',
      standing: 'Im Stehen',
      seated: 'Im Sitzen',
    },
    tints: {
      floor: 'plum',
      standing: 'blue',
      seated: 'teal',
    },
  },
  {
    key: 'equipment',
    label: 'Hilfsmittel',
    labels: {
      none: 'Ohne Hilfsmittel',
      band: 'Mit Band',
      wall: 'An der Wand',
      chair: 'Mit Stuhl',
    },
    tints: {
      none: 'green',
      band: 'brick',
      wall: 'teal',
      chair: 'plum',
    },
  },
]

/**
 * Am Arbeitsplatz: im Stehen, ohne Hilfsmittel. Der eine Fall, für den die App
 * gemacht ist, steht darum als fester Filter da und nicht als Auswahl.
 */
export const WORK_FILTER = { position: ['standing'], equipment: ['none'] }

/** Die zwei Arten, einen Filter zu bekommen. */
export const MODES = [
  { id: 'work', label: 'Am Arbeitsplatz' },
  { id: 'free', label: 'Advanced' },
]

/** Beschriftung eines Merkmalswerts. */
export function attrLabel(key, value) {
  return ATTRS.find((a) => a.key === key)?.labels[value] ?? value
}

/** Ton eines Merkmalswerts, als Name aus der Palette. */
export function attrTint(key, value) {
  return ATTRS.find((a) => a.key === key)?.tints?.[value] ?? ''
}

/** Welche Werte eines Merkmals im Pool vorkommen, alphabetisch. */
export function attrValues(key) {
  return [...new Set(EXERCISES.map((e) => e[key]).filter(Boolean))].sort()
}

/** Die Merkmale mit ihren vorkommenden Werten, für die Auswahl. */
export function facets() {
  return ATTRS
    .map((a) => ({ key: a.key, label: a.label, values: attrValues(a.key) }))
    .filter((a) => a.values.length > 1)
}

/** Die Merkmale einer Übung, zum Anzeigen. */
export function attrsOf(exercise) {
  return ATTRS
    .filter((a) => exercise[a.key])
    .map((a) => ({
      key: a.key,
      value: exercise[a.key],
      label: attrLabel(a.key, exercise[a.key]),
      tint: attrTint(a.key, exercise[a.key]),
    }))
}

/**
 * Ob eine Übung zum Filter passt. Ein Merkmal, das der Filter nicht nennt oder
 * leer lässt, schränkt nicht ein: so bleibt ein gespeicherter Filter gültig,
 * wenn der Pool ein Merkmal dazubekommt.
 */
export function matches(exercise, filter = {}) {
  return ATTRS.every((a) => {
    const allowed = filter?.[a.key]
    return !Array.isArray(allowed) || allowed.length === 0 || allowed.includes(exercise[a.key])
  })
}

/** Der Filter, der aus den Vorlieben folgt. */
export function filterFor(prefs = {}) {
  return prefs.mode === 'free' ? (prefs.filter ?? {}) : WORK_FILTER
}

/**
 * Varianten eines Slots, aufsteigend nach difficulty und gefiltert nach den
 * Merkmalen. Passt keine, kommt die volle Liste zurück: lieber eine Übung, die
 * nicht ganz passt, als ein leerer Slot.
 */
export function variantsFor(slotId, filter = {}) {
  const all = EXERCISES
    .filter((e) => e.slot === slotId)
    .sort((a, b) => a.difficulty - b.difficulty)
  const fit = all.filter((e) => matches(e, filter))
  return fit.length ? fit : all
}

/** Slots, für die der Filter wirklich eine Übung übrig lässt. */
export function slotsMatching(filter) {
  return new Set(EXERCISES.filter((e) => matches(e, filter)).map((e) => e.slot))
}

export function byId(id) {
  return EXERCISES.find((e) => e.id === id) ?? null
}

/**
 * Deterministische Variantenwahl. Gleicher sessionCount ergibt immer
 * dieselbe Einheit, es gibt keine Zufallsquelle.
 *
 * Die allererste Einheit nimmt überall die leichteste Variante. Erst danach
 * greift der Slot-Offset, damit sich nicht alle Slots gleichzeitig umstellen.
 */
export function pickExercise(slot, sessionCount, filter = {}) {
  const variants = variantsFor(slot.id, filter)
  if (sessionCount === 0) return variants[0]
  return variants[(sessionCount + slot.offset) % variants.length]
}
