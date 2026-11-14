// Share-Payload im URL-Hash. Kein Backend, kein Konto: der Push reist im Link.
//
// Zwei Arten von Link:
//   invite  "ich habe trainiert, machst du mit?"           A -> B
//   reply   "hab's gemacht, jetzt bist du wieder dran"     B -> A, dann hin und her
//
// Die Antwort ist kein zweiter Schritt, sondern der Push zurück. Sie trägt
// die Kennung des Links, auf den sie antwortet, damit A den Decknamen des
// eigenen Pushes durch den echten Namen ersetzen kann.
//
// Der Payload ist fälschbar. Für einen Motivations-Push ist das in Ordnung,
// es hängt nichts daran ausser einer Anzeige.

const PARAM = 'p'
const MAX_NAME = 20
const KINDS = ['invite', 'reply']

function toBase64url(str) {
  // unescape-Ersatz: macht aus Umlauten Bytes, die btoa frisst.
  const bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)))
  return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(str.length / 4) * 4, '=')
  return decodeURIComponent(Array.from(atob(padded), (c) =>
    `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
}

function cleanName(value) {
  return String(value ?? '').trim().slice(0, MAX_NAME)
}

const MAX_SET = 8
const MAX_RALLY = 9999

/** Kennung eines Links: kurz, base36. */
function cleanId(value) {
  return typeof value === 'string' && /^[a-z0-9]{4,12}$/.test(value) ? value : null
}

/** Zähler der High Fives: ganze Zahl ab 0, nach oben gedeckelt. */
function cleanRally(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? Math.min(n, MAX_RALLY) : 0
}

/** Woche des Senders: [Montag als ISO-Tag, sieben Bit Montag bis Sonntag]. */
function cleanWeek(value) {
  if (!Array.isArray(value)) return null
  const [key, bits] = value
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  if (!Number.isInteger(bits) || bits < 0 || bits > 127) return null
  return { key, bits }
}

/** Übungs-Ids sind ASCII und kurz. Alles andere fliegt raus. */
function cleanSet(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((id) => typeof id === 'string' && /^[a-z0-9-]{1,48}$/.test(id))
    .slice(0, MAX_SET)
}

/**
 * @param {{ kind?: 'invite'|'reply', from: string, date?: string, set?: string[],
 *   id?: string, answers?: string, rally?: number, week?: {key: string, bits: number} }} payload
 * @returns {string} z.B. '#p=eyJrIjoiaW52aXRlIn0'
 */
export function encode({ kind = 'invite', from, date, set, id, answers, rally, week }) {
  const list = cleanSet(set)
  const reply = kind === 'reply'
  return `#${PARAM}=${toBase64url(JSON.stringify({
    k: reply ? 'reply' : 'invite',
    f: cleanName(from),
    d: date,
    // Die Übungen reisen mit, damit die andere Person dieselben machen kann.
    ...(list.length ? { s: list } : {}),
    ...(cleanId(id) ? { i: id } : {}),
    ...(reply && cleanId(answers) ? { a: answers } : {}),
    // Der Zähler reist in beiden Richtungen: der Invite nennt den Stand, die
    // Antwort den Stand plus eins.
    ...(cleanRally(rally) > 0 ? { r: cleanRally(rally) } : {}),
    ...(week ? { w: [week.key, week.bits] } : {}),
  }))}`
}

/**
 * Defensiv: alles Ungültige ergibt null, die App startet dann als
 * Direkteinstieg statt mit einem Fehler.
 * @returns {{ kind: 'invite'|'reply', from: string, date: string|null, set: string[],
 *   id: string|null, answers: string|null, rally: number,
 *   week: {key: string, bits: number}|null }|null}
 */
export function decode(hash = location.hash) {
  const match = /[#&]p=([A-Za-z0-9\-_]+)/.exec(hash ?? '')
  if (!match) return null
  try {
    const raw = JSON.parse(fromBase64url(match[1]))
    const from = cleanName(raw.f)
    if (!from || !KINDS.includes(raw.k)) return null
    return {
      kind: raw.k,
      from,
      date: typeof raw.d === 'string' ? raw.d.slice(0, 10) : null,
      set: cleanSet(raw.s),
      id: cleanId(raw.i),
      answers: raw.k === 'reply' ? cleanId(raw.a) : null,
      rally: cleanRally(raw.r),
      week: cleanWeek(raw.w),
    }
  } catch {
    return null
  }
}

/**
 * Basis ohne Hash und ohne Query, damit derselbe Code lokal und nach einem
 * Deploy funktioniert.
 */
/** Läuft die App unter einer Adresse, die nur dieses Gerät erreicht? */
export function isLoopback(host = location.hostname) {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
    || host.endsWith('.localhost')
}

export function shareUrl(payload) {
  return location.origin + location.pathname + encode(payload)
}

/**
 * Zuerst das eigene Menü, als Kontextmenü am Knopf: was die App selbst kann
 * (Link kopieren, die gängigen Kanäle als Direktlink), führt sie selbst aus.
 * Alles andere geht im zweiten Schritt über "Andere App …" an das
 * Teilen-Menü des Systems, sofern der Browser eines hat.
 * @param {HTMLElement} [anchor] der Knopf, an dem das Menü aufgeht
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function share(payload, text, anchor = null) {
  const url = shareUrl(payload)
  // Satz, Leerzeile, Link. Der Link steht unten, weil die Nachricht zuerst
  // sagen soll, worum es geht.
  const message = `${text}\n\n${url}`
  return menu({ text, url, message }, anchor)
}

/** Das Teilen-Menü des Systems. Braucht einen frischen Tipp, den liefert der Eintrag im Menü. */
async function nativeShare(message) {
  try {
    // `url` bewusst nicht mitgeben: sonst hängt die Zielanwendung ihn ein
    // zweites Mal an, meist in derselben Zeile wie den Satz.
    await navigator.share({ title: 'friendly push', text: message })
    return 'shared'
  } catch {
    // Abbruch durch die Person ist kein Fehler, aber auch kein Erfolg.
    return 'failed'
  }
}

/**
 * Die Kanäle als reine Links mit dem Text als Parameter: die App schickt
 * nichts selbst, sie öffnet nur die Zielanwendung mit vorbereiteter Nachricht.
 */
function channels({ message }) {
  const m = encodeURIComponent(message)
  return [
    // `sms:?&body=` versteht iOS wie Android.
    { label: 'Nachricht', icon: 'i-chat', href: `sms:?&body=${m}` },
    // Signal kennt keinen Link, der eine Nachricht vorausfüllt. Darum kommt
    // die Nachricht in die Zwischenablage, und `sgnl://` öffnet die App.
    { label: 'Signal', icon: 'i-signal', href: 'sgnl://', copyFirst: true },
    { label: 'Threema', icon: 'i-threema', href: `https://threema.id/compose?text=${m}`, external: true },
  ]
}

