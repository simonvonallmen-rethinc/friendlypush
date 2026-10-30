// uebungen/ -> data/exercises.js
//
//   node dev/build.mjs
//
// Quelle der Wahrheit ist uebungen/<id>/uebung.md, daneben liegt die von Hand
// gezeichnete uebungen/<id>/illustration.svg. data/exercises.js ist nur das
// Ergebnis und wird von der App importiert; so bleibt die App ohne Fetch und
// kommt mit statischem Hosting aus.
//
// Ordner mit Unterstrich bleiben aussen vor: uebungen/_app/ gehört der App,
// und _weg/ oder _archiv/ sind ein Versteck, ohne etwas zu löschen.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '../lib/front.js'
import { replacePool } from '../lib/source.js'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DIR = join(ROOT, 'uebungen')
const POOL = join(ROOT, 'data', 'exercises.js')
const MD = 'uebung.md'
const SVG = 'illustration.svg'

/** Einzelposen für das Daumenkino: pos-1.svg, pos-2.svg und so weiter. */
const frameFile = (n) => `pos-${n}.svg`

const FIELDS = ['name', 'slot', 'dose', 'equipment', 'position', 'difficulty']

const exists = (p) => stat(p).then(() => true, () => false)

/** Erster Absatz des Textes ist die Ansage, der Rest ist Hintergrund. */
function cueOf(body) {
  return (body.split(/\n\s*\n/)[0] ?? '').trim()
}

/**
 * Wie viele Posen im Ordner liegen. Gezählt wird nur die lückenlose Reihe ab
 * pos-1.svg: eine Lücke wäre ein Loch im Ablauf, und ein Bild, das keiner
 * sieht, meldet sich besser gar nicht erst.
 */
async function framesOf(id) {
  let n = 0
  while (await exists(join(DIR, id, frameFile(n + 1)))) n++
  return n
}

export async function readFolder(id) {
  const { data, body } = parse(await readFile(join(DIR, id, MD), 'utf8'))
  return {
    id,
    ...Object.fromEntries(FIELDS.map((k) => [k, data[k]])),
    cue: cueOf(body),
    illu: await exists(join(DIR, id, SVG)),
    frames: await framesOf(id),
  }
}

export async function readAll() {
  if (!(await exists(DIR))) return []
  const names = (await readdir(DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort()
  const out = []
  for (const name of names) {
    if (await exists(join(DIR, name, MD))) out.push(await readFolder(name))
  }
  return out
}

/** Fehlende Pflichtangaben melden, statt sie still in den Pool zu schreiben. */
function complain(list) {
  const problems = []
  const seen = new Set()
  for (const e of list) {
    for (const key of FIELDS) {
      if (e[key] === undefined || e[key] === '') problems.push(`${e.id}: ${key} fehlt`)
    }
    if (!e.cue) problems.push(`${e.id}: keine Ansage im Text`)
    if (seen.has(e.name)) problems.push(`Name doppelt: ${e.name}`)
    seen.add(e.name)
  }
  return problems
}

async function build() {
  const list = await readAll()
  if (!list.length) {
    console.log('[build] uebungen/ ist leer')
    return
  }
  for (const problem of complain(list)) console.log(`[build] ${problem}`)

  const file = await readFile(POOL, 'utf8')
  await writeFile(POOL, replacePool(file, list), 'utf8')

  const ohne = list.filter((e) => !e.illu)
  console.log(`[build] ${list.length} Übungen nach data/exercises.js`)
  if (ohne.length) {
    console.log(`[build] ohne ${SVG}: ${ohne.map((e) => e.id).join(', ')}`)
  }
}

if (process.argv[1]?.endsWith('build.mjs')) await build()
