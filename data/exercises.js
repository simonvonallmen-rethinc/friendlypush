// ERZEUGT aus uebungen/<id>/uebung.md. Nicht von Hand ändern, sondern dort,
// danach: node dev/build.mjs (oder im Editor speichern, der macht es selbst).
//
// Übungspool. Drei bis vier Varianten pro Slot, aufsteigend nach `difficulty`.
// Die Illustration liegt als uebungen/<id>/illustration.svg daneben,
// `illu` sagt, ob sie da ist.

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

/** Varianten eines Slots, aufsteigend nach difficulty. */
/**
 * Varianten eines Slots. Ohne Boden bleiben nur Übungen im Stehen oder
 * Sitzen. Gibt es für einen Slot keine, kommt die volle Liste zurück: lieber
 * eine Bodenübung als ein leerer Slot.
 */
export function variantsFor(slotId, { floor = true } = {}) {
  const all = EXERCISES
    .filter((e) => e.slot === slotId)
    .sort((a, b) => a.difficulty - b.difficulty)
  if (floor) return all
  const upright = all.filter((e) => e.position !== 'floor')
  return upright.length ? upright : all
}

/** Slots, für die es überhaupt eine Übung ohne Boden gibt. */
export function uprightSlots() {
  return new Set(EXERCISES.filter((e) => e.position !== 'floor').map((e) => e.slot))
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
export function pickExercise(slot, sessionCount, opts = {}) {
  const variants = variantsFor(slot.id, opts)
  if (sessionCount === 0) return variants[0]
  return variants[(sessionCount + slot.offset) % variants.length]
}