async function copy(message) {
  try {
    await navigator.clipboard.writeText(message)
    return true
  } catch {
    // Ohne sicheren Kontext fehlt auch die Zwischenablage. Der alte Weg über
    // ein Textfeld geht dort noch.
    return legacyCopy(message)
  }
}

function iconEl(id) {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'icon')
  svg.setAttribute('aria-hidden', 'true')
  const use = document.createElementNS(NS, 'use')
  use.setAttribute('href', '#' + id)
  svg.append(use)
  return svg
}

/** Ein Eintrag: Symbol und Wort. Ein Link, wenn er eine andere App öffnet. */
function item(tag, { label, icon }) {
  const el = document.createElement(tag)
  el.className = 'share-menu-item'
  el.setAttribute('role', 'menuitem')
  if (tag === 'button') el.type = 'button'
  const text = document.createElement('span')
  text.textContent = label
  el.append(iconEl(icon), text)
  return el
}

const GAP = 8
const EDGE = 16

/**
 * Am Knopf ausrichten: darüber, wenn dort Platz ist, sonst darunter. Mittig
 * zum Knopf, aber nie über den Rand hinaus. Ohne Knopf mittig unten.
 */
function place(dlg, anchor) {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const w = dlg.offsetWidth
  const h = dlg.offsetHeight
  if (!anchor) {
    dlg.style.left = `${Math.round((vw - w) / 2)}px`
    dlg.style.top = `${Math.round(vh - h - EDGE)}px`
    return
  }
  const r = anchor.getBoundingClientRect()
  const left = Math.min(Math.max(r.left + r.width / 2 - w / 2, EDGE), vw - w - EDGE)
  const above = r.top - GAP - h >= EDGE
  const top = above ? r.top - GAP - h : Math.min(r.bottom + GAP, vh - h - EDGE)
  dlg.dataset.side = above ? 'above' : 'below'
  dlg.style.left = `${Math.round(left)}px`
  dlg.style.top = `${Math.round(Math.max(top, EDGE))}px`
}

