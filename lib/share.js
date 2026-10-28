// Share-Payload im URL-Hash. Kein Backend, kein Konto: der Push reist im Link.
//
// Nur eine Art von Link:
//   invite  "ich habe trainiert, machst du mit?"   Sender -> Person
//
// Der Push geht in eine Richtung. Es gibt keinen Rückweg und nichts zu
// schliessen: wer mitmacht, pusht beim nächsten Mal selber weiter.
//
// Der Payload ist fälschbar. Für einen Motivations-Push ist das in Ordnung,
// es hängt nichts daran ausser einer Anzeige.

const PARAM = 'p'
const MAX_NAME = 20
const KINDS = ['invite']

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

/** Übungs-Ids sind ASCII und kurz. Alles andere fliegt raus. */
function cleanSet(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((id) => typeof id === 'string' && /^[a-z0-9-]{1,48}$/.test(id))
    .slice(0, MAX_SET)
}

/**
 * @param {{ from: string, date?: string, set?: string[] }} payload
 * @returns {string} z.B. '#p=eyJrIjoiaW52aXRlIn0'
 */
export function encode({ from, date, set }) {
  const list = cleanSet(set)
  return `#${PARAM}=${toBase64url(JSON.stringify({
    k: 'invite',
    f: cleanName(from),
    d: date,
    // Die Übungen reisen mit, damit die andere Person dieselben machen kann.
    ...(list.length ? { s: list } : {}),
  }))}`
}

/**
 * Defensiv: alles Ungültige ergibt null, die App startet dann als
 * Direkteinstieg statt mit einem Fehler.
 * @returns {{ from: string, date: string|null, set: string[] }|null}
 */
export function decode(hash = location.hash) {
  const match = /[#&]p=([A-Za-z0-9\-_]+)/.exec(hash ?? '')
  if (!match) return null
  try {
    const raw = JSON.parse(fromBase64url(match[1]))
    const from = cleanName(raw.f)
    if (!from || !KINDS.includes(raw.k)) return null
    return {
      from,
      date: typeof raw.d === 'string' ? raw.d.slice(0, 10) : null,
      set: cleanSet(raw.s),
    }
  } catch {
    return null
  }
}

/**
 * Basis ohne Hash und ohne Query, damit derselbe Code lokal und nach einem
 * Deploy funktioniert.
 */
export function shareUrl(payload) {
  return location.origin + location.pathname + encode(payload)
}

/**
 * Web Share API, Fallback Clipboard.
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function share(payload, text) {
  const url = shareUrl(payload)
  // Satz, Leerzeile, Link. Der Link steht unten, weil die Nachricht zuerst
  // sagen soll, worum es geht.
  const message = `${text}\n\n${url}`

  if (navigator.share) {
    try {
      // `url` bewusst nicht mitgeben: sonst hängt die Zielanwendung ihn ein
      // zweites Mal an, meist in derselben Zeile wie den Satz.
      await navigator.share({ title: 'friendly push', text: message })
      return 'shared'
    } catch (err) {
      // Abbruch durch die Person ist kein Fehler, aber auch kein Erfolg.
      if (err?.name === 'AbortError') return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(message)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export { MAX_NAME }
