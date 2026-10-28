// Übungen als Quelltext für data/exercises.js ausgeben.
//
// Nur für dev/build.mjs. Ohne DOM, damit es in node läuft.

import { SLOTS } from '../data/slots.js'

const quote = (s) => `'${String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** Ein Eintrag, eingerückt wie in der Quelldatei. */
export function sourceFor(exercise) {
  const dose = exercise.dose.type === 'reps'
    ? `{ type: 'reps', reps: ${exercise.dose.reps} }`
    : `{ type: 'time', seconds: ${exercise.dose.seconds} }`

  return [
    '  {',
    `    id: ${quote(exercise.id)},`,
    `    slot: ${quote(exercise.slot)},`,
    `    name: ${quote(exercise.name)},`,
    `    cue: ${quote(exercise.cue)},`,
    `    dose: ${dose},`,
    `    equipment: ${quote(exercise.equipment)},`,
    `    position: ${quote(exercise.position)},`,
    `    difficulty: ${exercise.difficulty},`,
    // Zeigt an, dass im Ordner eine Illustration liegt:
    // uebungen/<id>/illustration.svg. Ohne sie bleibt das Bildfeld leer.
    `    illu: ${exercise.illu ? 'true' : 'false'},`,
    '  },',
  ].join('\n')
}

function separator(n) {
  return `  // ${'-'.repeat(64)} Slot ${n}`
}

/**
 * Der ganze Pool, nach Slots gruppiert und innerhalb eines Slots nach
 * Schwierigkeit sortiert. Übungen mit unbekanntem Slot hängen hinten dran,
 * damit beim Speichern nichts verloren geht.
 */
export function poolSource(exercises) {
  const blocks = []
  const seen = new Set()
  SLOTS.forEach((slot, i) => {
    const mine = exercises
      .filter((e) => e.slot === slot.id)
      .sort((a, b) => a.difficulty - b.difficulty)
    if (!mine.length) return
    for (const e of mine) seen.add(e.id)
    blocks.push([separator(i + 1), ...mine.map(sourceFor)].join('\n'))
  })
  const rest = exercises.filter((e) => !seen.has(e.id))
  if (rest.length) {
    blocks.push(['  // Ohne bekannten Slot', ...rest.map(sourceFor)].join('\n'))
  }
  return `export const EXERCISES = [\n${blocks.join('\n\n\n')}\n]\n`
}

/**
 * Nur das Array in einer bestehenden Datei ersetzen. Header, Kommentare und
 * die Funktionen darunter bleiben damit Zeichen für Zeichen erhalten.
 */
export function replacePool(file, exercises) {
  const re = /export const EXERCISES = \[\n[\s\S]*?\n\]\n/
  if (!re.test(file)) throw new Error('EXERCISES-Array in data/exercises.js nicht gefunden')
  return file.replace(re, poolSource(exercises))
}

