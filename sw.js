// Service Worker.
//
// Zweck ist Offline, nicht Geschwindigkeit. Darum fragt jede Anfrage zuerst
// das Netz und erst dann den Cache: eine geänderte styles.css oder ein neuer
// Übungstext sind beim nächsten Laden da, ohne dass jemand eine Version
// hochzählen muss. Der Cache ist nur das Netz von gestern, für den Fall, dass
// gerade keins da ist.
//
// Der Name des Caches wird trotzdem gepflegt: er wirft beim Aktivieren alles
// weg, was aus einer früheren Fassung stammt.

const CACHE = 'friendly-push-v2'

// Nach wie vielen Millisekunden ohne Antwort der Cache einspringt. Ein Handy
// im Funkloch antwortet nicht mit einem Fehler, es antwortet gar nicht.
const NETWORK_TIMEOUT = 4000

// Was die App zum Starten braucht. Die Illustrationen stehen nicht hier: die
// Seite meldet sie nach dem Start selbst an (Nachricht `warm`), damit die
// Liste nicht an zwei Orten gepflegt werden muss.
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './data/slots.js',
  './data/exercises.js',
  './lib/store.js',
  './lib/share.js',
  './lib/library.js',
  './lib/pwa.js',
  './uebungen/_app/ready.svg',
  './assets/icon.svg',
  './assets/lp-fact-konto.svg',
  './assets/lp-fact-daten.svg',
  './assets/lp-fact-kosten.svg',
  './assets/lp-install.svg',
  './assets/lp-final.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  // `reload` übergeht den HTTP-Cache des Browsers. Ohne das könnte die
  // Installation eine Datei einlagern, die schon beim Einlagern alt ist.
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(
      SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)),
    )),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name !== CACHE) await caches.delete(name)
    }
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  // Fremde Hosts gehen uns nichts an. Die App ruft von sich aus keine.
  if (new URL(request.url).origin !== self.location.origin) return
  event.respondWith(fromNetworkFirst(request))
})

/**
 * Netz zuerst, Cache als Netz von gestern. Was ankommt, wird eingelagert,
 * damit dieselbe Datei beim nächsten Mal auch ohne Netz da ist.
 */
async function fromNetworkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await withTimeout(fetch(revalidating(request)), NETWORK_TIMEOUT)
    // Nur vollständige Antworten einlagern. Ein 404 oder ein Teilstück (206)
    // wäre im Cache schlimmer als nichts.
    if (response.ok && response.type === 'basic') cache.put(request, response.clone())
    return response
  } catch {
    const hit = await cache.match(request, { ignoreSearch: request.mode === 'navigate' })
    if (hit) return hit
    // Jede Adresse der App führt auf dieselbe Seite, der Rest ist Routing im
    // Browser. Offline ist die eingelagerte Seite also immer die richtige.
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html')
      if (shell) return shell
    }
    return new Response('Offline und nicht im Zwischenspeicher.', {
      status: 504,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}

/**
 * Dieselbe Anfrage, aber mit Pflicht zur Rückfrage beim Server.
 *
 * `fetch` geht normalerweise durch den HTTP-Cache des Browsers. Liefert ein
 * Server keine Cache-Angaben, schätzt der Browser die Haltbarkeit selbst und
 * gibt eine Datei aus, ohne nachzufragen: dann wäre "Netz zuerst" nur noch
 * dem Namen nach wahr. `no-cache` heisst nicht "nicht zwischenspeichern",
 * sondern "immer nachfragen" und kostet bei unveränderten Dateien nur ein
 * 304 ohne Inhalt.
 */
function revalidating(request) {
  // Aus einer Navigationsanfrage lässt sich keine neue Request bauen, die
  // geht darum über die Adresse.
  if (request.mode === 'navigate') {
    return new Request(request.url, { cache: 'no-cache', credentials: 'same-origin' })
  }
  return new Request(request, { cache: 'no-cache' })
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const bell = setTimeout(() => reject(new Error('Zeit abgelaufen')), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(bell))
  })
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data) return

  // Die Seite hat auf den Knopf "Neu laden" gedrückt: ab sofort gilt diese
  // Fassung, ohne dass alle Tabs zugehen müssen.
  if (data.type === 'skip-waiting') self.skipWaiting()

  // Die Seite kennt die Liste der Illustrationen, der Worker nicht. Sie
  // schickt sie nach dem Start herüber, damit die App auch die Bilder der
  // Übungen hat, die noch nie drankamen.
  if (data.type === 'warm' && Array.isArray(data.urls)) {
    event.waitUntil(warm(data.urls))
  }
})

/** Nachladen, was noch fehlt. Was schon da ist, bleibt wie es ist. */
async function warm(urls) {
  const cache = await caches.open(CACHE)
  for (const url of urls) {
    if (await cache.match(url)) continue
    try {
      const response = await fetch(url)
      if (response.ok) await cache.put(url, response)
    } catch { /* kein Netz, dann eben beim nächsten Start */ }
  }
}
