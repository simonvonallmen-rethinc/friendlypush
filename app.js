// State, Routing, Session-Flow.
// Ein Screen gleichzeitig, Templates aus index.html, kein Router und keine
// History-API: der Hash gehört dem Share-Payload.
//
// Kern ist eine einseitige Geste: du trainierst, du motivierst eine Person,
// fertig. Es kommt nichts zurück, nichts muss geschlossen werden. Wer
// mitmacht, gibt den Push beim nächsten Mal selber weiter.

import { SLOTS, WEEK_GOAL } from './data/slots.js'
import { EXERCISES, pickExercise, byId, uprightSlots } from './data/exercises.js'
import * as store from './lib/store.js'
import * as share from './lib/share.js'
import * as library from './lib/library.js'
import * as pwa from './lib/pwa.js'

const app = document.getElementById('app')

/** Laufzeitzustand, nichts davon ist persistent. */
let incoming = null   // decodierter Payload des Links, mit dem wir geladen wurden
let slotIndex = 0
let timer = null
let cueOpen = null    // Anleitung aufgeklappt; null heisst: noch nicht angetippt

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
  // Die Erklärung läuft in Bändern über die ganze Breite, die App nicht.
  document.body.classList.toggle('is-landing', id === 'landing')
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
    }

    peer.append(mark, name)
    // Der eigene Platz trägt den Stift, solange der Name nur dasteht: er
    // sagt, dass hier etwas zu ändern ist, ohne eine zweite Zeile dafür.
    if (person.edit) peer.append(editMark(person.edit))
    el.append(peer)
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
 * Die laufende Woche als sieben Tage. Ein Tag mit Push trägt zum Haken
 * zusätzlich einen Stern: er ist ein Trainingstag und einer mehr.
 */
function fillWeek(el, days) {
  el.replaceChildren()
  for (const day of days) {
    const cell = document.createElement('span')
    cell.className = 'day'
    if (day.done) cell.dataset.done = ''
    if (day.push) cell.dataset.push = ''
    if (day.today) cell.dataset.today = ''
    if (day.future) cell.dataset.future = ''

    const label = document.createElement('i')
    label.setAttribute('aria-hidden', 'true')
    label.textContent = day.label
    const mark = document.createElement('b')
    mark.setAttribute('aria-hidden', 'true')
    mark.textContent = day.done ? (day.push ? '\u2713\u2605' : '\u2713') : ''
    cell.append(label, mark)
    el.append(cell)
  }
  const done = days.filter((d) => d.done).length
  const pushes = days.filter((d) => d.push).length
  el.setAttribute('aria-label',
    `Diese Woche ${done} Einheiten${pushes ? `, davon ${pushes} mit Push` : ''}`)
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
      ? 'Heute trainiert und das Wochenziel steht. Alles Weitere ist geschenkt.'
      : 'Wochenziel steht. Alles Weitere ist geschenkt.'
  }
  if (today) {
    return left === 1
      ? 'Heute erledigt. Eine Einheit fehlt noch diese Woche.'
      : `Heute erledigt. Noch ${left} Einheiten diese Woche.`
  }
  if (left > days) {
    return `Noch ${left} Einheiten, aber nur ${days === 1 ? 'heute' : `${days} Tage`}. Das wird knapp.`
  }
  const rest = days === 1 ? 'Heute ist der letzte Tag' : `Noch ${days} Tage Zeit`
  return left === 1
    ? `Eine Einheit fehlt diese Woche. ${rest}.`
    : `${left} Einheiten fehlen diese Woche. ${rest}.`
}


function doseText(dose) {
  if (dose.type === 'reps') return `${dose.reps} Wiederholungen`
  return dose.seconds >= 60 ? `${dose.seconds / 60} Minute` : `${dose.seconds} Sekunden`
}

function pushCountText(n) {
  if (n === 0) return ''
  return n === 1 ? 'Du hast eine Person motiviert.' : `Du hast ${n} Personen motiviert.`
}

/** Mein Anzeigename, solange keiner gesetzt ist. */
function myLabel(state) {
  return state.name ?? 'Du'
}

// ------------------------------------------------------------------ Satz

/**
 * Die sechs Übungen einer Einheit, eine pro Slot. Wird beim Start
 * festgelegt und bleibt bis zum Ende gleich.
 * @param {{ floor?: boolean, from?: string[] }} [opts]  übernimmt ein
 *   mitgeschicktes Set, soweit die Ids noch existieren.
 */
function buildSet(state, { floor = true, from = [] } = {}) {
  const given = new Map()
  for (const id of from) {
    const ex = byId(id)
    if (ex && !given.has(ex.slot)) given.set(ex.slot, ex.id)
  }
  return SLOTS.map((slot) =>
    given.get(slot.id) ?? pickExercise(slot, state.sessionCount, { floor }).id)
}

