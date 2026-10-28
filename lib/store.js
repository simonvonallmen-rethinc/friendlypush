// Zustand in localStorage. Ein Schlüssel, ein JSON-Objekt.
// Die Auswertungen (Wochenziel, Streak, Heatmap) sind pure Funktionen über
// der History und laufen auch ohne DOM.

import { MIN_DONE, WEEK_GOAL } from '../data/slots.js'

const KEY = 'fp.v1'
const STALE_MS = 2 * 60 * 60 * 1000 // 2 h, danach ist eine Einheit verfallen
const HEATMAP_WEEKS = 12

const EMPTY = {
  name: null,
  sessionCount: 0,
  history: [],     // ISO-Tage abgeschlossener Einheiten, aufsteigend, ohne Dubletten
  active: null,    // { startedAt, done, skipped, set: [exerciseId], floor }
  // Vorlieben für die nächste Einheit. Vor jedem Start kurz umstellbar.
  prefs: { floor: true },
  lastSet: [],     // Übungen der zuletzt abgeschlossenen Einheit, für den Push
  // Der Kern: ich trainiere, ich motiviere eine Person, fertig. Ein Push geht
  // nur in eine Richtung, es kommt nichts zurück.
  pushes: [],      // [{ day }], in der Reihenfolge, in der sie rausgingen
  pushedBy: null,  // { name, day } der Person, über deren Link ich hier bin
}

// ---------------------------------------------------------------- Datum

/** Lokaler Tag als YYYY-MM-DD. toISOString wäre UTC und würde abends kippen. */
export function isoDay(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDay(day) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Montag der Woche, in der `date` liegt. */
function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const shift = (d.getDay() + 6) % 7 // Sonntag = 0 -> 6
  d.setDate(d.getDate() - shift)
  return d
}

/** Wochenschlüssel: der ISO-Tag des Montags. Sortierbar und vergleichbar. */
export function weekKey(day) {
  return isoDay(mondayOf(typeof day === 'string' ? parseDay(day) : day))
}

function weeksBack(n, from = new Date()) {
  const d = mondayOf(from)
  d.setDate(d.getDate() - n * 7)
  return isoDay(d)
}

// ---------------------------------------------------------------- Laden

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    return { ...EMPTY, ...parsed }
  } catch {
    // Kaputter oder gesperrter Storage darf die App nicht verhindern.
    return { ...EMPTY }
  }
}

