// Entwurf einer illustration.svg aus zwei Posen.
//
//   node dev/illu-entwurf.mjs            alle Entwürfe schreiben
//   node dev/illu-entwurf.mjs <id> ...   nur diese
//
// Die Illustrationen der App werden in Figma gezeichnet. Für eine neue Übung
// steht dort aber noch nichts, und ein leeres Bildfeld sagt weniger als eine
// grobe Figur. Dieses Skript setzt darum aus zwei Posen der frontalen Figur
// (lib/figure-front.js) eine Karte im selben Aufbau zusammen: Platte, Pose
// oben, Pose unten, dazwischen die Lücke.
//
// Entwurf heisst Entwurf. Die Figur steht frontal, die gezeichneten Vorlagen
// stehen meist von der Seite; sobald die Zeichnung aus Figma da ist, ersetzt
// sie die Datei und dieses Skript hat mit ihr nichts mehr zu tun. Es läuft
// nicht im Build mit und überschreibt nur, was hier als Pose steht.

import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { frontFigure, INK, SURFACE } from '../lib/figure-front.js'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const W = 358
const H = 426
const HALF = H / 2

/**
 * Die zwei Posen je Übung. Winkel sind Grad gegen die Ruhelage, positiv im
 * Uhrzeigersinn. Längen unter 1 verkürzen den Knochen und lesen sich frontal
 * als "zeigt zur Kamera" (siehe lib/figure-front.js).
 */
// Die Ruhelage hat den Arm schon leicht gebeugt: Oberarm und Unterarm
// stehen rund 28 Grad auseinander. Wer den Arm gerade haben will, muss das
// am Ellbogen ausgleichen, sonst knickt er beim Heben ab.
const STRAIGHT_R = 28
const STRAIGHT_L = -28

const DRAFTS = {
  // Arme schräg nach oben ins Y, dann seitlich ins T. Die Hüftbeuge der
  // Ansage fehlt mit Absicht: die Figur steht frontal, eine Beuge nach vorn
  // wäre von hier nicht zu sehen, ein seitliches Kippen wäre falsch.
  'pull-stehend-yt': {
    a: { shoulderR: 88, elbowR: STRAIGHT_R, shoulderL: -88, elbowL: STRAIGHT_L },
    b: { shoulderR: 45, elbowR: STRAIGHT_R, shoulderL: -45, elbowL: STRAIGHT_L },
  },

  // Arme lang, dann die Ellbogen nach hinten. Frontal zeigt der Unterarm
  // dabei zur Kamera: er wird kurz, und die Hand landet an den Rippen.
  'pull-stehendes-rudern': {
    a: { shoulderR: -45, elbowR: STRAIGHT_R, shoulderL: 45, elbowL: STRAIGHT_L },
    b: {
      shoulderR: -15, elbowR: -105, foreArmR: 0.55,
      shoulderL: 15, elbowL: 105, foreArmL: 0.55,
    },
  },

  // W an der Wand, dann die Arme lang nach oben ins Y.
  'scapula-wandengel': {
    a: { shoulderR: 38, elbowR: 95, shoulderL: -38, elbowL: -95 },
    b: { shoulderR: 85, elbowR: STRAIGHT_R, shoulderL: -85, elbowL: STRAIGHT_L },
  },

  // Standbein rechts. Das Becken sinkt auf der freien Seite ab und wird
  // wieder angehoben; das Standbein dreht gegen, damit es senkrecht bleibt.
  // Diese Bewegung liegt in der Frontalebene und ist darum die einzige der
  // vier, die frontal überhaupt zu sehen ist.
  'glutes-beckenheben-stand': {
    a: {
      bodyRot: 9, hipR: -9,
      hipL: -6, kneeL: 10, shinL: 0.82,
      shoulderR: 20, shoulderL: -20,
    },
    b: {
      bodyRot: -9, hipR: 9,
      hipL: -4, kneeL: 26, thighL: 0.9, shinL: 0.62,
      shoulderR: 20, shoulderL: -20,
    },
  },
}

// Mass und Sitz der Figur in einer Hälfte. Die Werte kommen aus der Ruhelage:
// Mützenrand bei y 78, Fusssohle bei y 352, Mitte bei x 179.
const S = 0.62
const TOP_Y = 78
const FOOT_Y = 352
const MID_X = 179
const PAD = 14

const n = (v) => Math.round(v * 100) / 100

/** Oberkante der Figur in einer Hälfte, die bei `top` anfängt. */
const originY = (top) => top + PAD - TOP_Y * S
const originX = MID_X - MID_X * S

/** Die Figur sitzt in einer Hälfte der Karte, mittig und auf ein Mass, das
    die Hälfte füllt wie in den gezeichneten Vorlagen. */
function half(pose, top) {
  const body = frontFigure(pose, { card: false })
    .replace(/^<svg[^>]*>\n?/, '')
    .replace(/<\/svg>$/, '')
    .trim()
  return `<g transform="translate(${n(originX)} ${n(originY(top))}) scale(${S})">\n${body}\n</g>`
}

/** Boden auf Höhe der Fusssohle, so leise wie in den gezeichneten Vorlagen. */
function ground(top) {
  const y = n(originY(top) + FOOT_Y * S)
  return `<path opacity="0.2" d="M75 ${y}H283" stroke="${INK}" stroke-width="3.683" stroke-linecap="round"/>`
}

const CARD = 'M0 32C0 14.3269 14.3269 0 32 0H326C343.673 0 358 14.3269 358 32V394'
  + 'C358 411.673 343.673 426 326 426H32C14.3269 426 0 411.673 0 394V32Z'

function card({ a, b }) {
  return [
    `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    `<path d="${CARD}" fill="${SURFACE}"/>`,
    ground(0),
    half(a, 0),
    ground(HALF),
    half(b, HALF),
    // Dieselbe Lücke wie in den gezeichneten Karten: die Linie darüber zieht
    // der Container, hier steht nur die Plattenfarbe.
    `<rect x="14" y="211" width="330" height="4" rx="2" fill="${SURFACE}"/>`,
    `<rect y="210.766" width="${W}" height="4" fill="${SURFACE}"/>`,
    '</svg>',
  ].join('\n') + '\n'
}

const wanted = process.argv.slice(2)
const ids = wanted.length ? wanted : Object.keys(DRAFTS)

for (const id of ids) {
  const draft = DRAFTS[id]
  if (!draft) {
    console.error(`keine Pose für ${id}`)
    process.exitCode = 1
    continue
  }
  const to = join(ROOT, 'uebungen', id, 'illustration.svg')
  await writeFile(to, card(draft))
  console.log(`entworfen ${id}/illustration.svg`)
}