/** Übung für den aktuellen Slot, aus dem eingefrorenen Satz der Einheit. */
function exerciseAt(state, index) {
  const slot = SLOTS[index]
  const id = state.active?.set?.[index]
  return (id && byId(id))
    ?? pickExercise(slot, state.sessionCount, { floor: state.active?.floor ?? true })
}

/** Für wie viele Slots es eine Übung ohne Boden gibt. */
function uprightCoverage() {
  const have = uprightSlots()
  return SLOTS.filter((s) => have.has(s.id)).length
}


/**
 * Kurze Abfrage vor dem Start: geht es heute auf den Boden oder nicht.
 * Steht auf beiden Einstiegen, Übersicht und Einladung.
 *
 * Eine laufende Einheit behält ihre Übungen. Sonst würde ein Umschalten
 * mitten im Lauf die schon erledigten Übungen austauschen.
 */
function fillPrefs(el) {
  const state = store.load()
  const running = (state.active?.done.length ?? 0) > 0
  el.replaceChildren()

  const label = document.createElement('p')
  label.className = 'prefs-label'
  label.textContent = 'Heute trainiere ich'

  const row = document.createElement('div')
  row.className = 'chips'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Wo du trainierst')

  const chip = (text, floor) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'chip'
    b.textContent = text
    b.setAttribute('aria-pressed', String(state.prefs.floor === floor))
    b.disabled = running
    b.addEventListener('click', () => {
      store.setPrefs({ floor })
      fillPrefs(el)
    })
    return b
  }
  row.append(chip('Auch am Boden', true), chip('Nur im Stehen', false))
  el.append(label, row)

  const note = document.createElement('p')
  note.className = 'note'
  const covered = uprightCoverage()
  if (running) {
    note.textContent = 'Die angefangene Einheit behält ihre Übungen.'
  } else if (!state.prefs.floor && covered === 0) {
    note.textContent = 'Für keinen Bereich gibt es bisher eine Übung im Stehen. Die Einheit läuft am Boden.'
  } else if (!state.prefs.floor && covered < SLOTS.length) {
    note.textContent = `Für ${SLOTS.length - covered} von ${SLOTS.length} Bereichen gibt es noch keine Übung im Stehen. Dort bleibt es am Boden.`
  } else {
    return
  }
  el.append(note)
}

// ------------------------------------------------------------------ Einladung

function showInvite() {
  const state = store.load()
  const from = incoming.from
  const view = screen('invite')

  view.slots.headline.textContent = `${from} hat heute trainiert`
  fillPair(view.slots.pair, [
    { name: from, done: true },
    { name: myLabel(state), pending: true, you: true },
  ])
  view.slots.lead.textContent =
    `${from} gibt dir einen friendly push. Zehn Minuten, dann hast du es auch gemacht.`

  fillPrefs(view.slots.prefs)

  // Mit Satz im Link gibt es eine Wahl: dieselben Übungen oder eigene.
  const sameSet = incoming.set ?? []
  if (sameSet.length) {
    view.slots.startbtn.textContent = `Gleiche Übungen wie ${from}`
    view.slots.startown.hidden = false
  }

  const go = (from_) => () => {
    store.setPushedBy(from)
    showReady({ from: from_ })
  }
  on(view.root, 'start', go(sameSet))
  on(view.root, 'start-own', go([]))
  mount(view, 'invite')
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
  }

  const trained = store.trainedToday(state)
  if (!firstVisit) {
    view.slots.headline.textContent = trained
      ? 'Heute schon trainiert'
      : 'Zehn Minuten für deinen Rücken'
    view.slots.startbtn.textContent = trained ? 'Nochmal trainieren' : 'Einheit starten'
  }

  // Die Karte zeigt die offene Geste: entweder schuldest du jemandem den Push
  // zurück, oder deine bisherigen Pushes stehen da.
  const pushes = store.pushCount(state)
  const from = state.pushedBy?.name
  if (from || pushes) {
    view.slots.pushcard.hidden = false
    fillPair(view.slots.pushpair, from
      ? [{ name: from, done: true }, { name: myLabel(state), done: true, you: true }]
      : [{ name: myLabel(state), done: true, you: true }, { name: 'weitergegeben', done: true }])
    view.slots.pushnote.textContent = from
      ? `${from} hat dich gepusht. Beim nächsten Mal gibst du ${from} den friendly push.`
      : pushCountText(pushes)
  }

  if (state.active?.done.length) {
    view.slots.resume.hidden = false
    view.slots.resume.textContent =
      `Angefangene Einheit: ${state.active.done.length} von ${SLOTS.length} erledigt. Weiter geht es, wo du aufgehört hast.`
  }

  // Der Verlauf ist Nebensache und steht ganz unten.
  const run = store.streak(state)
  if (state.history.length) {
    view.slots.history.hidden = false
    view.slots.streak.textContent = run > 0
      ? (run === 1 ? 'Eine Woche am Stück.' : `${run} Wochen am Stück.`)
      : 'Dreimal in einer Woche startet den Streak.'
  }

  fillPrefs(view.slots.prefs)
  fillWipe(view.slots.wipe, showHome)

  on(view.root, 'start', () => showReady())
  on(view.root, 'library', () => showLibrary())
  mount(view, 'home')
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
  onAll(view.root, 'library', () => showLibrary(() => showLanding(back)))
  mount(view, 'landing')
}

