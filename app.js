// State, Routing, Session-Flow.
// Ein Screen gleichzeitig, Templates aus index.html, kein Router und keine
// History-API: der Hash gehört dem Share-Payload.
//
// Kern ist eine Geste: du trainierst, du motivierst eine Person. Wer
// mitmacht, gibt den Push zurück, und dieser Push ist zugleich die
// Rückmeldung: High Five, und für heute ist Pause.

import { SLOTS, WEEK_GOAL } from './data/slots.js'
import {
  EXERCISES, MODES, SOON, attrLabel, attrTint, attrValues, attrsOf, byId, facets,
  filterFor, pickExercise, slotsMatching,
} from './data/exercises.js'
import * as store from './lib/store.js'
import * as share from './lib/share.js'
import * as library from './lib/library.js'
import * as pwa from './lib/pwa.js'
import * as five from './data/high-five.js'
import { RELEASES, LATEST, releaseEmoji } from './data/releases.js'

const app = document.getElementById('app')

/** Laufzeitzustand, nichts davon ist persistent. */
let incoming = null   // decodierter Payload des Links, mit dem wir geladen wurden
let slotIndex = 0
let timer = null
let cueOpen = null    // Anleitung aufgeklappt; null heisst: noch nicht angetippt

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)')

/** Ab dieser Fensterhöhe steht die Anleitung von sich aus offen. */
const CUE_ROOM = 740

// ------------------------------------------------------------------ Helfer

function screen(id) {
  const node = document.getElementById(`screen-${id}`).content.cloneNode(true)
  const slots = {}
  for (const el of node.querySelectorAll('[data-slot]')) slots[el.dataset.slot] = el
  return { node, slots, root: node.firstElementChild }
}

/**
 * Screens, auf denen das Fragezeichen steht, und der Weg zurück von dort.
 * Im Training und auf der Erklärung selbst steht es nicht: dort gäbe es
 * nichts zu erklären oder nichts, wohin man zurückkäme.
 */
const HELP_FROM = {
  home: () => showHome(),
  library: () => showLibrary(),
}

/** Welcher Screen gerade steht. Das Fragezeichen braucht den Weg zurück. */
let standing = ''

/** Gerade gelöscht. Überlebt genau eine Neuzeichnung der Übersicht. */
let wiped = false

function mount({ node }, id = '') {
  stopTimer()
  app.replaceChildren(node)
  standing = id
  // Der Übungsscreen hat eine feste Fussleiste, der Rest nicht.
  document.body.classList.toggle('has-bar', id === 'exercise')
  // Erklärung und Startseite laufen in Bändern über die ganze Breite und
  // bringen ihre Polsterung selber mit.
  document.body.classList.toggle('is-landing', id === 'landing')
  document.body.classList.toggle('is-home', id === 'home')
  document.body.classList.toggle('has-help', id in HELP_FROM)
  window.scrollTo(0, 0)
}

function on(root, action, handler) {
  const el = root.querySelector(`[data-action="${action}"]`)
  if (el) el.addEventListener('click', handler)
  return el
}

/** Derselbe Schritt an mehreren Stellen: die Landing bietet ihn oben und unten an. */
function onAll(root, action, handler) {
  const els = [...root.querySelectorAll(`[data-action="${action}"]`)]
  for (const el of els) el.addEventListener('click', handler)
  return els
}

/**
 * Das Paar als zwei Plätze. Ein offener Platz ist die Affordance fürs
 * Teilen: eine sichtbare Lücke, die nach einer Person verlangt.
 */
function fillPair(el, people) {
  el.replaceChildren()
  people.forEach((person, i) => {
    if (i > 0) {
      const link = document.createElement('span')
      link.className = 'pair-link'
      link.setAttribute('aria-hidden', 'true')
      el.append(link)
    }
    const peer = document.createElement('span')
    peer.className = 'peer'
    if (person.done) peer.dataset.done = ''
    if (person.pending) peer.dataset.pending = ''
    if (person.you) peer.dataset.you = ''

    const mark = document.createElement('b')
    mark.setAttribute('aria-hidden', 'true')
    mark.textContent = person.done ? '✓' : '·'
    // Ein Platz kann statt eines Namens ein Feld tragen: der eigene, solange
    // der Name noch fehlt. Dann wird dort eingetragen, wo er nachher steht.
    let name = person.el
    if (!name) {
      name = document.createElement('span')
      name.textContent = person.name
      // Die Maske fällt: zuerst steht der Deckname, dann kippt er auf den
      // echten. Wer wenig Bewegung will, sieht gleich den echten.
      if (person.reveal && !REDUCED_MOTION.matches) {
        name.textContent = person.reveal
        name.dataset.mask = ''
        setTimeout(() => {
          name.textContent = person.name
          delete name.dataset.mask
          name.dataset.revealed = ''
        }, 1100)
      }
    }

    peer.append(mark, name)
    // Der eigene Platz trägt den Stift, solange der Name nur dasteht: er
    // sagt, dass hier etwas zu ändern ist, ohne eine zweite Zeile dafür.
    if (person.edit) peer.append(editMark(person.edit))
    el.append(peer)
  })
  // Erst im nächsten Frame steht das Paar im Dokument und lässt sich messen.
  requestAnimationFrame(() => measurePair(el))
  watchPairs()
}

/**
 * Stehen die beiden Plätze nebeneinander oder untereinander? Das hängt an
 * der Länge der Namen und an der Breite daneben, nicht an einer Schwelle,
 * die man im Stylesheet raten könnte. Also wird gemessen: liegen die Plätze
 * auf verschiedenen Höhen, kippt die Verbindung mit.
 */
function measurePair(el) {
  const peers = [...el.querySelectorAll('.peer')]
  // Ohne das Attribut messen, sonst misst man die eigene Wirkung.
  delete el.dataset.stacked
  if (peers.length < 2) return
  const top = peers[0].offsetTop
  if (peers.some((peer) => peer.offsetTop !== top)) el.dataset.stacked = ''
}

/**
 * Ein Fenster, das schmaler wird, kann ein Paar umbrechen lassen. Ein
 * einziger Horcher für alle Paare, statt einer Beobachtung pro Element: die
 * würde auf die eigene Umschaltung reagieren und sich im Kreis drehen.
 */
let pairsWatched = false

function watchPairs() {
  if (pairsWatched) return
  pairsWatched = true
  window.addEventListener('resize', () => {
    for (const el of document.querySelectorAll('.pair')) measurePair(el)
  })
}

/** Der Stift am eigenen Namen. */
function editMark(handler) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'peer-edit'
  el.title = 'Ändern'
  el.setAttribute('aria-label', 'Vornamen ändern')
  el.append(icon('i-pencil'))
  el.addEventListener('click', handler)
  return el
}

/** Ein Symbol aus dem Sprite in index.html. */
function icon(id) {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'icon')
  svg.setAttribute('aria-hidden', 'true')
  const use = document.createElementNS(NS, 'use')
  use.setAttribute('href', '#' + id)
  svg.append(use)
  return svg
}

/**
 * Die laufende Woche als sieben Tage. Ein erledigter Tag trägt einen Haken,
 * der heutige eine kräftige Kontur: er ist der Tag, an dem etwas zu tun ist,
 * und hebt sich über den Rahmen ab, nicht über eine zweite Beschriftung.
 */
function fillWeek(el, days) {
  el.replaceChildren()
  for (const day of days) {
    const cell = document.createElement('span')
    cell.className = 'day'
    if (day.done) cell.dataset.done = ''
    if (day.push) cell.dataset.push = ''
    if (day.five) cell.dataset.five = ''
    if (day.today) cell.dataset.today = ''
    if (day.future) cell.dataset.future = ''

    const label = document.createElement('i')
    label.setAttribute('aria-hidden', 'true')
    label.textContent = day.label
    const mark = document.createElement('b')
    mark.setAttribute('aria-hidden', 'true')
    // Der heutige Tag braucht hier keine Markierung mehr: die Kontur und der
    // Punkt unter der Kachel zeigen ihn an.
    // Ein Tag mit High Five trägt die Hände statt des Hakens.
    mark.textContent = day.five ? '🙌' : day.done ? '\u2713' : ''
    cell.append(label, mark)
    el.append(cell)
  }
  const done = days.filter((d) => d.done).length
  const pushes = days.filter((d) => d.push).length
  const fives = days.filter((d) => d.five).length
  const today = days.find((d) => d.today)
  el.setAttribute('aria-label',
    `Diese Woche ${done} Einheiten${pushes ? `, davon ${pushes} mit Push` : ''}`
    + `${fives ? `, ${fives} mit High Five` : ''}. `
    + `Heute ${today?.done ? 'erledigt' : 'noch offen'}.`)
}

/**
 * Der Stand der Woche in einem Satz, nicht als Zahlenpaar. Was zählt, ist
 * was jetzt zu tun ist, nicht wie die Statistik aussieht.
 */
function weekSentence(state) {
  const progress = store.weekProgress(state)
  const left = progress.goal - progress.done
  const days = store.daysLeftInWeek()
  const today = store.trainedToday(state)

  if (progress.reached) {
    return today
      ? 'Wochenziel erreicht 🎉 Jede weitere Einheit ist ein Bonus.'
      : 'Wochenziel erreicht. Jede weitere Einheit ist ein Bonus.'
  }
  if (today) {
    return left === 1
      ? 'Noch eine Einheit bis zum Wochenziel.'
      : `Noch ${left} Einheiten bis zum Wochenziel.`
  }
  if (left > days) {
    return `Noch ${left} Einheiten bis zum Wochenziel, aber nur ${days === 1 ? 'noch heute' : `noch ${days} Tage`}. Das wird knapp.`
  }
  const rest = days === 1 ? 'Heute ist der letzte Tag der Woche' : `Du hast noch ${days} Tage Zeit`
  return left === 1
    ? `Noch eine Einheit bis zum Wochenziel. ${rest}.`
    : `Noch ${left} Einheiten bis zum Wochenziel. ${rest}.`
}


