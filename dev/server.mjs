// Lokaler Vorschau-Server.
//
// ES-Module lassen sich nicht über file:// laden, der Browser verweigert das.
// Darum braucht die Entwicklung einen Server. Mehr tut dieser nicht: Dateien
// ausliefern, nur lesend, nur aus dem Projektordner, nur auf 127.0.0.1.
//
//   node dev/server.mjs           Port 8731
//   PORT=1234 node dev/server.mjs
//
// Gepflegt werden die Übungen in uebungen/<id>/, danach: node dev/build.mjs

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const PORT = Number(process.env.PORT ?? 8731)
const HOST = '127.0.0.1'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

const send = (res, code, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(body)
}

async function serve(res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0])
  if (rel.endsWith('/')) rel += 'index.html'
  const file = resolve(ROOT, `.${rel}`)
  // Pfad muss im Projekt bleiben, sonst wäre %2e%2e ein Ausweg nach oben.
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return send(res, 403, 'Ausserhalb des Projekts')
  try {
    const info = await stat(file)
    if (info.isDirectory()) return serve(res, `${rel}/`)
    send(res, 200, await readFile(file), TYPES[extname(file)] ?? 'application/octet-stream')
  } catch {
    send(res, 404, 'Nicht gefunden')
  }
}

createServer(async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, 'Nur GET')
  try {
    await serve(res, req.url ?? '/')
  } catch (err) {
    console.error(err)
    send(res, 500, String(err?.message ?? err))
  }
}).listen(PORT, HOST, () => {
  console.log(`friendly push auf http://${HOST}:${PORT}/`)
  console.log(`Übersicht:       http://${HOST}:${PORT}/dev/uebungen.html`)
  console.log(`Figur, animiert: http://${HOST}:${PORT}/dev/figur.html`)
})
