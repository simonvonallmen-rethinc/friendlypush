// Installieren und aktuell bleiben.
//
// Zwei Dinge, die der Browser anbietet und die die App nur einsammeln muss:
// das Angebot, sich auf den Homescreen zu legen, und die Nachricht, dass eine
// neue Fassung bereitliegt. Beides passiert früh, teils bevor ein Screen
// steht, darum hört dieses Modul ab dem Laden zu und hebt das Ergebnis auf.

let deferredPrompt = null
let onInstallable = null

// Das Angebot kommt ungefragt und nur einmal. Wer es nicht gleich aufhebt,
// kann später nicht mehr danach fragen.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    onInstallable?.()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
  })
}

/** Läuft die App als installierte App, nicht im Browser-Tab? */
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: minimal-ui)').matches
    || window.navigator.standalone === true
}

/** iOS und iPadOS kennen kein `beforeinstallprompt`, dort geht es von Hand. */
export function isApple() {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Hat der Browser ein Installationsangebot gemacht? */
export function canInstall() {
  return deferredPrompt !== null
}

/**
 * Den Dialog des Browsers öffnen. Gibt zurück, ob installiert wurde. Das
 * Angebot ist danach verbraucht, egal wie die Antwort lautete.
 */
export async function install() {
  if (!deferredPrompt) return false
  const event = deferredPrompt
  deferredPrompt = null
  event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}

/** Wird gerufen, sobald ein Installationsangebot vorliegt. */
export function whenInstallable(handler) {
  onInstallable = handler
  if (deferredPrompt) handler()
}

/**
 * Den Worker anmelden und auf Neues horchen.
 *
 * Eine neue Fassung wird nicht untergeschoben: sie wartet, bis jemand
 * `applyUpdate()` ruft. Mitten in einer Einheit die Seite neu zu laden wäre
 * ein Abbruch, und die Inhalte selbst sind ohnehin aktuell, weil der Worker
 * jede Anfrage zuerst ans Netz gibt.
 *
 * @param {{ onUpdate?: () => void }} hooks
 */
export async function register({ onUpdate } = {}) {
  if (!('serviceWorker' in navigator)) return null

  try {
    // `updateViaCache: none` heisst: den Worker selbst nie aus dem
    // HTTP-Cache nehmen. Sonst könnte eine alte sw.js eine neue verdecken.
    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: './',
      updateViaCache: 'none',
    })

    const announce = (worker) => {
      if (!worker) return
      const check = () => {
        // Nur melden, wenn schon eine Fassung lief. Beim allerersten Besuch
        // ist "installiert" kein Update, sondern der Normalfall.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) onUpdate?.()
      }
      worker.addEventListener('statechange', check)
      check()
    }

    announce(registration.waiting)
    registration.addEventListener('updatefound', () => announce(registration.installing))

    // Beim Zurückkommen nachsehen, ob etwas Neues da ist. Eine App auf dem
    // Homescreen wird selten neu geladen, sie wird nur wieder hervorgeholt.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {})
    })

    return registration
  } catch {
    // Kein Worker, kein Offline. Die App läuft trotzdem.
    return null
  }
}

/** Die wartende Fassung übernehmen lassen und neu laden. */
export async function applyUpdate() {
  const registration = await navigator.serviceWorker.getRegistration()
  const waiting = registration?.waiting
  if (!waiting) { location.reload(); return }

  // Der Wechsel des Controllers ist das Signal, dass die neue Fassung steht.
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
  waiting.postMessage({ type: 'skip-waiting' })
}

/**
 * Dateien anmelden, die der Worker nicht von sich aus kennt: die
 * Illustrationen aller Übungen. Danach läuft auch eine Einheit offline, die
 * noch nie dran war.
 */
export function warm(urls) {
  navigator.serviceWorker?.ready
    .then((registration) => registration.active?.postMessage({ type: 'warm', urls }))
    .catch(() => {})
}