function doseText(dose) {
  if (dose.type === 'reps') return `${dose.reps} Wiederholungen`
  return dose.seconds >= 60 ? `${dose.seconds / 60} Minute` : `${dose.seconds} Sekunden`
}

/**
 * Die Zeile unter den Namen der Karte. Sie benennt, wer da steht, und zählt
 * nicht: eine Wochenbilanz ist nicht der Punkt der Geste.
 */
/**
 * Gezeigt wird, was zurückkam. Offene Pushes stehen mit ihrem Decknamen da,
 * ohne den Hinweis, dass noch nichts kam: kein Druck.
 */
function pushNoteText(people, state) {
  if (people.length === 0) return ''
  const closed = people.filter((p) => p.closed).map((p) => p.name)
  if (closed.length) {
    const names = closed.length === 1
      ? closed[0]
      : `${closed.slice(0, -1).join(', ')} und ${closed.at(-1)}`
    return `High Five mit ${names}! ${closed.length === 1 ? 'Hat' : 'Haben'} zurückgepusht.`
  }
  return people.length === 1
    ? 'Diese Person hast du zuletzt motiviert.'
    : 'Diese Personen hast du zuletzt motiviert.'
}

/** "4 High Fives zusammen. Ihr zusammen diese Woche: 4 von 6." Was davon zutrifft. */
function loopLine(name, state) {
  const parts = []
  const count = five.fiveCount(store.rally(name, state))
  if (count) parts.push(`${count}.`)
  const duo = store.duoWeek(name, state)
  if (duo) parts.push(`Ihr zusammen diese Woche: ${duo.done} von ${duo.goal}.`)
  return parts.join(' ')
}

/**
 * Das Wochenziel ist eine Untergrenze. Ohne diesen Zusatz liest sich die Zahl
 * wie ein Soll, das man nicht überschreiten müsste.
 */
function weekMoreLine(state) {
  return store.weekProgress(state).reached
    ? 'Je öfter, desto besser für deinen Rücken.'
    : `Ziel: ${WEEK_GOAL} Einheiten pro Woche. Mehr ist immer gut.`
}

/** Mein Anzeigename, solange keiner gesetzt ist. */
function myLabel(state) {
  return state.name ?? 'Du'
}

// --------------------------------------------------------------- Darstellung

/**
 * Schriftgrösse als Faktor auf dem Wurzelelement. Jede Grösse im Stylesheet
 * rechnet damit, darum reicht eine Zahl statt einer zweiten Palette.
 */
const FONT_SIZES = [
  { id: 's', label: 'Klein', scale: 0.92 },
  { id: 'm', label: 'Normal', scale: 1 },
  { id: 'l', label: 'Gross', scale: 1.12 },
]

const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
]

function fontSizeOf(prefs) {
  return FONT_SIZES.find((f) => f.scale === prefs.fontScale) ?? FONT_SIZES[1]
}

/**
 * Modus und Schriftgrösse anwenden. Ohne gewählten Modus bleibt das Attribut
 * weg und die Systemabfrage im Stylesheet behält das Wort.
 */
function applyLook(prefs = store.load().prefs) {
  const root = document.documentElement
  if (prefs.theme === 'light' || prefs.theme === 'dark') root.dataset.theme = prefs.theme
  else delete root.dataset.theme
  root.style.setProperty('--fs', String(fontSizeOf(prefs).scale))
  syncThemeColor(prefs.theme)
}

/**
 * Die Farbe der Systemleiste folgt dem gewählten Modus, nicht dem des
 * Systems: die nicht gewählte Fassung wird per `media` stillgelegt, statt
 * eine dritte Angabe danebenzustellen, die ohnehin nicht gewinnen würde.
 */
function syncThemeColor(theme) {
  const pick = (mode, query) => {
    const meta = document.querySelector(`meta[name="theme-color"][data-mode="${mode}"]`)
    if (!meta) return
    meta.media = theme === mode ? 'all' : theme === 'system' ? query : 'not all'
  }
  pick('light', '(prefers-color-scheme: light)')
  pick('dark', '(prefers-color-scheme: dark)')
}

/**
 * Eine Gruppe aus der gleichen Form wie die Frage vor dem Start: ein Rahmen,
 * darin genau eine gewählte Lage.
 */
function fillChips(el, options, current, pick) {
  el.replaceChildren()
  for (const option of options) {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'chip'
    chip.textContent = option.label
    chip.setAttribute('aria-pressed', String(option.id === current))
    chip.addEventListener('click', () => pick(option))
    el.append(chip)
  }
}

// ------------------------------------------------------------ Einstellungen

/**
 * Was zur Person gehört und nicht zur Einheit: Name, Schriftgrösse, Modus.
 * Alles greift im selben Moment, es gibt nichts zu bestätigen.
 *
 * @param {() => void} back Wohin das Zurück führt.
 */
function showSettings(back = showHome) {
  const view = screen('settings')
  const state = store.load()

  const name = view.slots.name
  name.value = state.name ?? ''
  // Jeder Buchstabe zählt sofort, wie im Feld auf dem Abschluss-Screen auch.
  name.addEventListener('input', () => store.setName(name.value))
  name.addEventListener('keydown', (event) => { if (event.key === 'Enter') name.blur() })

  const drawFont = () => fillChips(
    view.slots.font, FONT_SIZES, fontSizeOf(store.load().prefs).id,
    (option) => {
      applyLook(store.setPrefs({ fontScale: option.scale }).prefs)
      drawFont()
    })
  drawFont()

  const drawTheme = () => {
    const theme = store.load().prefs.theme
    fillChips(view.slots.theme, THEMES, theme, (option) => {
      applyLook(store.setPrefs({ theme: option.id }).prefs)
      drawTheme()
    })
    view.slots.themenote.textContent = theme === 'system'
      ? 'Folgt der Einstellung deines Geräts.'
      : 'Gilt nur in dieser App, unabhängig vom Gerät.'
  }
  drawTheme()

  fillData(view.slots.data, view.slots.raw)
  // Nach dem Löschen zeichnet sich die Seite neu: dort steht, was es nicht
  // mehr gibt, und das Feld oben ist wieder leer.
  fillBackup(view.slots.backup, () => showSettings(back))
  fillWipe(view.slots.wipe, () => showSettings(back))

  on(view.root, 'news', () => openNews())
  on(view.root, 'back', back)
  mount(view, 'settings')
}

/** Ein ISO-Tag als 29.10.2026. */
function dayText(day) {
  const [y, m, d] = String(day).split('-')
  return `${d}.${m}.${y}`
}

/**
 * Was auf diesem Gerät liegt, in Worten und darunter im Original. Die App
 * sagt überall, dass nichts weggeht; dann soll man auch nachsehen können.
 */
function fillData(list, raw) {
  const state = store.load()
  const stored = store.raw()
  const rows = []

  rows.push(['Vorname', state.name ?? 'noch keiner'])

  const last = state.history.at(-1)
  rows.push(['Abgeschlossene Einheiten', state.history.length === 0
    ? 'noch keine'
    : `${state.history.length}, zuletzt am ${dayText(last)}`])

  const week = store.weekProgress(state)
  rows.push(['Diese Woche', `${week.done} von ${week.goal}`])

  const run = store.streak(state)
  rows.push(['Wochen am Stück', run === 0 ? 'keine' : String(run)])

  const pushes = store.pushesThisWeek(state)
  rows.push(['Pushes', state.pushes.length === 0
    ? 'noch keine'
    : `${state.pushes.length} insgesamt, ${pushes} diese Woche`])

  if (state.pushedBy?.name) {
    rows.push(['Offener Push', `an ${state.pushedBy.name}, seit ${dayText(state.pushedBy.day)}`])
  }

  const closed = store.closedThisWeek(state)
  if (closed) rows.push(['Zurückgekommen', `${closed} diese Woche`])

  const duos = Object.entries(state.duos ?? {}).filter(([, d]) => d.rally > 0)
  if (duos.length) {
    rows.push(['High Fives', duos.map(([name, d]) => `${name} ${d.rally}`).join(', ')])
  }

  rows.push(['Angefangene Einheit', state.active
    ? `${state.active.done.length} von ${SLOTS.length} erledigt`
    : 'keine'])

  rows.push(['Vorlieben', [
    prefsText(state.prefs),
    fontSizeOf(state.prefs).label.toLowerCase(),
    THEMES.find((t) => t.id === state.prefs.theme)?.label.toLowerCase() ?? 'system',
  ].join(', ')])

  rows.push(['Platz', stored ? `${stored.length} Zeichen` : 'nichts gespeichert'])

  list.replaceChildren()
  for (const [label, value] of rows) {
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    list.append(dt, dd)
  }

  raw.textContent = stored
    ? `${store.KEY} = ${stored}`
    : 'Auf diesem Gerät liegt noch nichts.'
}

// ------------------------------------------------------------------ Satz

