// Zustände fürs visuelle Review. Werkzeug, nicht Teil der App.
//
// Jeder Zustand hat einen Speicherstand (`seed`) und einen Schritt, der den
// passenden Screen zeigt (`show`). Die Dev-Leiste in der App und die
// Übersicht dev/states.html lesen beide diese Liste. Geladen wird ein
// Zustand über `/?devstate=<id>`: der Speicher liegt dann nur im
// Arbeitsspeicher der Seite, die echten Daten bleiben unberührt.

import { EXERCISES } from '../data/exercises.js'

/** Lokaler Tag, n Tage von heute aus. */
export function day(n = 0) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const SET = EXERCISES.slice(0, 6).map((e) => e.id)

/** Eine Person, die die App kennt: Name, ein paar Einheiten, Release gelesen. */
function base(extra = {}) {
  return {
    name: 'Lea',
    sessionCount: 5,
    history: [day(-6), day(-4), day(-2)],
    lastSet: SET,
    seenRelease: '9999-12-31',
    ...extra,
  }
}

/** Eine fertige Einheit, die beim Abschluss-Screen verbucht wird. */
function finished(done = SET.length) {
  return { startedAt: Date.now() - 600000, done: SET.slice(0, done), skipped: [], set: SET, filter: {} }
}

function team(last, rally = 3, extra = {}) {
  return { duos: { Ben: { rally, last, days: [last], seen: [], week: null } }, ...extra }
}

export const STATES = [
  // ------------------------------------------------------------ Start
  { id: 'first-visit', group: 'Start', label: 'Erster Besuch (Übersicht)',
    seed: () => null, show: (app) => app.showHome() },
  { id: 'landing', group: 'Start', label: 'Landing',
    seed: () => base(), show: (app) => app.showLanding() },
  { id: 'home', group: 'Start', label: 'Übersicht, normal',
    seed: () => base(), show: (app) => app.showHome() },
  { id: 'settings', group: 'Start', label: 'Einstellungen',
    seed: () => base(), show: (app) => app.showSettings() },

  // ------------------------------------------------------------ Update
  { id: 'update-banner', group: 'Update', label: 'Banner "Neue Version"',
    seed: () => base(), show: (app) => { app.fakeUpdate(); app.showHome() } },
  { id: 'news-card', group: 'Update', label: 'Karte "Was ist neu"',
    seed: () => base({ seenRelease: null }), show: (app) => app.showHome() },
  { id: 'news-overlay', group: 'Update', label: 'Overlay mit "Neu laden"',
    seed: () => base({ seenRelease: null }),
    show: (app) => { app.fakeUpdate(); app.showHome(); app.openNews() } },

  // ------------------------------------------------------------ Team
  { id: 'team-today', group: 'Team', label: 'High Five heute',
    seed: () => base({ history: [day(-2), day(0)], ...team(day(0)) }), show: (app) => app.showHome() },
  { id: 'team-due', group: 'Team', label: 'Seit gestern (laut)',
    seed: () => base({ history: [day(-1)], ...team(day(-1)) }), show: (app) => app.showHome() },
  { id: 'team-late', group: 'Team', label: 'Seit 4 Tagen (laut)',
    seed: () => base({ history: [day(-4)], ...team(day(-4)) }), show: (app) => app.showHome() },
  { id: 'team-waiting', group: 'Team', label: 'Heute vorgelegt',
    seed: () => base({
      history: [day(-1), day(0)], ...team(day(-1)),
      pushes: [{ day: day(0), session: 5, alias: 'Ben', id: 'dev001' }],
    }),
    show: (app) => app.showHome() },

  // ------------------------------------------------------------ Einladung
  { id: 'invite', group: 'Einladung', label: 'Einladung öffnen',
    seed: () => base(),
    show: (app) => app.openLink({ kind: 'invite', from: 'Anna', date: day(0), set: SET, id: 'dev101', answers: null, rally: 0, week: null }) },
  { id: 'invite-next', group: 'Einladung', label: 'Nächste Runde vom Team',
    seed: () => base(team(day(-1))),
    show: (app) => app.openLink({ kind: 'invite', from: 'Ben', date: day(0), set: SET, id: 'dev102', answers: null, rally: 3, week: null }) },
  { id: 'challenge', group: 'Einladung', label: '"Jetzt nicht"-Karte',
    seed: () => base({ pendingInvite: { kind: 'invite', from: 'Anna', date: day(0), set: SET, id: 'dev103', answers: null, rally: 0, week: null, savedOn: day(0) } }),
    show: (app) => app.showHome() },
  { id: 'high-five', group: 'Einladung', label: 'Antwort öffnen: High Five',
    seed: () => base({
      history: [day(-2), day(0)],
      pushes: [{ day: day(0), session: 5, alias: 'Sideshow Bob', id: 'dev104' }],
    }),
    show: (app) => app.openLink({ kind: 'reply', from: 'Ben', date: day(0), set: [], id: 'dev105', answers: 'dev104', rally: 1, week: null }) },

  // ------------------------------------------------------------ Abschluss
  { id: 'done', group: 'Abschluss', label: 'Eine Person motivieren',
    seed: () => base({ active: finished() }), show: (app) => app.showDone() },
  { id: 'done-reply', group: 'Abschluss', label: '"Anna zurückpushen"',
    seed: () => base({ active: finished(), pushedBy: { name: 'Anna', day: day(0), id: 'dev201', rally: 0 } }),
    show: (app) => app.showDone() },
  { id: 'done-next', group: 'Abschluss', label: '"Ben pushen" (nächste Runde)',
    seed: () => base({ active: finished(), ...team(day(-1)) }), show: (app) => app.showDone() },
  { id: 'done-few', group: 'Abschluss', label: 'Zählt noch nicht',
    seed: () => base({ active: finished(2) }), show: (app) => app.showDone() },
  { id: 'done-noname', group: 'Abschluss', label: 'Ohne Namen',
    seed: () => base({ name: null, active: finished() }), show: (app) => app.showDone() },
  { id: 'share-menu', group: 'Abschluss', label: 'Teilen-Menü offen',
    seed: () => base({ active: finished() }),
    show: (app) => {
      app.showDone()
      // Erst im nächsten Frame steht der Knopf im Dokument.
      requestAnimationFrame(() => document.querySelector('.share .btn-primary')?.click())
    } },
]

export function stateById(id) {
  return STATES.find((s) => s.id === id) ?? null
}