/**
 * Das Menü als natives <dialog>: Fokus, Escape und der Hintergrund kommen
 * vom Browser. Ein Kanal gilt als geteilt, sobald er angetippt ist: was
 * danach in der Zielanwendung passiert, sieht die App nicht.
 */
function menu(data, anchor) {
  return new Promise((resolve) => {
    let result = 'failed'
    const dlg = document.createElement('dialog')
    dlg.className = 'share-menu'
    dlg.setAttribute('aria-label', 'Push verschicken')
    const list = document.createElement('div')
    list.setAttribute('role', 'menu')

    // Erst nach dem Klick schliessen, sonst verschluckt das Entfernen des
    // Dialogs auf manchen Browsern das Öffnen des Links.
    const finish = (value) => {
      result = value
      setTimeout(() => dlg.close(), 60)
    }
    const sep = () => {
      const hr = document.createElement('hr')
      hr.setAttribute('role', 'separator')
      list.append(hr)
    }

    // Kopieren steht zuoberst: das kann die App immer selbst. Einmal mit dem
    // Satz davor, fürs Einfügen in einen Chat, einmal nur der Link, wenn
    // man lieber selber schreibt.
    const copyBtn = item('button', { label: 'Link und Nachricht kopieren', icon: 'i-send' })
    copyBtn.addEventListener('click', async () => {
      finish((await copy(data.message)) ? 'copied' : 'failed')
    })
    const linkBtn = item('button', { label: 'Link kopieren', icon: 'i-link' })
    linkBtn.addEventListener('click', async () => {
      finish((await copy(data.url)) ? 'copied' : 'failed')
    })
    list.append(copyBtn, linkBtn)
    sep()

    for (const ch of channels(data)) {
      const a = item('a', ch)
      a.href = ch.href
      if (ch.external) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      a.addEventListener('click', () => {
        if (!ch.copyFirst) return finish('shared')
        // Synchron im Tipp kopieren, bevor der Browser zur App wechselt.
        const ok = legacyCopy(data.message)
        if (!ok) copy(data.message)
        finish('copied')
      })
      list.append(a)
    }

    // Was die App nicht direkt kann, übernimmt das System.
    if (navigator.share) {
      sep()
      const more = item('button', { label: 'Andere …', icon: 'i-export' })
      more.addEventListener('click', async () => finish(await nativeShare(data.message)))
      list.append(more)
    }

    dlg.append(list)
    // Tipp daneben schliesst, wie bei jedem Kontextmenü.
    dlg.addEventListener('click', (event) => {
      if (event.target === dlg) finish('failed')
    })
    dlg.addEventListener('close', () => {
      window.removeEventListener('resize', reposition)
      dlg.remove()
      resolve(result)
    })
    const reposition = () => place(dlg, anchor)
    window.addEventListener('resize', reposition)
    document.body.append(dlg)
    dlg.showModal()
    place(dlg, anchor)
    // Der erste Eintrag bekommt den Fokus, damit die Tastatur gleich weiterkommt.
    copyBtn.focus({ preventScroll: true })
  })
}

function legacyCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  // Ausserhalb des Bildes, aber nicht display:none, sonst lässt es sich nicht markieren.
  el.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px'
  document.body.append(el)
  el.select()
  el.setSelectionRange(0, text.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch { /* nichts */ }
  el.remove()
  return ok
}

export { MAX_NAME }