/**
 * Die sechs Übungen einer Einheit, eine pro Slot. Wird beim Start
 * festgelegt und bleibt bis zum Ende gleich.
 * @param {{ filter?: object, from?: string[] }} [opts]  übernimmt ein
 *   mitgeschicktes Set, soweit die Ids noch existieren.
 */
function buildSet(state, { filter = {}, from = [] } = {}) {
  const given = new Map()
  for (const id of from) {
    const ex = byId(id)
    if (ex && !given.has(ex.slot)) given.set(ex.slot, ex.id)
  }
  return SLOTS.map((slot) =>
    given.get(slot.id) ?? pickExercise(slot, state.sessionCount, filter).id)
}

/** Übung für den aktuellen Slot, aus dem eingefrorenen Satz der Einheit. */
function exerciseAt(state, index) {
  const slot = SLOTS[index]
  const id = state.active?.set?.[index]
  return (id && byId(id))
    ?? pickExercise(slot, state.sessionCount, state.active?.filter ?? {})
}

/** Für wie viele Slots der Filter eine Übung übrig lässt. */
function coverage(filter) {
  const have = slotsMatching(filter)
  return SLOTS.filter((s) => have.has(s.id)).length
}

/** Die Vorlieben in Worten, für die Datenliste in den Einstellungen. */
function prefsText(prefs) {
  const mode = MODES.find((m) => m.id === (prefs.mode ?? 'work'))
  if (prefs.mode !== 'free') return mode.label.toLowerCase()
  const chosen = facets()
    .flatMap((f) => (prefs.filter?.[f.key] ?? f.values).map((v) => attrLabel(f.key, v)))
    .map((t) => t.toLowerCase())
  return `${mode.label.toLowerCase()} (${chosen.join(', ')})`
}

/**
 * Einen Merkmalswert dazu oder weg. Der letzte bleibt stehen: ein Merkmal ohne
 * Wert hätte nichts zu wählen. Sind alle Werte gewählt, steht das Merkmal
 * nicht im Filter; so gilt die Auswahl weiter, wenn der Pool einen Wert
 * dazubekommt.
 */
function toggleAttr(key, value) {
  const prefs = store.load().prefs
  const all = attrValues(key)
  const chosen = prefs.filter?.[key]
  const on = Array.isArray(chosen) && chosen.length ? chosen : all
  const next = on.includes(value) ? on.filter((v) => v !== value) : [...on, value]
  if (!next.length) return
  const filter = { ...(prefs.filter ?? {}) }
  if (next.length >= all.length) delete filter[key]
  else filter[key] = all.filter((v) => next.includes(v))
  store.setPrefs({ filter })
}

/**
 * Kurze Abfrage vor dem Start: am Arbeitsplatz, oder nach eigenen Merkmalen.
 * Steht auf beiden Einstiegen, Übersicht und Einladung.
 *
 * Am Arbeitsplatz heisst im Stehen und ohne Hilfsmittel und ist ein fester
 * Filter. "Individuell" legt die Merkmale des Pools offen; was dort gewählt wird,
 * bleibt gespeichert und steht beim nächsten Mal wieder da.
 *
 * Eine laufende Einheit behält ihre Übungen. Sonst würde ein Umschalten
 * mitten im Lauf die schon erledigten Übungen austauschen.
 */
function fillPrefs(el) {
  const state = store.load()
  const prefs = state.prefs
  const mode = prefs.mode ?? 'work'
  const running = (state.active?.done.length ?? 0) > 0
  el.replaceChildren()

  const label = document.createElement('p')
  label.className = 'prefs-label'
  // Wer heute schon trainiert hat, fängt nicht den Tag an, sondern legt nach.
  // Die Frage sagt das, sonst läse sie sich wie ein Fehler.
  label.textContent = store.trainedToday(state)
    ? 'Lust auf mehr? Die nächste Einheit trainiere ich'
    : 'Heute trainiere ich 🚀'

  const chip = (into, text, on, pick, extra = '', tint = '') => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = extra ? `chip ${extra}` : 'chip'
    b.textContent = text
    // Der Ton des Merkmals, derselbe wie an der Marke über der Übung.
    if (tint) b.dataset.tint = tint
    b.setAttribute('aria-pressed', String(on))
    b.disabled = running
    b.addEventListener('click', () => {
      pick()
      fillPrefs(el)
    })
    into.append(b)
    return b
  }

  const row = document.createElement('div')
  row.className = 'chips'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Wie du trainierst')
  for (const m of MODES) {
    chip(row, m.label, mode === m.id, () => store.setPrefs({ mode: m.id }))
  }
  el.append(label, row)

  // Nur "Individuell" zeigt die Merkmale, als Wolke unter dem Toggle: jede Marke
  // einzeln an- und abtippbar.
  if (mode === 'free') {
    const cloud = document.createElement('div')
    cloud.className = 'prefs-tags'
    cloud.setAttribute('role', 'group')
    cloud.setAttribute('aria-label', 'Merkmale der Übungen')
    for (const facet of facets()) {
      const chosen = prefs.filter?.[facet.key]
      for (const value of facet.values) {
        chip(cloud, attrLabel(facet.key, value),
          !Array.isArray(chosen) || chosen.length === 0 || chosen.includes(value),
          () => toggleAttr(facet.key, value),
          'chip-tag', attrTint(facet.key, value))
      }
    }
    // Was noch kommt, steht am Ende der Wolke: sichtbar, aber nicht wählbar.
    for (const soon of SOON) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'chip chip-tag'
      b.dataset.soon = ''
      if (soon.tint) b.dataset.tint = soon.tint
      b.disabled = true
      b.setAttribute('aria-pressed', 'false')
      b.setAttribute('aria-label', `${soon.label}, kommt noch`)
      const name = document.createElement('span')
      name.textContent = soon.label
      const hint = document.createElement('small')
      hint.setAttribute('aria-hidden', 'true')
      hint.textContent = 'bald'
      b.append(name, hint)
      cloud.append(b)
    }
    el.append(cloud)
  }

  const note = document.createElement('p')
  note.className = 'note'
  const covered = coverage(filterFor(prefs))
  if (running) {
    note.textContent = 'Die angefangene Einheit behält ihre Übungen.'
  } else if (covered === 0) {
    note.textContent = 'Zu dieser Auswahl gibt es bisher keine Übung. Die Einheit nimmt, was da ist.'
  } else if (covered < SLOTS.length) {
    note.textContent = `Für ${SLOTS.length - covered} von ${SLOTS.length} Bereichen gibt es noch keine passende Übung. Dort kommt die nächstbeste.`
  } else if (mode === 'work') {
    note.textContent = 'Im Stehen, ohne Hilfsmittel.'
  } else {
    return
  }
  el.append(note)
}

/** Die Merkmale der Übung als Reihe kleiner Marken. */
function fillAttrs(el, exercise) {
  if (!el) return
  el.replaceChildren()
  for (const attr of attrsOf(exercise)) {
    const tag = document.createElement('span')
    tag.className = 'tag'
    tag.dataset.attr = attr.key
    if (attr.tint) tag.dataset.tint = attr.tint
    tag.textContent = attr.label
    el.append(tag)
  }
}

// ------------------------------------------------------------------ Einladung

function showInvite() {
  const from = incoming.from
  const reply = incoming.kind === 'reply'
  // Eine Antwort wird beim Öffnen verbucht, nicht erst beim Training: sie
  // meldet, was die andere Person schon getan hat. Ein zweites Öffnen zählt
  // nicht nochmal, zeigt aber dasselbe.
  const answer = reply ? store.receiveReply(incoming) : null
  const state = store.load()
  const view = screen('invite')

  const line = loopLine(from, state)
  if (line) {
    view.slots.loopline.hidden = false
    view.slots.loopline.textContent = line
  }

  // Eine Antwort schliesst den Kreis: beide haben trainiert, High Five, und
  // für heute ist Pause. Kein Start, nur der Weg zurück zur Übersicht.
  if (reply) {
    const seed = { day: store.isoDay(), name: from }
    view.slots.headline.textContent = five.pick(five.CLOSED_HEADLINE, seed)
    fillPair(view.slots.pair, [
      { name: from, done: true, reveal: answer.alias },
      { name: myLabel(state), done: true, you: true },
    ])
    view.slots.lead.textContent = five.pick(five.CLOSED_LEAD, seed)
    for (const key of ['prefs', 'startbtn', 'startown', 'about', 'laterbtn']) view.slots[key].hidden = true
    view.slots.homebtn.hidden = false
    on(view.root, 'home', () => {
      leaveLink()
      showHome()
    })
    mount(view, 'invite')
    if (answer.fresh) burst(view.slots.party)
    return
  }

  view.slots.laterbtn.hidden = true
  view.slots.headline.textContent = !incoming.date || incoming.date === store.isoDay()
    ? `${from} hat heute trainiert`
    : `${from} hat trainiert`
  fillPair(view.slots.pair, [
    { name: from, done: true },
    { name: myLabel(state), pending: true, you: true },
  ])
  view.slots.lead.textContent = incoming.rally > 0
    ? `${from} hat vorgelegt. Zehn Minuten, dann habt ihr euer nächstes High Five.`
    : `${from} gibt dir einen friendly push. Zehn Minuten, dann hast du es auch gemacht.`

  fillPrefs(view.slots.prefs)

  // Mit Satz im Link gibt es eine Wahl: dieselben Übungen oder eigene.
  const sameSet = incoming.set ?? []
  if (sameSet.length) {
    view.slots.startbtn.textContent = `Gleiche Übungen wie ${from}`
    view.slots.startown.hidden = false
  }

  const go = (from_) => () => {
    acceptInvite(incoming)
    showReady({ from: from_ })
  }
  on(view.root, 'start', go(sameSet))
  on(view.root, 'start-own', go([]))
  // Jetzt nicht: die Einladung wandert auf die Übersicht und wartet dort.
  view.slots.laterbtn.hidden = false
  on(view.root, 'later', () => {
    store.setPendingInvite(incoming)
    leaveLink()
    showHome()
  })
  mount(view, 'invite')
}

