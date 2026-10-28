// Icons rastern.
//
// Quelle ist assets/icon.svg, Ergebnis sind die PNGs daneben, die das Manifest
// und iOS brauchen. Gerastert wird mit dem Chrome, der ohnehin auf dem Rechner
// ist: ein Paket dafür wäre die einzige Abhängigkeit des Projekts.
//
// Die maskable-Fassung wird aus derselben Datei gerechnet, nicht daneben
// gepflegt. Zwei Quellen für dasselbe Bild heisst, dass eine davon irgendwann
// veraltet.
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

const JOBS = [
  { to: 'assets/icon-192.png',         size: 192 },
  { to: 'assets/icon-512.png',         size: 512 },
  { to: 'assets/apple-touch-icon.png', size: 180 },
  { to: 'assets/icon-maskable-512.png', size: 512, maskable: true },
]

/**
 * Dieselbe Zeichnung für einen Ausschnitt, dessen Form das System bestimmt.
 *
 * Android stanzt aus einem maskable-Icon einen Kreis, ein Quadrat mit runden
 * Ecken oder sonst etwas. Sicher ist nur die mittlere Fläche von 80 Prozent.
 * Darum: Hintergrund randlos, Zeichnung auf 0.76 um die Mitte geschrumpft. Die
 * Farbe kommt aus der Datei selbst, damit ein Umfärben beide Fassungen trifft.
 */
function maskable(svg) {
  const bg = svg.match(/fill="(#[0-9a-fA-F]{3,8})"/)?.[1] ?? '#2f6f5e'
  // Die Quelle wird verschachtelt, nicht aufgeschnitten: ihre Wurzel trägt
  // `fill="none"`, und ohne das würde jeder gestrichene Bogen zur gefüllten
  // Fläche. Verschachtelte SVG kann SVG, die Verweise auf defs halten.
  // Der Rahmen der Quelle schrumpft mit: so steht genau das gezeichnete Bild
  // da, nur kleiner und mit Hintergrund ringsum. Was darüber hinausragt,
  // schneidet die Quelle selbst ab, wie sie es immer tut.
  const nested = svg.replace(/^[\s\S]*?(?=<svg)/, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="${bg}"/>
<g transform="translate(256 256) scale(0.76) translate(-256 -256)">${nested}</g>
</svg>`
}

const work = await mkdtemp(join(tmpdir(), 'fp-icons-'))
try {
  const source = await readFile(join(ROOT, SOURCE), 'utf8')

  for (const job of JOBS) {
    const svg = job.maskable ? maskable(source) : source
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
    console.log(`${job.to}  ${job.size}x${job.size}${job.maskable ? '  maskable' : ''}`)
  }
} finally {
  await rm(work, { recursive: true, force: true })
}
