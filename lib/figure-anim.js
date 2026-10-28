// Abspielen von Posen-Keyframes auf einer Figur.
//
// Eine Animation ist eine Liste von Keyframes mit `t` von 0 bis 1 und den
// Pose-Werten aus lib/figure-front.js. Zwischen zwei Keyframes wird jeder
// Wert linear gemischt, die Zeit dazwischen wird geglättet. Mehr braucht es
// nicht: die Bewegungen sind kurz und zyklisch.
//
//   mode 'pingpong'  hin und zurück, für Übungen mit einer Bewegung
//   mode 'loop'      im Kreis, letzter Keyframe geht zurück zum ersten

import { mixPose, fullPose } from './figure-front.js'

const EASE = {
  linear: (t) => t,
  inout: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  out: (t) => Math.sin((Math.PI / 2) * t),
  in: (t) => 1 - Math.cos((Math.PI / 2) * t),
}

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

/** Pose zu einem Zeitpunkt t (0 bis 1) der Animation. */
export function sampleAnimation(anim, t) {
  const keys = anim.keys ?? []
  if (!keys.length) return fullPose({})
  if (keys.length === 1) return fullPose(keys[0])

  const ease = EASE[anim.ease ?? 'inout'] ?? EASE.inout
  let u = clamp01(t)
  if (anim.mode === 'pingpong') u = u < 0.5 ? u * 2 : (1 - u) * 2

  const list = anim.mode === 'loop' ? [...keys, { ...keys[0], t: 1 }] : keys
  let i = 0
  while (i < list.length - 2 && u > list[i + 1].t) i++
  const a = list[i]
  const b = list[i + 1]
  const span = b.t - a.t
  const local = span <= 0 ? 0 : clamp01((u - a.t) / span)
  return mixPose(a, b, ease(local))
}

/**
 * Animation auf einer Figur abspielen.
 * @param {{setPose: Function}} fig aus createFrontFigure()
 * @param {Object} anim
 * @param {{speed?: number, playing?: boolean, onTime?: Function}} opts
 */
export function playAnimation(fig, anim, opts = {}) {
  let speed = opts.speed ?? 1
  let playing = opts.playing ?? true
  let time = 0
  let last = 0
  let raf = 0
  let current = anim

  const draw = () => {
    fig.setPose(sampleAnimation(current, time))
    opts.onTime?.(time)
  }

  const tick = (now) => {
    raf = requestAnimationFrame(tick)
    if (!last) last = now
    const dt = Math.min(now - last, 100)
    last = now
    if (!playing) return
    const dur = current.duration ?? 3000
    time = (time + (dt / dur) * speed) % 1
    draw()
  }
  raf = requestAnimationFrame(tick)
  draw()

  return {
    get time() { return time },
    get playing() { return playing },
    play() { playing = true; last = 0 },
    pause() { playing = false },
    toggle() { playing = !playing; last = 0; return playing },
    seek(t) { time = clamp01(t); draw() },
    setSpeed(v) { speed = v },
    setAnimation(next) { current = next; time = 0; draw() },
    stop() { cancelAnimationFrame(raf) },
  }
}
