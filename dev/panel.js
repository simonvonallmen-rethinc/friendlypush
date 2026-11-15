// Dev-Leiste: Zustände fürs visuelle Review erzwingen. Werkzeug, nicht Teil
// der App. app.js lädt sie nur auf einem Entwicklungs-Host.
//
//   ?devstate=<id>   Zustand aus dev/states.js herstellen und zeigen
//   ?devtheme=dark   Erscheinungsbild erzwingen (system, light, dark)
//   ?devbare=1       ohne DEV-Knopf, für die Übersicht dev/states.html
//
// Mit ?devstate liegt der Speicher nur im Arbeitsspeicher der Seite (siehe
// lib/store.js). Die echten Daten bleiben unberührt; "Zu meinen Daten"
// lädt die App ohne Parameter.

import { STATES, stateById } from './states.js'

const params = new URLSearchParams(location.search)

/** @param {ReturnType<import('../app.js').devApi>} app */
export function boot(app) {
  const id = app.store.devStateRequested()
  const theme = params.get('devtheme')
  const state = id ? stateById(id) : null

  if (id) {
    const seed = state?.seed()
    if (seed) app.store.save(seed)
    if (theme) app.store.setPrefs({ theme })
    app.applyLook()
    if (state) state.show(app)
    else app.showHome()
  } else if (theme) {
    // Ohne Zustand nur für diese Seite: die echte Vorliebe bleibt.
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
  }

  if (params.get('devbare') !== '1') mountButton(state)
}

function url(next) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v) q.set(k, v)
  const s = q.toString()
  return location.pathname + (s ? `?${s}` : '')
}

function mountButton(state) {
  injectStyle()
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'dev-btn'
  btn.textContent = state ? `DEV · ${state.label}` : 'DEV'
  btn.addEventListener('click', () => openPanel(state))
  document.body.append(btn)
}

function openPanel(current) {
  const theme = params.get('devtheme') ?? ''
  const dlg = document.createElement('dialog')
  dlg.className = 'dev-panel'

  const head = document.createElement('div')
  head.className = 'dev-head'
  const title = document.createElement('b')
  title.textContent = 'Zustände'
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = '×'
  close.setAttribute('aria-label', 'Schliessen')
  close.addEventListener('click', () => dlg.close())
  head.append(title, close)
  dlg.append(head)

  // Erscheinungsbild: gilt für den nächsten Zustand mit.
  const themes = document.createElement('div')
  themes.className = 'dev-row'
  for (const [value, label] of [['', 'Wie gespeichert'], ['light', 'Hell'], ['dark', 'Dunkel']]) {
    const a = document.createElement('a')
    a.textContent = label
    a.href = url({ devstate: current?.id, devtheme: value })
    if (value === theme) a.dataset.on = ''
    themes.append(a)
  }
  dlg.append(themes)

  let group = ''
  let list = null
  for (const s of STATES) {
    if (s.group !== group) {
      group = s.group
      const h = document.createElement('p')
      h.className = 'dev-group'
      h.textContent = group
      list = document.createElement('div')
      list.className = 'dev-list'
      dlg.append(h, list)
    }
    const a = document.createElement('a')
    a.textContent = s.label
    a.href = url({ devstate: s.id, devtheme: theme })
    if (s.id === current?.id) a.dataset.on = ''
    list.append(a)
  }

  const foot = document.createElement('div')
  foot.className = 'dev-row dev-foot'
  const all = document.createElement('a')
  all.textContent = 'Alle Zustände nebeneinander'
  all.href = 'dev/states.html'
  const mine = document.createElement('a')
  mine.textContent = 'Zu meinen Daten'
  mine.href = location.pathname
  foot.append(all, mine)
  dlg.append(foot)

  dlg.addEventListener('click', (event) => { if (event.target === dlg) dlg.close() })
  dlg.addEventListener('close', () => dlg.remove())
  document.body.append(dlg)
  dlg.showModal()
}

/** Eigene Stile, damit styles.css nichts vom Werkzeug weiss. */
function injectStyle() {
  const css = `
.dev-btn {
  position: fixed; z-index: 50; left: 10px; bottom: 10px;
  max-width: calc(100vw - 20px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding: 6px 10px; border: 0; border-radius: 8px;
  background: #111; color: #ffde59; font: 600 12px/1.2 ui-monospace, monospace; cursor: pointer;
  opacity: 0.85;
}
.dev-panel {
  width: min(100vw - 24px, 380px); max-height: calc(100dvh - 24px); padding: 12px;
  border: 0; border-radius: 14px; background: #111; color: #eee;
  font: 13px/1.35 system-ui, sans-serif;
}
.dev-panel::backdrop { background: rgb(0 0 0 / 35%); }
.dev-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.dev-head button { border: 0; background: none; color: #eee; font-size: 22px; cursor: pointer; }
.dev-group { margin: 12px 0 4px; color: #ffde59; font: 600 11px ui-monospace, monospace; text-transform: uppercase; }
.dev-list { display: flex; flex-direction: column; }
.dev-panel a { color: #eee; text-decoration: none; padding: 6px 8px; border-radius: 6px; }
.dev-panel a:hover { background: #222; }
.dev-panel a[data-on] { background: #ffde59; color: #111; }
.dev-row { display: flex; flex-wrap: wrap; gap: 4px; }
.dev-foot { margin-top: 12px; padding-top: 8px; border-top: 1px solid #333; justify-content: space-between; }
`
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
}