export function save(patch) {
  const next = { ...load(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private-Mode oder volles Kontingent: der Lauf funktioniert, nur nichts bleibt.
  }
  return next
}

export function reset() {
  try {
    localStorage.removeItem(KEY)
  } catch { /* egal */ }
}

// ---------------------------------------------------------------- Einheit

/** Verwirft eine angefangene Einheit, die älter als 2 h ist. */
export function abortIfStale(now = Date.now()) {
  const state = load()
  if (state.active && now - state.active.startedAt > STALE_MS) {
    return save({ active: null })
  }
  return state
}

/**
 * Startet eine Einheit und friert ihre Übungen ein. Würden sie bei jedem
 * Screen neu gewählt, änderte ein Wechsel der Vorlieben mitten im Lauf die
 * schon erledigten Übungen.
 * @param {{ set?: string[], floor?: boolean }} [opts]
 */
export function startSession({ set = [], floor } = {}) {
  const state = load()
  if (state.active) return state
  return save({
    active: {
      startedAt: Date.now(),
      done: [],
      skipped: [],
      set,
      floor: floor ?? state.prefs.floor,
    },
  })
}

export function setPrefs(patch) {
  const state = load()
  return save({ prefs: { ...state.prefs, ...patch } })
}

export function markDone(exerciseId) {
  const state = load()
  const active = state.active ?? { startedAt: Date.now(), done: [], skipped: [], set: [] }
  // Nachgeholt schlägt übersprungen: der Eintrag wandert von einer Liste in die andere.
  const skipped = (active.skipped ?? []).filter((id) => id !== exerciseId)
  if (active.done.includes(exerciseId)) return save({ active: { ...active, skipped } })
  return save({ active: { ...active, done: [...active.done, exerciseId], skipped } })
}

/** Übersprungen zählt nicht als erledigt, bleibt aber im Fortschritt sichtbar. */
export function markSkipped(exerciseId) {
  const state = load()
  const active = state.active ?? { startedAt: Date.now(), done: [], skipped: [], set: [] }
  const skipped = active.skipped ?? []
  if (active.done.includes(exerciseId) || skipped.includes(exerciseId)) return state
  return save({ active: { ...active, skipped: [...skipped, exerciseId] } })
}

export function discardSession() {
  return save({ active: null })
}

/**
 * Schliesst die Einheit ab. Zählt ab MIN_DONE erledigten Übungen und
 * höchstens einmal pro Tag fürs Wochenziel.
 * @returns {{ counted: boolean, reason: 'few'|'duplicate'|null, done: number, state: Object }}
 */
export function completeSession(now = new Date()) {
  const state = load()
  const done = state.active?.done.length ?? 0
  if (done < MIN_DONE) {
    return { counted: false, reason: 'few', done, state: save({ active: null }) }
  }
  const day = isoDay(now)
  const duplicate = state.history.includes(day)
  const history = duplicate ? state.history : [...state.history, day].sort()
  return {
    counted: !duplicate,
    reason: duplicate ? 'duplicate' : null,
    done,
    state: save({
      active: null,
      history,
      sessionCount: state.sessionCount + 1,
      // Für den Push: die Person am anderen Ende soll dieselben Übungen
      // machen können.
      lastSet: state.active?.set ?? [],
    }),
  }
}

// ---------------------------------------------------------------- Auswertung

function countsByWeek(history) {
  const map = new Map()
  for (const day of history) {
    const key = weekKey(day)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export function weekProgress(state = load(), now = new Date()) {
  const key = weekKey(now)
  const done = countsByWeek(state.history).get(key) ?? 0
  return { done: Math.min(done, WEEK_GOAL), goal: WEEK_GOAL, reached: done >= WEEK_GOAL }
}

/**
 * Zusammenhängende Wochen mit erreichtem Wochenziel.
 * Die laufende Woche bricht den Streak nicht, solange sie noch läuft:
 * sie zählt erst mit, wenn das Ziel erreicht ist.
 */
export function streak(state = load(), now = new Date()) {
  const byWeek = countsByWeek(state.history)
  let count = 0
  let start = 0
  if ((byWeek.get(weeksBack(0, now)) ?? 0) < WEEK_GOAL) start = 1
  for (let i = start; ; i++) {
    if ((byWeek.get(weeksBack(i, now)) ?? 0) < WEEK_GOAL) break
    count++
  }
  return count
}

export function trainedToday(state = load(), now = new Date()) {
  return state.history.includes(isoDay(now))
}

/** Tage bis Sonntag, heute mitgezählt. */
export function daysLeftInWeek(now = new Date()) {
  return 7 - ((now.getDay() + 6) % 7)
}

/**
 * Die laufende Woche als sieben Tage, Montag zuerst. Für jeden Tag steht
 * drin, ob trainiert wurde und ob an dem Tag ein Push rausging.
 */
export function weekDays(state = load(), now = new Date()) {
  const monday = mondayOf(now)
  const today = isoDay(now)
  const labels = ['M', 'D', 'M', 'D', 'F', 'S', 'S']
  const pushDays = new Set(state.pushes.map((p) => p.day))
  return labels.map((label, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const day = isoDay(d)
    return {
      day,
      label,
      done: state.history.includes(day),
      push: pushDays.has(day),
      today: day === today,
      future: day > today,
    }
  })
}

/** 12 Wochen, älteste zuerst. */
export function heatmap(state = load(), now = new Date()) {
  const byWeek = countsByWeek(state.history)
  const weeks = []
  for (let i = HEATMAP_WEEKS - 1; i >= 0; i--) {
    const key = weeksBack(i, now)
    weeks.push({ week: key, count: Math.min(byWeek.get(key) ?? 0, WEEK_GOAL), current: i === 0 })
  }
  return weeks
}

// ---------------------------------------------------------------- Push

export function setName(name) {
  return save({ name: name.trim().slice(0, 20) || null })
}

/**
 * Ich habe trainiert und den Push weitergegeben. Einseitig und damit fertig:
 * es kommt nichts zurück, was noch zu verbuchen wäre. An wen der Link ging,
 * weiss die App nicht, der Versand läuft ausserhalb.
 */
export function addPush() {
  const state = load()
  return save({ pushes: [...state.pushes, { day: isoDay() }] })
}

/** Die Person, über deren Link ich hier bin. Steht da, bis ich sie zurückpushe. */
export function setPushedBy(name, day = isoDay()) {
  return save({ pushedBy: { name: cleanName(name), day } })
}

export function clearPushedBy() {
  return save({ pushedBy: null })
}

export function pushCount(state = load()) {
  return state.pushes.length
}

export function lastPush(state = load()) {
  return state.pushes.at(-1) ?? null
}

function cleanName(value) {
  return String(value ?? '').trim().slice(0, 20)
}

export { WEEK_GOAL, MIN_DONE }
