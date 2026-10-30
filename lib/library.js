// Übungsübersicht.
//
// Nur Anzeige. Gepflegt werden die Übungen in uebungen/<id>/: Angaben und
// Text im uebung.md, daneben die fertige illustration.svg oder, wer die
// Bewegung zeigen will, die Einzelposen pos-1.svg, pos-2.svg und so weiter.

import { variantsFor } from '../data/exercises.js'
import { SLOTS } from '../data/slots.js'

const slotOf = new Map(SLOTS.map((s) => [s.id, s]))

export function doseText(dose) {
  if (dose.type === 'reps') return `${dose.reps} Wiederholungen`
  return dose.seconds >= 60 ? `${dose.seconds / 60} Minute` : `${dose.seconds} Sekunden`
}

/** Wie lange ein Einzelbild des Daumenkinos stehen bleibt. */
const FRAME_MS = 700

/**
 * Bildfeld einer Übung. Liegen Einzelposen im Ordner, laufen sie als
 * Daumenkino, sonst steht die fertige Illustration da. Ohne beides bleibt
 * das Feld leer statt kaputt: die Datei kann noch fehlen, die Übung soll
 * trotzdem laufen.
 * @param {string} className Klasse des Feldes, je nach Ort ein anderes Mass
 */
export function figureFor(exercise, className) {
  const box = document.createElement('div')
  box.className = className
  if (exercise.frames) return fillFlipbook(box, exercise)
  if (!exercise.illu) return box

  const img = document.createElement('img')
  img.className = 'ex-illu'
  img.src = `uebungen/${exercise.id}/illustration.svg`
  img.alt = ''
  box.append(img)
  box.toggleAttribute('data-illu', true)
  return box
}

/** Die Posen einer Übung als Pfade, in der Reihenfolge des Ablaufs. */
export function frameUrls(exercise) {
  return Array.from({ length: exercise.frames ?? 0 },
    (_, i) => `uebungen/${exercise.id}/pos-${i + 1}.svg`)
}

/**
 * Die Posen nebeneinander auf einem Streifen, der in Stufen um je ein Bild
 * weiterrückt und von vorne beginnt. Das macht die CSS-Animation allein: ein
 * Zeitgeber müsste angehalten werden, wenn der Screen wechselt, und würde
 * sonst für jede Übung weiterlaufen, die man einmal gesehen hat.
 */
function fillFlipbook(box, exercise) {
  const urls = frameUrls(exercise)
  const strip = document.createElement('div')
  strip.className = 'ex-flip'
  for (const url of urls) {
    const img = document.createElement('img')
    img.className = 'ex-frame'
    img.src = url
    img.alt = ''
    strip.append(img)
  }
  // Eine einzelne Pose ist kein Ablauf. Sie steht dann einfach da.
  if (urls.length > 1) {
    strip.style.animationDuration = `${urls.length * FRAME_MS}ms`
    strip.style.animationTimingFunction = `steps(${urls.length})`
  }
  box.style.setProperty('--frames', String(urls.length))
  box.append(strip)
  box.toggleAttribute('data-flip', true)
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