/** Die Einladung annehmen: ab jetzt gilt der Push dieser Person, die Antwort geht an sie. */
function acceptInvite(invite) {
  store.setPushedBy(invite.from, store.isoDay(), {
    id: invite.id,
    rally: invite.rally,
    week: invite.week,
  })
  store.clearPendingInvite()
}

// ------------------------------------------------------------------ Startseite

function showHome() {
  const state = store.load()
  const view = screen('home')

  // Beim ersten Besuch gibt es nichts zu berichten, also erklärt der Screen
  // stattdessen die Idee.
  const firstVisit = state.history.length === 0 && !state.name
  if (firstVisit) {
    view.slots.intro.hidden = false
    for (const el of view.root.querySelectorAll('[data-hide-on-intro]')) el.hidden = true
    fillPair(view.slots.demo, [
      { name: 'Du', done: true, you: true },
      { name: 'wer macht mit?', pending: true },
    ])
  } else {
    fillWeek(view.slots.week, store.weekDays(state))
    view.slots.weekline.textContent = weekSentence(state)
    view.slots.weekmore.textContent = weekMoreLine(state)
  }

  const trained = store.trainedToday(state)
  if (!firstVisit) {
    // Die Zeile sagt in ganzen Sätzen, wo man steht: geschafft, oder Zeit
    // für die Einheit. Mit Namen wird die Person angesprochen, ohne Namen
    // bleibt es beim Satz, ein «Hey Du» wäre schlechter als keines.
    const name = state.name
    view.slots.headline.textContent = trained
      ? (name ? `Super ${name}, du hast heute schon trainiert 🎉` : 'Super, du hast heute schon trainiert 🎉')
      : (name ? `Hey ${name}, Zeit für 10 Minuten Rückentraining` : 'Zeit für 10 Minuten Rückentraining')
    view.slots.startbtn.textContent = state.active?.done.length
      ? 'Einheit fortsetzen'
      : trained ? 'Noch eine Einheit starten' : 'Einheit starten'
  }

  // Die Karte zeigt die offene Geste: entweder schuldest du jemandem den Push
  // zurück, oder die Personen deiner letzten Einheit stehen da. Weggetippt
  // bleibt sie weg, bis ein neuer Push rausgeht.
  const from = state.pushedBy?.name
  const people = store.lastPushPeople(state)
  const pending = state.pendingInvite
  const team = firstVisit ? null : store.team(state)
  if (pending) fillChallenge(view, state, pending)
  // Kommt die offene Einladung vom Team, sagt ihre Karte schon alles.
  if (team && team.name !== pending?.from) fillTeam(view, state, team, trained)
  // Was die Team-Karte schon sagt, sagt die Push-Karte nicht nochmal.
  const sameAsTeam = team && (from
    ? from === team.name
    : people.length > 0 && people.every((p) => p.name === team.name))
  if (!sameAsTeam && (from || store.pushCardCount(state) > store.pushCardSeen(state))) {
    view.slots.pushcard.hidden = false
    // Gingen nach einer Einheit mehrere Pushes raus, steht jede Person als
    // eigener Platz da, wie auf dem Abschluss-Screen beim Teilen. Wer
    // zurückgepusht hat, steht mit echtem Namen da.
    fillPair(view.slots.pushpair, from
      ? [{ name: from, done: true }, { name: myLabel(state), pending: true, you: true }]
      : [{ name: myLabel(state), done: true, you: true },
         ...people.map((p) => ({ name: p.name, done: true }))])
    view.slots.pushnote.textContent = from
      ? (state.pushedBy.rally > 0
        ? `${from} hat zurückgepusht. Nach deiner nächsten Einheit bist du wieder dran.`
        : `${from} hat dich gepusht. Nach deiner nächsten Einheit gibst du den Push zurück.`)
      : pushNoteText(people, state)
  }

  if (state.active?.done.length) {
    view.slots.resume.hidden = false
    view.slots.resume.textContent =
      `Du hast ${state.active.done.length} von ${SLOTS.length} Übungen erledigt. Mach weiter, wo du aufgehört hast.`
  }

  fillPrefs(view.slots.prefs)

  // Wer mit offener Einladung über den normalen Knopf trainiert, nimmt sie
  // damit an: sonst ginge die Antwort an niemanden.
  on(view.root, 'start', () => {
    if (pending) acceptInvite(pending)
    showReady()
  })
  // Neu: wer zum ersten Mal da ist, für den ist alles neu, also nichts davon.
  if (firstVisit && LATEST && state.seenRelease !== LATEST) store.markReleaseSeen(LATEST)
  const unseen = !firstVisit && LATEST && state.seenRelease !== LATEST
  if (unseen) {
    view.slots.newscard.hidden = false
    view.slots.newsemoji.textContent = releaseEmoji(RELEASES[0])
    view.slots.newstitle.textContent = `Neu: ${RELEASES[0].title}`
    const n = RELEASES[0].items.length
    view.slots.newssub.textContent = `${n} ${n === 1 ? 'Neuerung' : 'Neuerungen'}. Antippen und staunen.`
  }
  // "Gelesen" räumt Overlay und Karte weg, ohne die Seite neu zu zeichnen.
  const read = () => {
    view.slots.newscard.dataset.leaving = ''
    setTimeout(() => { view.slots.newscard.hidden = true }, 260)
  }
  on(view.root, 'news-open', () => openNews(read))

  on(view.root, 'challenge', () => {
    incoming = pending
    showInvite()
  })
  on(view.root, 'library', () => showLibrary())
  // Die zwei Nebenausgänge stehen auf der Startseite in der Kopfzeile und
  // nicht in der schwebenden Leiste, darum werden sie hier verdrahtet.
  on(view.root, 'settings-top', () => showSettings(showHome))
  on(view.root, 'help', () => showLanding(showHome))
  // Das Kreuz räumt die Karte weg: den offenen Push quittiert es, die eigene
  // Bilanz verschwindet bis zum nächsten Push.
  on(view.root, 'pushcard-hide', () => {
    if (from) store.clearPushedBy()
    else store.hidePushCard(state)
    showHome()
  })
  mount(view, 'home')
}

/** Die Neuerungen als Liste, neueste zuerst. App und Erklärung teilen sie. */
function fillReleases(el) {
  el.replaceChildren()
  for (const release of RELEASES) {
    const block = document.createElement('article')
    block.className = 'release'
    const head = document.createElement('h3')
    head.textContent = `${releaseEmoji(release)} ${release.title}`
    const date = document.createElement('p')
    date.className = 'release-date'
    date.textContent = dayText(release.id)
    const list = document.createElement('ul')
    for (const [emoji, text] of release.items) {
      const li = document.createElement('li')
      const mark = document.createElement('span')
      mark.setAttribute('aria-hidden', 'true')
      mark.textContent = emoji
      const body = document.createElement('span')
      body.textContent = text
      li.append(mark, body)
      list.append(li)
    }
    block.append(head, date, list)
    el.append(block)
  }
}

/**
 * "Was ist neu" als Overlay. Erst "Gelesen" zählt als gelesen; wer es
 * daneben oder mit Escape schliesst, findet die Karte weiter auf der Startseite.
 * @param {() => void} onRead was nach "Gelesen" auf dem Screen verschwinden soll
 */
function openNews(onRead) {
  const dlg = document.querySelector('[data-slot="news"]')
  fillReleases(dlg.querySelector('[data-slot="newslist"]'))
  const readBtn = dlg.querySelector('[data-action="news-read"]')
  readBtn.onclick = () => {
    if (LATEST) store.markReleaseSeen(LATEST)
    dlg.close()
    onRead?.()
  }
  dlg.onclick = (event) => { if (event.target === dlg) dlg.close() }
  dlg.showModal()
  dlg.scrollTop = 0
  readBtn.focus({ preventScroll: true })
}

/** Die offene Einladung auf der Startseite: wer gepusht hat, und der Weg zurück auf den Link-Screen. */
function fillChallenge(view, state, invite) {
  const { from } = invite
  view.slots.challenge.hidden = false
  view.slots.challengecount.textContent = invite.rally > 0
    ? five.fiveCount(invite.rally)
    : 'Friendly push'
  if (!(invite.rally > 0)) view.slots.challengecount.dataset.plain = ''
  fillPair(view.slots.challengepair, [
    { name: from, done: true },
    { name: myLabel(state), pending: true, you: true },
  ])
  view.slots.challengenote.textContent = invite.rally > 0
    ? `${from} hat vorgelegt und wartet auf dich. Zehn Minuten, dann habt ihr euer nächstes High Five.`
    : `Friendly push von ${from}. Zehn Minuten, dann hast du es auch gemacht.`
}

/**
 * Das Team auf der Startseite: das Gegenüber, mit dem zuletzt ein High Five
 * zustande kam, der Zähler und was jetzt dran ist. Heute geschafft heisst
 * Pause bis morgen. Ab dem nächsten Tag wird die Karte lauter, und je länger
 * es her ist, desto deutlicher sagt sie es.
 */
