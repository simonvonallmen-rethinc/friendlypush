// Deploy prüfen.
//
// Vergleicht jede Datei, die zur App gehört, mit dem, was auf dem Host
// wirklich liegt. Beim Hochladen von Hand geht leicht ein ganzer Ordner
// vergessen, und im Browser fällt das erst auf, wenn das Icon fehlt.
//
//   node dev/deploy-check.mjs https://friendlypush.ch
//
// Was zur App gehört, sagt git: alles ausser dev/ und den Notizen.

import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const base = (process.argv[2] ?? '').replace(/\/$/, '')

if (!base) {
  console.error('Aufruf: node dev/deploy-check.mjs https://host.tld')
  process.exit(1)
}

const SKIP = [/^dev\//, /^KONZEPT\.md$/, /\.DS_Store$/]

const { stdout } = await run('git', ['ls-files'], { cwd: ROOT })
const files = stdout.split('\n').filter(Boolean).filter((f) => !SKIP.some((re) => re.test(f)))

// Erwartete Typen. Ein Manifest als octet-stream nimmt Chrome zwar an, aber
// Safari ist strenger, und falsch ist es so oder so.
const TYPES = {
  '.html': /text\/html/,
  '.js': /javascript/,
  '.css': /text\/css/,
  '.svg': /image\/svg\+xml/,
  '.png': /image\/png/,
  '.webmanifest': /application\/manifest\+json/,
}

let fehler = 0
let warnungen = 0

for (const file of files) {
  const url = `${base}/${file}`
  let res
  try {
    res = await fetch(url, { method: 'GET', redirect: 'follow' })
  } catch (err) {
    console.log(`FEHLT   ${file}  (${err.message})`)
    fehler++
    continue
  }
  if (!res.ok) {
    console.log(`${String(res.status).padEnd(7)} ${file}`)
    fehler++
    continue
  }
  const want = TYPES[file.slice(file.lastIndexOf('.'))]
  const got = res.headers.get('content-type') ?? ''
  if (want && !want.test(got)) {
    console.log(`TYP     ${file}  →  ${got}`)
    warnungen++
  }
}

console.log(`\n${files.length} Dateien geprüft, ${fehler} fehlen, ${warnungen} mit falschem Typ.`)
process.exit(fehler ? 1 : 0)
