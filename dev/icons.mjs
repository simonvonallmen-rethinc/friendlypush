// Icons rastern.
//
// Quelle ist assets/icon.svg, Ergebnis sind die PNGs daneben, die das Manifest
// und iOS brauchen. Gerastert wird mit dem Chrome, der ohnehin auf dem Rechner
// ist: ein Paket dafür wäre die einzige Abhängigkeit des Projekts.
//
// Die Quelle liefert nur die Zeichnung: eine Kachel und die Figur darauf. Wie
// weit die Farbe nach aussen geht, entscheidet die Fassung, nicht die Datei.
// Zwei Quellen für dasselbe Bild heisst, dass eine davon irgendwann veraltet.
//
//   node dev/icons.mjs
//   CHROME=/Pfad/zu/chrome node dev/icons.mjs

import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const CHROME = process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const SOURCE = 'assets/icon.svg'
const MANIFEST = 'manifest.webmanifest'

// `bleed` heisst: Markenfarbe bis an den Rand, ohne eigene runde Ecke. Das ist
// die Fassung für alles, was das System selbst in eine Form stanzt. Liegt die
// runde Ecke schon im Bild, stanzt iOS ein zweites Mal darüber und legt seit
// iOS 26 den Glanz auf die Kante: das sieht aus wie eine erhabene Platte.
// Ohne `bleed` bleibt die Kachel als Kachel sichtbar, für Tab, Manifest und
// Link-Vorschau, wo niemand etwas wegschneidet.
const JOBS = [
  { to: 'assets/icon-192.png',          size: 192 },
  { to: 'assets/icon-512.png',          size: 512 },
  { to: 'assets/apple-touch-icon.png',  size: 180, bleed: true },
  { to: 'assets/icon-maskable-512.png', size: 512, bleed: true, inset: 0.8 },
]

/** Kachel, Figur und die beiden Farben, aus Quelle und Manifest. */
async function parts() {
  const svg = await readFile(join(ROOT, SOURCE), 'utf8')
  const d = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1])
  if (d.length !== 2) {
    throw new Error(`${SOURCE} braucht zwei Pfade (Kachel, Figur), gefunden: ${d.length}`)
  }
  const fills = [...svg.matchAll(/fill="(#[0-9a-fA-F]{3,8})"/g)].map(m => m[1])
  const manifest = JSON.parse(await readFile(join(ROOT, MANIFEST), 'utf8'))
  return {
    tile: d[0], glyph: d[1],
    brand: fills[0],
    // Die helle Farbe steht im Manifest, damit Icon und Startbildschirm der
    // App nicht auseinanderlaufen.
    paper: manifest.background_color,
  }
}

/**
 * Dieselbe Zeichnung für einen Ausschnitt, dessen Form das System bestimmt.
 *
 * Android stanzt aus einem maskable-Icon einen Kreis, ein Quadrat mit runden
 * Ecken oder sonst etwas. Sicher ist nur die mittlere Fläche von 80 Prozent,
 * darum schrumpft `inset` die Figur um die Mitte. Der Hintergrund bleibt
 * randlos: was das System wegschneidet, ist dann nur Farbe.
 */
function compose({ tile, glyph, brand, paper }, { bleed, inset = 1 }) {
  const ground = bleed
    ? `<rect width="512" height="512" fill="${brand}"/>`
    : `<rect width="512" height="512" fill="${paper}"/><path fill="${brand}" d="${tile}"/>`
  const figure = `<path fill="${paper}" d="${glyph}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
${ground}
${inset === 1 ? figure
    : `<g transform="translate(256 256) scale(${inset}) translate(-256 -256)">${figure}</g>`}
</svg>`
}

const drawing = await parts()
const work = await mkdtemp(join(tmpdir(), 'fp-icons-'))
try {
  for (const job of JOBS) {
    const svg = compose(drawing, job)
    // Die SVG steht in einer Seite ohne Rand, sonst schnitte der Screenshot
    // den Hintergrund an.
    const page = join(work, 'page.html')
    await writeFile(page, `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0}body>svg{display:block;width:${job.size}px;height:${job.size}px}</style>
${svg}`)
    await run(CHROME, [
      '--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
      `--user-data-dir=${join(work, 'profile')}`,
      `--window-size=${job.size},${job.size}`,
      '--default-background-color=00000000',
      `--screenshot=${join(ROOT, job.to)}`,
      `file://${page}`,
    ])
    const form = [job.bleed && 'randlos', job.inset && `Figur ${job.inset}`].filter(Boolean)
    console.log(`${job.to}  ${job.size}x${job.size}${form.length ? '  ' + form.join(', ') : ''}`)
  }
} finally {
  await rm(work, { recursive: true, force: true })
}