function fillTeam(view, state, team, trained) {
  const { name, since } = team
  const seed = { day: store.isoDay(), name, n: since }
  const lastPush = state.pushes.at(-1)
  const pushedBy = state.pushedBy?.name === name
  // Heute schon vorgelegt: der Push ging heute an genau dieses Gegenüber.
  const waiting = since > 0 && trained && lastPush?.day === store.isoDay() && lastPush?.alias === name
  const due = since > 0 && !trained

  const card = view.slots.teamcard
  card.hidden = false
  if (due) card.dataset.due = ''
  view.slots.teamcount.textContent = five.fiveCount(team.fives)
  fillPair(view.slots.teampair, [
    { name: myLabel(state), done: since === 0 || trained, you: true },
    { name, done: since === 0, pending: since > 0 },
  ])
  view.slots.teamnote.textContent =
    since === 0 ? five.pick(five.HOME_TODAY, seed)
    : pushedBy ? `${name} hat vorgelegt. Zehn Minuten, dann habt ihr euer nächstes High Five.`
    : waiting ? five.pick(five.HOME_WAITING, seed)
    : since === 1 ? five.pick(five.HOME_DUE, seed)
    : five.pick(five.HOME_LATE, seed)
}

// ------------------------------------------------------------------ Landing

/**
 * Der Einstieg für alle, die die App noch nicht kennen, und ab dem
 * Fragezeichen die Erklärung für alle anderen: die Geste, die Bedienung, die
 * häufigen Fragen, der Weg auf den Homescreen. Alles auf einer Seite, die man
 * überfliegen kann, statt in einem zweiten Screen.
 *
 * @param {(() => void)|null} back Wohin das Zurück führt. Ohne das steht
 *   keines da: beim ersten Besuch ist diese Seite der Anfang.
 */