/**
 * Alles löschen, in zwei Schritten. Der erste fragt nach, der zweite macht
 * es: der Verlauf liegt nur hier, und was weg ist, kommt nicht wieder. Ein
 * Knopf allein wäre für diesen Schritt zu wenig Widerstand.
 *
 * Er steht an zwei Orten, weil er an beiden gesucht wird: am Ende der
 * Übersicht, wo die Daten sichtbar sind, und in der Antwort, die von ihnen
 * handelt.
 *
 * @param {HTMLElement} el
 * @param {(() => void)|null} after Was nach dem Löschen zu tun ist. Die
 *   Übersicht zeichnet sich neu, weil dort steht, was es nicht mehr gibt.
 *   Die Erklärung bleibt stehen, dort ändert sich nichts.
 */
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

  const tail = ' Danach startet friendly push wie jede andere App: im Vollbild, ohne Adressleiste.'
  view.slots.installhow.textContent = pwa.isApple()
    ? 'In Safari das Teilen-Symbol antippen, dann «Zum Home-Bildschirm».' + tail
    : 'Im Menü des Browsers steht «App installieren» oder «Zum Startbildschirm hinzufügen».' + tail

  // Kommt das Angebot des Browsers, übernimmt der Knopf. Es kann vor oder
  // nach diesem Screen eintreffen, darum beides.
  pwa.whenInstallable(() => {
    view.slots.installhow.textContent =
      'Ein Tippen, dann liegt sie neben deinen anderen Apps.' + tail
    for (const button of buttons) button.hidden = false
  })

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const installed = await pwa.install()
      // Das Angebot ist nach einem Dialog verbraucht, egal wie er ausging.
      if (installed) block.hidden = true
      else for (const other of buttons) other.hidden = true
    })
  }
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
  const state = store.startSession({ set: buildSet(store.load(), { floor: store.load().prefs.floor }) })
  const slot = SLOTS[slotIndex]
  const exercise = exerciseAt(state, slotIndex)
  const view = screen('exercise')

  view.slots.step.textContent = `${slotIndex + 1}/${SLOTS.length}`
  view.slots.slot.textContent = slot.label
  view.slots.name.textContent = exercise.name
  view.slots.cue.textContent = exercise.cue
  view.slots.figure.replaceChildren(library.figureFor(exercise, 'ex-figure'))

  view.slots.progress.replaceChildren()
  const done = state.active?.done ?? []
  const skipped = state.active?.skipped ?? []
  SLOTS.forEach((s, i) => {
    const bar = document.createElement('i')
    const id = pickExercise(s, state.sessionCount).id
    if (i === slotIndex) bar.dataset.now = ''
    else if (done.includes(id)) bar.dataset.on = ''
    else if (skipped.includes(id)) bar.dataset.skip = ''
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

  // Wer selbst gepusht wurde, hat jetzt zwei Dinge offen: der Person Bescheid
  // geben und ihr beim nächsten Mal den Push zurückgeben.
  const pushedBy = state.pushedBy
  if (pushedBy?.name && reason !== 'few') {
    const owed = pushedBy.day !== store.isoDay()
    view.slots.pushback.hidden = false
    view.slots.pushback.textContent = owed
      ? `${pushedBy.name} hat dich damals gepusht. Heute wär ein guter Moment, den Push zurückzugeben.`
      : `Sag ${pushedBy.name} Bescheid, dass du die Übungen gemacht hast. Und beim nächsten Mal gibst du ${pushedBy.name} den friendly push.`
  }

  fillWeek(view.slots.week, store.weekDays(state))
  view.slots.weekline.textContent = weekSentence(state)

  const run = store.streak(state)
  view.slots.streak.textContent = run > 0
    ? (run === 1 ? 'Eine Woche am Stück.' : `${run} Wochen am Stück.`)
    : 'Dreimal in einer Woche startet den Streak.'

  // Ohne Namen steht im eigenen Platz des Paares das Feld, mit Namen der
  // Name und daneben der Stift.
  view.editName = !state.name

  renderPushStep(view)

  on(view.root, 'side', async () => {
    if (await sendInvite(view, { extra: true })) burst(view.slots.party)
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
 * motivieren. Mehr ist es nicht, es kommt nichts zurück.
 */
function renderPushStep(view) {
  view.slots.share.replaceChildren()
  renderPair(view)
  view.slots.sharehow.textContent =
    'Jetzt gibst du den Push weiter. Ein Link an eine Person, das war es.'

  view.push = button('Eine Person motivieren', 'btn-primary', async () => {
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
  fillPair(view.slots.pair, [
    {
      name: myLabel(store.load()),
      done: true,
      you: true,
      el: view.editName ? nameInput(view) : null,
      edit: view.editName ? null : () => editName(view),
    },
    { name: 'wer macht mit?', pending: true },
  ])
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
  const sent = result === 'shared'

  view.slots.share.replaceChildren()
  fillPair(view.slots.pair, [
    { name: myLabel(state), done: true, you: true, edit: () => editName(view) },
    { name: sent ? 'unterwegs' : 'Link bereit', done: true },
  ])
  view.slots.sharehow.textContent = sent
    ? 'Der Push ist raus. Mehr braucht es nicht.'
    : 'Der Link liegt in der Zwischenablage. Abschicken, dann ist der Push raus.'

  // Push zurückgegeben: der Hinweis dazu hat sich erledigt.
  if (!state.pushedBy) view.slots.pushback.hidden = true

  burst(view.slots.party)
  revealSidequest(view, 'Noch jemand im Kopf?')
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

/** @returns {boolean} false, wenn der Name noch fehlt */
function requireName(view) {
  if (store.load().name) return true
  view.slots.status.textContent = 'Trag zuerst deinen Vornamen ein.'
  editName(view)
  shakeName(view)
  return false
}

/** Gelungenes Teilen bekommt `data-ok` und damit die Erfolgsform. */
function report(statusEl, result) {
  statusEl.textContent = {
    shared: 'Geschickt. Der Push ist unterwegs.',
    copied: 'Link kopiert. Jetzt einfügen und abschicken.',
    failed: 'Hat nicht geklappt. Versuch es nochmal.',
  }[result]
  statusEl.toggleAttribute('data-ok', result !== 'failed')
}

/**
 * @param {{ extra?: boolean }} [opts] extra: eine weitere Person zusätzlich
 * @returns {Promise<'shared'|'copied'|null>} null, wenn nichts rausging
 */
async function sendInvite(view, { extra = false } = {}) {
  const statusEl = view.slots.status
  if (!requireName(view)) return null
  const state = store.load()
  const result = await share.share(
    { from: state.name, date: store.isoDay(), set: state.lastSet },
    `${state.name} hat gerade 10 Minuten für den Rücken gemacht. Machst du mit?`)
  report(statusEl, result)
  if (result === 'failed') return null

  store.addPush()
  // Der Push beim nächsten Mal galt der Person, die mich gepusht hat: damit
  // ist die Geste erwidert. Am selben Tag zählt sie noch nicht, da ging der
  // Link an jemand anderen.
  if (!extra && state.pushedBy && state.pushedBy.day !== store.isoDay()) store.clearPushedBy()
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
  const view = screen('ready')
  view.slots.lead.textContent = readyLine(state)
  if (state.active?.done.length) view.slots.headline.textContent = 'Weiter gehts?'

  on(view.root, 'go', () => startRun({ from }))
  on(view.root, 'cancel', () => (incoming ? showInvite() : showHome()))
  mount(view, 'ready')
}

function startRun({ from = [] } = {}) {
  const before = store.load()
  const state = store.startSession({
    floor: before.prefs.floor,
    set: buildSet(before, { floor: before.prefs.floor, from }),
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
  // nächste Einheit offline vor leeren Flächen. Erst wenn sonst nichts läuft.
  const later = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
  later(() => pwa.warm(
    EXERCISES.filter((exercise) => exercise.illu)
      .map((exercise) => `uebungen/${exercise.id}/illustration.svg`),
  ))
}

/**
 * Wer noch nichts gemacht hat und die App im Browser öffnet, bekommt erst die
 * Erklärung. Wer sie installiert geöffnet hat, hat sich längst entschieden.
 */
function isNewcomer(state) {
  return !state.history.length && !state.active && !state.sessionCount && !pwa.isStandalone()
}

/**
 * Das Fragezeichen: dieselbe Erklärung wie beim ersten Besuch, jederzeit
 * erreichbar. Es liegt ausserhalb der Screens, darum wird es einmal
 * verdrahtet und nicht bei jedem Screen neu.
 */
function setupHelp() {
  const button = document.querySelector('[data-action="help"]')
  button.addEventListener('click', () => showLanding(HELP_FROM[standing] ?? showHome))
}

function init() {
  store.abortIfStale()
  setupServiceWorker()
  setupHelp()
  incoming = share.decode()
  if (incoming) showInvite()
  else if (isNewcomer(store.load())) showLanding()
  else showHome()
}

init()
