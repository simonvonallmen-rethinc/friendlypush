// Übungsübersicht.
//
// Nur Anzeige. Gepflegt werden die Übungen in uebungen/<id>/: Angaben und
// Text im uebung.md, daneben die fertige illustration.svg.

import { variantsFor } from '../data/exercises.js'
import { SLOTS } from '../data/slots.js'

const slotOf = new Map(SLOTS.map((s) => [s.id, s]))

export function doseText(dose) {
  if (dose.type === 'reps') return `${dose.reps} Wiederholungen`
  return dose.seconds >= 60 ? `${dose.seconds / 60} Minute` : `${dose.seconds} Sekunden`
}

/**
 * Bildfeld einer Übung. Ohne Illustration bleibt es leer statt kaputt: die
 * Datei kann noch fehlen, die Übung soll trotzdem laufen.
 * @param {string} className Klasse des Feldes, je nach Ort ein anderes Mass
 */
export function figureFor(exercise, className) {
  const box = document.createElement('div')
  box.className = className
  if (!exercise.illu) return box

  const img = document.createElement('img')
  img.className = 'ex-illu'
  img.src = `uebungen/${exercise.id}/illustration.svg`
  img.alt = ''
  box.append(img)
  box.toggleAttribute('data-illu', true)
  return box
}

/** Karte für die Übersicht. */
export function exerciseCard(exercise) {
  const slot = slotOf.get(exercise.slot)
  const el = document.createElement('div')
  el.className = 'exercise-card'

  const head = document.createElement('div')
  head.className = 'exercise-head'
  const title = document.createElement('h2')
  title.textContent = exercise.name
  const meta = document.createElement('p')
  meta.textContent = `${slot?.label ?? exercise.slot} · ${doseText(exercise.dose)}`
  head.append(title, meta)

  const cue = document.createElement('p')
  cue.className = 'cue'
  cue.textContent = exercise.cue

  el.append(head, figureFor(exercise, 'exercise-figure'), cue)
  return el
}

/** Die ganze Liste, nach Slots gruppiert. */
export function renderList(container) {
  container.replaceChildren()
  for (const slot of SLOTS) {
    const group = document.createElement('section')
    group.className = 'exercise-group'

    const label = document.createElement('p')
    label.className = 'eyebrow'
    label.textContent = `${slot.label} · ${slot.hint}`
    group.append(label)

    for (const exercise of variantsFor(slot.id)) group.append(exerciseCard(exercise))
    container.append(group)
  }
}