function showLanding(back = null) {
  const view = screen('landing')

  fillPair(view.slots.pair, [
    { name: 'Du', done: true, you: true },
    { name: 'Eine Person', pending: true },
  ])

  fillInstall(view)
  fillWipe(view.slots.wipe)
  fillReleases(view.slots.releaselist)
  if (!RELEASES.length) view.slots.releases.hidden = true

  // Der Weg zurück hängt am Zeichen der Kopfzeile, nicht an einem eigenen
  // Pfeil. Gibt es kein Zurück, bleibt das Zeichen eine Zeile Text: ein
  // Knopf, der nirgends hinführt, wäre schlimmer als keiner.
  if (back) {
    const brand = view.slots.brand
    brand.setAttribute('role', 'button')
    brand.setAttribute('aria-label', 'Zurück zur Übersicht')
    brand.tabIndex = 0
    brand.addEventListener('click', back)
    brand.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      back()
    })
  }

  // Die Sprünge der Kopfzeile laufen über scrollIntoView und nicht über
  // Anker: der Hash gehört dem Share-Payload. Was nicht da ist, wird auch
  // nicht angeboten, etwa das Install-Band auf einem Gerät mit App.
  for (const el of view.root.querySelectorAll('[data-action="jump"]')) {
    const target = view.slots[el.dataset.to]
    if (!target || target.hidden) { el.hidden = true; continue }
    el.addEventListener('click', () => target.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  onAll(view.root, 'start', () => showReady())
  // Liegt schon etwas auf dem Gerät, ist die Übersicht der Einstieg: dort
  // steht die Lage und von dort geht es los. Ohne Daten gäbe es dort nichts
  // zu sehen, dann fängt die Einheit sofort an.
  on(view.root, 'enter', () => (store.hasData() ? showHome() : showReady()))
  onAll(view.root, 'library', () => showLibrary(() => showLanding(back)))
  mount(view, 'landing')
}

/**
 * Alles löschen, in zwei Schritten. Der erste fragt nach, der zweite macht
 * es: der Verlauf liegt nur hier, und was weg ist, kommt nicht wieder. Ein
 * Knopf allein wäre für diesen Schritt zu wenig Widerstand.
 *
 * Er steht an zwei Orten, weil er an beiden gesucht wird: in den
 * Einstellungen unter «Daten», direkt neben dem, was gelöscht wird, und in
 * der Antwort der Erklärung, die davon handelt.
 *
 * @param {HTMLElement} el
 * @param {(() => void)|null} after Was nach dem Löschen zu tun ist. Die
 *   Einstellungen zeichnen sich neu, weil dort steht, was es nicht mehr gibt.
 *   Die Erklärung bleibt stehen, dort ändert sich nichts.
 */
/** Gerade ein Backup eingespielt. Überlebt genau eine Neuzeichnung der Einstellungen. */
let restored = false

/**
 * Backup herunterladen und wieder einspielen. Herunterladen ist harmlos und
 * geht sofort; Einspielen ersetzt alles auf dem Gerät und fragt darum
 * nach, wie das Löschen.
 */
function fillBackup(el, after) {
  el.replaceChildren()
  const row = document.createElement('div')
  row.className = 'backup-row'

  const down = document.createElement('button')
  down.className = 'btn btn-soft btn-small'
  down.textContent = 'Backup herunterladen'
  down.addEventListener('click', downloadBackup)

  const file = document.createElement('input')
  file.type = 'file'
  file.accept = 'application/json,.json'
  file.hidden = true
  file.addEventListener('change', async () => {
    const picked = file.files?.[0]
    if (!picked) return
    let parsed = null
    try {
      parsed = JSON.parse(await picked.text())
    } catch { /* bleibt null */ }
    askRestore(el, after, parsed, picked.name)
  })

  const up = document.createElement('button')
  up.className = 'linkbtn'
  up.textContent = 'Backup einspielen'
  up.addEventListener('click', () => file.click())

  row.append(down, up, file)
  el.append(row)

  if (restored) {
    restored = false
    const ok = document.createElement('p')
    ok.className = 'note'
    ok.setAttribute('role', 'status')
    ok.textContent = 'Backup eingespielt. Alles wieder da.'
    el.append(ok)
  }
}

/** Die Datei entsteht im Browser und geht direkt in die Downloads, nirgendwo sonst hin. */
function downloadBackup() {
  const blob = new Blob([JSON.stringify(store.exportBackup(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `friendlypush-backup-${store.isoDay()}.json`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function askRestore(el, after, parsed, name) {
  el.replaceChildren()
  const data = parsed?.app === 'friendlypush' ? parsed.data : parsed
  const valid = data && typeof data === 'object' && Array.isArray(data.history)

  const note = document.createElement('p')
  note.className = 'note'
  if (!valid) {
    note.textContent = `«${name}» ist kein friendly-push-Backup.`
    const back = document.createElement('button')
    back.className = 'linkbtn'
    back.textContent = 'Zurück'
    back.addEventListener('click', () => fillBackup(el, after))
    el.append(note, back)
    return
  }
  const when = parsed?.exported ? ` vom ${dayText(parsed.exported.slice(0, 10))}` : ''
  note.textContent = `Backup${when}: ${data.history.length} Einheiten${data.name ? `, ${data.name}` : ''}. `
    + 'Es ersetzt alles, was jetzt auf diesem Gerät liegt.'

  const yes = document.createElement('button')
  yes.className = 'btn btn-soft btn-small'
  yes.textContent = 'Ja, einspielen'
  yes.addEventListener('click', () => {
    const state = store.importBackup(parsed)
    if (!state) {
      note.textContent = 'Das hat nicht geklappt. Der Speicher ist voll oder gesperrt.'
      return
    }
    applyLook(state.prefs)
    restored = true
    after()
  })

  const no = document.createElement('button')
  no.className = 'linkbtn'
  no.textContent = 'Abbrechen'
  no.addEventListener('click', () => fillBackup(el, after))

  const row = document.createElement('div')
  row.className = 'wipe-row'
  row.append(yes, no)
  el.append(note, row)
}

function fillWipe(el, after = null) {
  el.replaceChildren()
  if (wiped) {
    wiped = false
    el.append(done())
    return
  }
  const ask = document.createElement('button')
  ask.className = 'linkbtn wipe-ask'
  ask.textContent = 'Alle Daten auf diesem Gerät löschen'
  ask.addEventListener('click', () => askWipe(el, after))
  el.append(ask)
}

function askWipe(el, after) {
  el.replaceChildren()

  const note = document.createElement('p')
  note.className = 'note'
  note.textContent = 'Verlauf, Name und Pushes sind dann weg, auf diesem Gerät '
    + 'und endgültig. Die App fängt wieder bei null an.'

  const yes = document.createElement('button')
  yes.className = 'btn btn-soft btn-small'
  yes.textContent = 'Ja, alles löschen'
  yes.addEventListener('click', () => {
    store.reset()
    if (after) {
      wiped = true
      after()
      return
    }
    el.replaceChildren(done())
  })

  const no = document.createElement('button')
  no.className = 'linkbtn'
  no.textContent = 'Abbrechen'
  no.addEventListener('click', () => fillWipe(el, after))

  const row = document.createElement('div')
  row.className = 'wipe-row'
  row.append(yes, no)
  el.append(note, row)
}

/** Eine Zeile, die bleibt: ohne sie wäre nicht zu sehen, dass etwas geschah. */
function done() {
  const line = document.createElement('p')
  line.className = 'note'
  line.setAttribute('role', 'status')
  line.textContent = 'Gelöscht. Auf diesem Gerät liegt nichts mehr.'
  return line
}

/** Die Überschrift über der Anleitung, je nachdem, was dieses Gerät verlangt. */
const INSTALL_TITLES = {
  ios: 'So kommt sie auf den Home-Bildschirm:',
  android: 'So kommt sie auf den Startbildschirm:',
  desktop: 'So kommt sie zu deinen Apps:',
}

/**
 * Der Installationsteil sagt, was auf diesem Gerät wirklich geht: Chrome und
 * Edge machen ein Angebot, das die Seite weiterreichen kann, iOS macht keins
 * und verlangt den Handgriff im Teilen-Menü.
 */
function fillInstall(view) {
  const block = view.slots.installblock
  const buttons = [...view.root.querySelectorAll('[data-action="install"]')]

  // Wer sie schon installiert hat, braucht die Anleitung nicht.
  if (pwa.isStandalone()) {
    block.hidden = true
    return
  }

  showInstallWay(view)

  // Kommt das Angebot des Browsers, übernimmt der Knopf. Es kann vor oder
  // nach diesem Screen eintreffen, darum beides.
  pwa.whenInstallable(() => {
    showInstallWay(view, true)
    for (const button of buttons) button.hidden = false
  })

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const installed = await pwa.install()
      // Das Angebot ist nach einem Dialog verbraucht, egal wie er ausging.
      if (installed) {
        block.hidden = true
        return
      }
      for (const other of buttons) other.hidden = true
      // Ohne Knopf bleibt der Handgriff, den dieses Gerät verlangt.
      showInstallWay(view)
    })
  }
}

/**
 * An derselben Stelle steht immer genau ein Weg: der Knopf, sobald der Browser
 * ein Angebot gemacht hat, sonst direkt die Anleitung, die dieses Gerät
 * verlangt. iOS macht nie eines, dort bleiben es die drei Schritte im
 * Teilen-Menü.
 *
 * @param {{ slots: Record<string, HTMLElement> }} view
 * @param {boolean} offered Liegt ein Angebot des Browsers vor?
 */
function showInstallWay(view, offered = false) {
  const way = offered ? 'offer'
    : pwa.isApple() ? 'ios'
      : pwa.isAndroid() ? 'android'
        : 'desktop'

  // Mit Angebot führt der Knopf hin, und die Anleitung tritt ganz zurück.
  view.slots.installway.hidden = offered
  view.slots.installwaytitle.textContent = INSTALL_TITLES[way] ?? ''
  view.slots.installios.hidden = way !== 'ios'
  view.slots.installandroid.hidden = way !== 'android'
  view.slots.installdesktop.hidden = way !== 'desktop'
}

// ------------------------------------------------------------------ Übungen

function showLibrary(back = showHome) {
  const view = screen('library')
  view.slots.count.textContent = ''
  view.slots.lead.textContent =
    'Drei bis vier Varianten pro Bereich. Welche drankommt, entscheidet die App.'
  library.renderList(view.slots.list)
  on(view.root, 'back', back)
  mount(view, 'library')
}

// ------------------------------------------------------------------ Übung

function showExercise() {
  const before = store.load()
  const state = store.startSession({
    filter: filterFor(before.prefs),
    set: buildSet(before, { filter: filterFor(before.prefs) }),
  })
  const slot = SLOTS[slotIndex]
  const exercise = exerciseAt(state, slotIndex)
  const view = screen('exercise')

  view.slots.step.textContent = `${slotIndex + 1}/${SLOTS.length}`
  view.slots.slot.textContent = slot.label
  view.slots.name.textContent = exercise.name
  view.slots.cue.textContent = exercise.cue
  fillAttrs(view.slots.attrs, exercise)
  view.slots.figure.replaceChildren(library.figureFor(exercise, 'ex-figure'))

  view.slots.progress.replaceChildren()
  const done = state.active?.done ?? []
  const skipped = state.active?.skipped ?? []
  // Die Balken lesen aus dem eingefrorenen Satz der Einheit. Würden sie die
  // Übung pro Slot neu ziehen, stünde dort eine andere Id als die erledigte
  // und kein Balken würde je gefüllt.
  const set = state.active?.set ?? []
  SLOTS.forEach((s, i) => {
    const bar = document.createElement('i')
    const id = set[i]
    if (i === slotIndex) bar.dataset.now = ''
    else if (id && done.includes(id)) bar.dataset.on = ''
    else if (id && skipped.includes(id)) bar.dataset.skip = ''
    view.slots.progress.append(bar)
  })
  view.slots.progress.setAttribute('aria-label', `Übung ${slotIndex + 1} von ${SLOTS.length}`)

  setupCue(view)
  setupTimer(view, exercise)

  on(view.root, 'next', () => {
    store.markDone(exercise.id)
    advance()
  })
  on(view.root, 'skip', () => {
    store.markSkipped(exercise.id)
    advance()
  })
  // Bei der ersten Übung gibt es nichts, wohin der Pfeil zeigen könnte.
  // An seiner Stelle steht dort der Abbruch: wer gerade gestartet hat und
  // zurück will, meint die Übersicht und nicht eine Übung weiter hinten.
  const first = slotIndex === 0
  const prev = on(view.root, 'prev', back)
  if (prev) prev.hidden = first
  const stop = on(view.root, 'stop', () => {
    store.discardSession()
    showHome()
  })
  if (stop) stop.hidden = !first

  mount(view, 'exercise')
}

// ------------------------------------------------------------------ Abschluss

function showDone() {
  const { reason, done } = store.completeSession()
  const state = store.load()
  const view = screen('done')
  const progress = store.weekProgress(state)

  view.slots.headline.textContent =
    reason === 'few' ? 'Zählt noch nicht'
    : reason === 'duplicate' ? 'Heute schon erledigt'
    : progress.reached ? 'Wochenziel erreicht'
    : `Noch ${progress.goal - progress.done} mal diese Woche`

  if (reason === 'few') {
    view.slots.eyebrow.textContent = 'Fast'
    view.slots.hint.hidden = false
    view.slots.hint.textContent =
      `${done} von ${SLOTS.length} Übungen. Ab ${store.MIN_DONE} zählt die Einheit fürs Wochenziel.`
  } else {
    view.slots.cheer.hidden = false
  }

  // Wer selbst gepusht wurde, gibt den Push zurück. Das ist zugleich die
  // Rückmeldung, ein zweiter Schritt dafür braucht es nicht. Eine Einheit,
  // die nicht zählt, meldet nichts zurück.
  view.backTo = state.pushedBy?.name && reason !== 'few' ? state.pushedBy : null
  // Kein offener Push, aber ein Team, dessen letztes High Five nicht von
  // heute ist: dann stösst der Hauptknopf das nächste an. Am Tag des High
  // Five ist Pause, dann bleibt es beim gewohnten Knopf.
  const team = store.team(state)
  view.nextWith = !view.backTo && team && team.since > 0 && reason !== 'few' ? team : null

  fillWeek(view.slots.week, store.weekDays(state))
  view.slots.weekline.textContent = weekSentence(state)
  view.slots.weekmore.textContent = weekMoreLine(state)

  const run = store.streak(state)
  view.slots.streak.textContent = run > 0
    ? (run === 1 ? 'Eine Woche am Stück.' : `${run} Wochen am Stück.`)
    : 'Dreimal in einer Woche startet den Streak.'

  // Ohne Namen steht im eigenen Platz des Paares das Feld, mit Namen der
  // Name und daneben der Stift.
  view.editName = !state.name

  renderPushStep(view)

  on(view.root, 'side', async () => {
    const result = await sendInvite(view, { extra: true })
    if (result) showPushSent(view, result)
  })
  on(view.root, 'home', () => {
    leaveLink()
    showHome()
  })
  mount(view, 'done')
  // Erst im Dokument läuft eine Animation und nimmt ein Feld den Fokus. Wer
  // noch keinen Namen gesetzt hat, sieht darum hier, wo der eine fehlende
  // Schritt sitzt, und tippt ihn ohne Umweg ein.
  if (view.editName) {
    shakeName(view)
    view.slots.pair.querySelector('.peer-input')?.focus()
  }
}

/**
 * Der eine Schritt, auf den der Abschluss-Screen zuläuft: eine Person
 * motivieren, oder der Person, die mich gepusht hat, den Push zurückgeben.
 */
function renderPushStep(view) {
  view.slots.share.replaceChildren()
  // Die Decknamen der Pushes, die auf diesem Screen rausgegangen sind. Jeder
  // bekommt einen eigenen Platz im Paar: wer zwei Leute motiviert, soll zwei
  // Leute sehen und nicht zweimal dieselbe Meldung.
  view.sent = []
  renderPair(view)
  const back = view.backTo?.name
  const next = view.nextWith?.name
  view.slots.sharehow.textContent = back
    ? `Gib ${back} den Push zurück. ${back} sieht dann, dass du mitgemacht hast, und ihr habt euer High Five.`
    : next ? five.fill(five.NEXT_ROUND, { name: next })
    : 'Jetzt gibst du den Push weiter. Ein Link an eine Person, das war es.'

  const label = back ? `${back} zurückpushen` : next ? `${next} pushen` : 'Eine Person motivieren'
  view.push = button(label, 'btn-primary', async () => {
    const result = await sendInvite(view)
    if (result) showPushSent(view, result)
  })
  syncPush(view)
  view.slots.share.append(view.push)
}

/**
 * Nur das Paar neu zeichnen, nicht den Knopf. Ein Druck auf den Knopf nimmt
 * dem Feld zuerst den Fokus; würde in diesem Moment auch der Knopf neu
 * gebaut, bekäme der neue den Klick nicht mehr und der erste Druck ginge
 * ins Leere.
 */
function renderPair(view) {
  const me = {
    name: myLabel(store.load()),
    done: true,
    you: true,
    el: view.editName ? nameInput(view) : null,
    edit: view.editName ? null : () => editName(view),
  }
  // Solange nichts raus ist, steht dort die Lücke, die nach einer Person
  // verlangt. Danach steht dort, wer schon einen Push bekommen hat.
  const sent = view.sent ?? []
  fillPair(view.slots.pair, sent.length
    ? [me, ...sent.map((name) => ({ name, done: true }))]
    : [me, { name: view.backTo?.name ?? view.nextWith?.name ?? 'wer macht mit?', pending: true }])
}

/**
 * Ohne Namen gäbe es nichts zu teilen: der Knopf wartet sichtbar, statt sich
 * drücken zu lassen und dann zu meckern. Ab dem ersten Buchstaben im Feld
 * steht er bereit, ohne dass erst daneben getippt werden muss.
 */
function syncPush(view) {
  if (view.push) view.push.disabled = !store.load().name
}

/**
 * Geteilt. Der Hauptknopf hat seine Arbeit getan und verschwindet, der
 * offene Platz im Paar ist besetzt, und es knallt kurz.
 */
function showPushSent(view, result) {
  const state = store.load()
  const shared = result === 'shared'

  // Der offene Platz bekommt den Decknamen des Pushes, jede weitere Person
  // einen eigenen daneben. An wen der Link ging, weiss die App nicht, aber
  // «unterwegs» wäre ein Zustand und kein Gegenüber.
  view.editName = false
  view.sent = [...(view.sent ?? []), store.lastPushAlias(state) ?? 'Eine Person']
  const n = view.sent.length

  view.slots.share.replaceChildren()
  renderPair(view)
  const replied = n === 1 ? view.replied : null
  const nexted = n === 1 ? view.nexted : null
  if (replied) {
    const seed = { day: store.isoDay(), name: replied }
    view.slots.headline.textContent = five.pick(five.CLOSED_HEADLINE, seed)
    view.slots.eyebrow.textContent = 'High Five'
  }
  view.slots.sharehow.textContent = replied
    ? `${five.pick(five.CLOSED_SENT, { day: store.isoDay(), name: replied })} ${loopLine(replied, state)}`.trim()
      + (shared ? '' : ' Der Link liegt in der Zwischenablage, noch abschicken.')
    : nexted
    ? (shared
      ? `Dein Push ist bei ${nexted}. Jetzt ist ${nexted} dran.`
      : `Der Link liegt in der Zwischenablage. Abschicken, dann ist ${nexted} dran.`)
    : shared
    ? (n === 1
      ? 'Der Push ist raus. Mehr braucht es nicht.'
      : `${n} Pushes sind raus. Je mehr, desto besser.`)
    : (n === 1
      ? 'Der Link liegt in der Zwischenablage. Abschicken, dann ist der Push raus.'
      : `Der Link liegt in der Zwischenablage. Abschicken, dann sind es ${n}.`)

  burst(view.slots.party)
  revealSidequest(view, n === 1 ? 'Noch jemand im Kopf?' : 'Es geht noch jemand.')
}

const PARTY_HUES = ['--hue-teal', '--hue-brick', '--hue-plum', '--hue-green', '--hue-blue']

/**
 * Kurzer Konfetti-Ausbruch nach oben, in den Figma-Hues. Rein dekorativ:
 * der Container ist aria-hidden und hat keine Höhe, verschiebt also nichts.
 * Wer wenig Bewegung will, sieht ihn per CSS gar nicht erst.
 */
function burst(el) {
  el.hidden = false
  el.replaceChildren()
  for (let i = 0; i < 16; i++) {
    const angle = Math.PI * (0.1 + 0.8 * (i / 15))
    const dist = 60 + Math.random() * 70
    const piece = document.createElement('i')
    piece.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`)
    piece.style.setProperty('--dy', `${Math.round(-Math.sin(angle) * dist)}px`)
    piece.style.setProperty('--rot', `${Math.round(-180 + Math.random() * 360)}deg`)
    piece.style.setProperty('--delay', `${Math.round(Math.random() * 90)}ms`)
    piece.style.background = `var(${PARTY_HUES[i % PARTY_HUES.length]})`
    el.append(piece)
  }
}

/**
 * Das Namensfeld sitzt im eigenen Platz des Paares, nicht darunter. Dort
 * steht nachher der Name, also wird er auch dort eingetragen; ein Feld
 * daneben hätte erst erklären müssen, wofür es da ist.
 */
function nameInput(view) {
  const el = document.createElement('input')
  el.type = 'text'
  el.className = 'peer-input'
  el.maxLength = 20
  el.autocomplete = 'given-name'
  el.enterKeyHint = 'done'
  el.placeholder = 'Vorname'
  el.setAttribute('aria-label', 'Dein Vorname')
  el.value = store.load().name ?? ''
  // Enter schliesst das Feld ab. Sonst bliebe nur, daneben zu tippen.
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.blur() })
  // Jeder Buchstabe zählt sofort: der Name ist gesetzt und der Knopf bereit,
  // noch während der Cursor im Feld steht.
  el.addEventListener('input', () => {
    store.setName(el.value)
    syncPush(view)
  })
  el.addEventListener('change', () => {
    store.setName(el.value)
    const named = Boolean(store.load().name)
    if (named) view.editName = false
    renderPair(view)
    syncPush(view)
    if (!named) shakeName(view)
  })
  return el
}

/**
 * Kurzes Wackeln am Namensfeld. Es sitzt klein im eigenen Platz des Paares
 * und ist dort leicht zu übersehen: einmal beim Aufschlagen des Screens und
 * jedes Mal, wenn ohne Namen weitergegangen wird, meldet es sich.
 */
function shakeName(view) {
  const el = view.slots.pair.querySelector('.peer-input')
  if (!el) return
  el.removeAttribute('data-shake')
  // Ohne Reflow dazwischen zählt das Attribut als unverändert und die
  // Animation liefe nicht noch einmal.
  void el.offsetWidth
  el.setAttribute('data-shake', '')
}

/** Das Feld aufmachen und den Cursor hineinsetzen. */
function editName(view) {
  view.editName = true
  renderPair(view)
  view.slots.pair.querySelector('.peer-input')?.focus()
}

function revealSidequest(view, note) {
  view.slots.sidequest.hidden = false
  view.slots.sidenote.textContent = note
}

function button(label, variant, handler) {
  const el = document.createElement('button')
  el.className = `btn ${variant}`
  el.textContent = label
  el.addEventListener('click', handler)
  return el
}

/**
 * Die Meldung unter dem Teilen. Ohne Text steht sie nicht da: ein leerer
 * Absatz hielte nur eine Zeile frei.
 * @param {boolean} ok Erfolgsform statt Hinweisform
 */
function setStatus(el, text, ok = true) {
  el.textContent = text
  el.toggleAttribute('data-ok', Boolean(text) && ok)
  el.hidden = !text
}

/** @returns {boolean} false, wenn der Name noch fehlt */
function requireName(view) {
  if (store.load().name) return true
  setStatus(view.slots.status, 'Trag zuerst deinen Vornamen ein.', false)
  editName(view)
  shakeName(view)
  return false
}

/**
 * Gelungenes Teilen bekommt `data-ok` und damit die Erfolgsform.
 * @param {number} n Der wievielte Push auf diesem Screen. Ab dem zweiten
 *   zählt die Meldung mit, sonst stünde zweimal dasselbe da.
 */
function report(statusEl, result, n = 1) {
  const text = {
    shared: n === 1
      ? 'Geschickt. Der Push ist unterwegs.'
      : `Geschickt. Jetzt sind ${n} Pushes unterwegs.`,
    copied: 'Link kopiert. Jetzt einfügen und abschicken.',
    failed: 'Hat nicht geklappt. Versuch es nochmal.',
  }[result]
  // Ein Link von localhost geht nur auf diesem Gerät auf. Das passiert nur
  // in der Entwicklung, dann soll es aber nicht still scheitern.
  const local = result !== 'failed' && share.isLoopback()
  setStatus(statusEl, local
    ? `${text} Achtung: Der Link zeigt auf ${location.host} und geht nur auf diesem Gerät auf. Für andere Geräte die App über die WLAN-Adresse öffnen.`
    : text ?? '', result !== 'failed')
}

/**
 * @param {{ extra?: boolean }} [opts] extra: eine weitere Person zusätzlich
 * @returns {Promise<'shared'|'copied'|null>} null, wenn nichts rausging
 */
async function sendInvite(view, { extra = false } = {}) {
  const statusEl = view.slots.status
  if (!requireName(view)) return null
  const state = store.load()
  const id = store.newId()
  const base = { from: state.name, date: store.isoDay(), set: state.lastSet, id, week: store.weekBits(state) }
  // Der Hauptknopf gibt den Push zurück, wenn es jemanden gibt, dem er gilt.
  // Die Sidequest lädt immer jemand Neues ein.
  const back = extra ? null : view.backTo
  const next = extra ? null : view.nextWith
  // Das Menü geht an dem Knopf auf, der gedrückt wurde.
  const anchor = extra ? view.root.querySelector('[data-action="side"]') : view.push
  const rally = back ? (back.rally ?? 0) + 1 : next ? next.fives : 0
  const result = back
    ? await share.share(
      { ...base, kind: 'reply', answers: back.id, rally },
      `${state.name} hat auch 10 Minuten für den Rücken gemacht. High Five, ${back.name}! 🙌`, anchor)
    : next
    ? await share.share({ ...base, rally },
      `${state.name} hat heute vorgelegt. Bereit für euer nächstes High Five, ${next.name}?`, anchor)
    : await share.share(base,
      `${state.name} hat gerade 10 Minuten für den Rücken gemacht. Machst du mit?`, anchor)
  report(statusEl, result, (view.sent?.length ?? 0) + 1)
  if (result === 'failed') return null

  if (back) {
    store.addPush({ id, alias: back.name })
    store.closeFive(back.name, rally)
    store.clearPushedBy()
    view.replied = back.name
    view.backTo = null
  } else if (next) {
    store.addPush({ id, alias: next.name })
    view.nexted = next.name
    view.nextWith = null
  } else {
    store.addPush({ id })
  }
  return result
}

// ----------------------------------------------------------------- Timer

/** mm:ss ab einer Minute, sonst nur die Sekunden. */
function clockText(seconds) {
  return seconds >= 60
    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    : String(seconds)
}

/**
 * Die Anleitung als Schublade. Auf hohen Screens steht sie offen, auf
 * niedrigen zugeklappt: dort gehört die Höhe erst der Figur. Wer sie einmal
 * auf- oder zugeklappt hat, behält das für die ganze Einheit.
 */
function setupCue(view) {
  const drawer = view.slots.drawer
  const toggle = view.root.querySelector('[data-action="cue"]')

  const show = (open) => {
    drawer.toggleAttribute('data-open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }

  toggle.addEventListener('click', () => {
    cueOpen = !drawer.hasAttribute('data-open')
    show(cueOpen)
  })

  show(cueOpen ?? window.innerHeight >= CUE_ROOM)
}

/**
 * Zwei Dosisformen, zwei Darstellungen: eine Zeitvorgabe läuft und ist
 * antippbar, Wiederholungen sind eine Angabe und kein Bedienelement.
 */
function setupTimer(view, exercise) {
  const button = view.root.querySelector('[data-action="timer"]')
  const isTime = exercise.dose.type === 'time'

  button.hidden = !isTime
  view.slots.reps.hidden = isTime

  if (!isTime) {
    view.slots.repscount.textContent = String(exercise.dose.reps)
    return
  }

  const label = view.slots.timer
  const note = view.slots.timernote
  const icon = view.slots.timericon
  const total = exercise.dose.seconds

  // Der Füllstand läuft als Balken durch die ganze Zeile, nicht mehr als Ring.
  const setFill = (fraction) => button.style.setProperty('--fill', String(fraction))
  const setIcon = (name) => icon.setAttribute('href', `#i-${name}`)

  const idle = () => {
    button.dataset.state = 'idle'
    label.textContent = clockText(total)
    note.textContent = 'Antippen zum Starten'
    setIcon('play')
    setFill(0)
  }

  const finish = () => {
    stopTimer()
    button.dataset.state = 'done'
    label.textContent = 'Fertig'
    note.textContent = 'Nochmal'
    setIcon('check')
    setFill(1)
  }

  idle()
  button.setAttribute('aria-label', `Timer starten, ${doseText(exercise.dose)}`)

  button.addEventListener('click', () => {
    if (button.dataset.state === 'done') { idle(); return }
    if (timer) { stopTimer(); idle(); return }

    const endsAt = Date.now() + total * 1000
    button.dataset.state = 'running'
    note.textContent = 'Antippen zum Stoppen'
    setIcon('pause')
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      label.textContent = clockText(left)
      setFill(1 - left / total)
      if (left <= 0) finish()
    }
    tick()
    timer = setInterval(tick, 250)
  })
}

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = null
}

// ------------------------------------------------------------------ Flow

/** Den eingehenden Link vergessen, damit ein Reload nicht wieder darauf landet. */
function leaveLink() {
  incoming = null
  if (location.hash) history.replaceState(null, '', location.pathname)
}

/** Ein Satz, der zum Anfangen bewegt. Was gerade zutrifft, gewinnt. */
function readyLine(state) {
  const pushedBy = state.pushedBy?.name
  if (pushedBy) return `${pushedBy} hat vorgelegt. Zehn Minuten, dann hast du es auch gemacht.`
  if (state.active?.done.length) {
    return `Angefangen ist halb geschafft: ${state.active.done.length} von ${SLOTS.length} liegen schon hinter dir.`
  }
  const week = store.weekProgress(state)
  if (week.done === WEEK_GOAL - 1) return 'Noch diese eine Einheit, dann ist die Woche voll.'
  if (store.trainedToday(state)) return 'Heute schon erledigt. Eine zweite Runde schadet dem Rücken trotzdem nicht.'
  const run = store.streak(state)
  if (run > 0) return `${run === 1 ? 'Eine Woche' : run + ' Wochen'} am Stück. Halt die Reihe.`
  return 'Sechs Übungen, zehn Minuten. Danach sitzt du anders da.'
}

/**
 * Zwischenschritt vor der ersten Übung. Ohne ihn fällt man aus der Übersicht
 * mitten in den Timer; hier steht einmal, worum es gleich geht.
 */
function showReady({ from = [] } = {}) {
  const state = store.load()
  // Der Zwischenschritt erklärt, was gleich kommt. Wer das schon einmal
  // mitgemacht hat, weiss es und startet ohne ihn.
  if (state.sessionCount > 0 || state.history.length > 0) {
    startRun({ from })
    return
  }
  const view = screen('ready')
  view.slots.lead.textContent = readyLine(state)
  if (state.active?.done.length) view.slots.headline.textContent = 'Weiter gehts?'

  on(view.root, 'go', () => startRun({ from }))
  on(view.root, 'cancel', () => (incoming ? showInvite() : showHome()))
  mount(view, 'ready')
}

function startRun({ from = [] } = {}) {
  const before = store.load()
  const filter = filterFor(before.prefs)
  const state = store.startSession({
    filter,
    set: buildSet(before, { filter, from }),
  })
  const done = state.active?.done ?? []
  // Resume: beim ersten Slot weitermachen, der noch nicht erledigt ist.
  slotIndex = state.active.set.findIndex((id) => !done.includes(id))
  if (slotIndex < 0) slotIndex = SLOTS.length - 1
  showExercise()
}

function advance() {
  slotIndex++
  if (slotIndex >= SLOTS.length) showDone()
  else showExercise()
}

function back() {
  if (slotIndex === 0) return
  slotIndex--
  showExercise()
}

// ------------------------------------------------------------------ Start

// ------------------------------------------------------------------ App als App

/**
 * Service Worker anmelden, Illustrationen nachladen lassen, ein Update
 * anbieten. Angeboten, nicht untergeschoben: mitten in einer Einheit neu zu
 * laden wäre ein Abbruch.
 */
function setupServiceWorker() {
  const toast = document.querySelector('[data-slot="update"]')
  toast.querySelector('[data-action="reload"]').addEventListener('click', () => pwa.applyUpdate())
  pwa.register({
    onUpdate: () => {
      toast.hidden = false
      // Beide sitzen oben rechts, und die Meldung ist das Wichtigere.
      document.body.classList.add('has-toast')
    },
  })

  // Die Bilder aller Übungen, nicht nur der heutigen: sonst stünde die
  // nächste Einheit offline vor leeren Flächen. Wo Einzelposen liegen, sind
  // sie das, was gezeigt wird, also kommen sie statt der Illustration mit.
  // Erst wenn sonst nichts läuft.
  const later = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
  later(() => pwa.warm(EXERCISES.flatMap((exercise) => {
    if (exercise.frames) return library.frameUrls(exercise)
    return exercise.illu ? [`uebungen/${exercise.id}/illustration.svg`] : []
  })))
}

/**
 * Wer noch nichts gemacht hat und die App im Browser öffnet, bekommt erst die
 * Erklärung. Wer sie installiert geöffnet hat, hat sich längst entschieden.
 */
function isNewcomer() {
  // Alles, was im Speicher liegt, ist eine Spur von früher: ein Name, eine
  // Vorliebe, eine abgebrochene Einheit. Dann gehört der Start auf die
  // Übersicht und nicht noch einmal auf die Erklärung.
  return !store.hasData() && !pwa.isStandalone()
}

/**
 * Die beiden Knöpfe oben rechts: die Erklärung wie beim ersten Besuch und
 * die Einstellungen. Beide liegen ausserhalb der Screens, darum werden sie
 * einmal verdrahtet und nicht bei jedem Screen neu. Der Weg zurück führt
 * dahin, wo man stand.
 */
function setupTopButtons() {
  const back = () => HELP_FROM[standing] ?? showHome
  document.querySelector('[data-action="help"]')
    .addEventListener('click', () => showLanding(back()))
  document.querySelector('[data-action="settings-top"]')
    .addEventListener('click', () => showSettings(back()))
}

function init() {
  store.abortIfStale()
  store.tidy()
  // Vor dem ersten Screen: sonst stünde er kurz in der falschen Grösse oder
  // im falschen Modus da.
  applyLook()
  setupServiceWorker()
  setupTopButtons()
  // Ein Link, der im schon offenen Tab aufgeht, ändert nur den Hash: die
  // Seite lädt nicht neu. Darum auch auf den Wechsel hören, nicht nur auf den Start.
  window.addEventListener('hashchange', () => {
    const next = share.decode()
    if (!next) return
    stopTimer()
    incoming = next
    showInvite()
  })
  incoming = share.decode()
  if (incoming) showInvite()
  else if (isNewcomer()) showLanding()
  else showHome()
}

init()
