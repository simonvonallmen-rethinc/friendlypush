// Frontale Strichfigur, animierbar.
//
// Geometrie 1:1 aus Figma, Frame "Front" (358x426, node 25:8472). Dort ist die
// Figur schon zerlegt: arm-right, arm-left, upper-body, lower-body, leg-left,
// leg-right, face-frontal. Genau diese Teile sind hier ein Skelett. Gelenke,
// Strichstärken, Farben und die festen Pfade (Hand, Fuss, Rumpf, Gesicht)
// stammen unverändert aus dem Asset.
//
// Eine Pose ist ein flaches Objekt aus Zahlen. Winkel sind Grad-Deltas gegen
// die Ruhelage, positiv im Uhrzeigersinn (SVG, y zeigt nach unten). Längen
// sind Faktoren, 1 ist die Ruhelage; kleiner als 1 verkürzt den Knochen und
// liest sich frontal als "zeigt zur Kamera". Pose {} ergibt exakt das Asset.
//
// Winkel sind relativ zum Elternglied: shoulderR dreht den ganzen Arm,
// elbowR zusätzlich den Unterarm, wristR zusätzlich die Hand.

// Dieselben zwei Farben wie in jeder illustration.svg: die Platte trägt,
// die Figur liegt darauf. Sie stehen hell wie dunkel gleich.
export const INK = '#FBF8F4'
export const SURFACE = '#2F6F5E'

const W = 5.7861        // Strichstärke Gliedmassen
const W_HAT = 5.91957   // Strichstärke Mütze
const R = 6.71621       // Radius Gelenkpunkt

/** Gelenkpunkte der Ruhelage, direkt aus dem Asset. */
export const JOINTS = {
  neck: [179.217, 183.6],
  pelvis: [178.82, 265.008],
  shoulderR: [153.525, 185.82],
  elbowR: [134.54, 204.09],
  wristR: [124.788, 236.657],
  shoulderL: [204.908, 185.82],
  elbowL: [223.892, 204.09],
  wristL: [233.646, 236.657],
  hipR: [159.927, 265.008],
  kneeR: [155.556, 305.133],
  ankleR: [156.955, 341.731],
  hipL: [197.716, 265.008],
  kneeL: [202.087, 305.133],
  ankleL: [200.688, 341.731],
}

const CARD = 'M0 32C0 14.3269 14.3269 0 32 0H326C343.673 0 358 14.3269 358 32V394C358 411.673 343.673 426 326 426H32C14.3269 426 0 411.673 0 394V32Z'

const UPPER_BODY = 'M155.384 183.584C155.487 182.602 156.315 181.856 157.302 181.856H201.76C202.76 181.856 203.594 182.621 203.681 183.618L209.03 245.19C209.13 246.341 208.204 247.321 207.05 247.285L150.959 245.563C149.838 245.529 148.983 244.549 149.1 243.434L155.384 183.584Z'
const LOWER_BODY = 'M160.843 263.906H197.455C198.498 263.906 199.352 263.076 199.382 262.034L199.942 242.777C199.974 241.69 199.102 240.792 198.014 240.792H159.11C157.977 240.792 157.088 241.765 157.189 242.894L158.922 262.15C159.012 263.145 159.845 263.906 160.843 263.906Z'

const HAND_R = [
  'M134.602 241.88L123.588 235.658',
  'M128.264 259.628L125.682 240.568',
  'M120.304 259.688L122.767 240.879',
  'M112.963 255.869L122.324 237.279',
  'M110.04 245.097L122.495 236.723',
]
const HAND_L = [
  'M223.831 241.88L234.845 235.658',
  'M230.169 259.628L232.751 240.568',
  'M238.129 259.688L235.666 240.879',
  'M245.47 255.869L236.109 237.279',
  'M248.393 245.097L235.938 236.723',
]
const FOOT_R = 'M142 345.584L156.955 341.731'
const FOOT_L = 'M215.643 345.584L200.688 341.731'

/** face-frontal inklusive Mütze, Pfade unverändert aus dem Asset. */
const FACE = `
<circle cx="179.204" cy="149.539" r="40.8092" fill="${SURFACE}" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>
<path d="M194.06 147.184C197.941 147.184 201.088 143.913 201.088 139.879C201.088 135.844 197.941 132.573 194.06 132.573C190.178 132.573 187.032 135.844 187.032 139.879C187.032 143.913 190.178 147.184 194.06 147.184Z" fill="${INK}"/>
<path d="M164.319 147.184C168.2 147.184 171.347 143.913 171.347 139.879C171.347 135.844 168.2 132.573 164.319 132.573C160.438 132.573 157.291 135.844 157.291 139.879C157.291 143.913 160.438 147.184 164.319 147.184Z" fill="${INK}"/>
<path d="M164.319 141.453C165.135 141.453 165.797 140.748 165.797 139.878C165.797 139.009 165.135 138.304 164.319 138.304C163.503 138.304 162.841 139.009 162.841 139.878C162.841 140.748 163.503 141.453 164.319 141.453Z" fill="${SURFACE}"/>
<path d="M194.06 141.453C194.876 141.453 195.538 140.748 195.538 139.878C195.538 139.009 194.876 138.304 194.06 138.304C193.243 138.304 192.582 139.009 192.582 139.878C192.582 140.748 193.243 141.453 194.06 141.453Z" fill="${SURFACE}"/>
<path d="M196.318 161.239C192.944 165.078 187.282 167.66 180.059 167.66C172.836 167.66 167.174 165.078 163.8 161.239" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}" fill="none"/>
<path d="M178.655 141.481L179.896 147.678C181.304 148.446 184.118 150.718 184.118 153.666C184.118 156.614 181.304 157.044 179.896 156.89" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}" fill="none"/>
<path d="M173.308 112.145C162.863 114.024 152.864 120.393 146.66 125.069C144.043 127.042 140.044 125.341 140.108 122.064C140.525 100.557 148.358 83.4935 167.858 81.2343C187.557 78.9522 206.666 93.6078 212.643 113.463C213.528 116.401 210.444 118.777 207.576 117.685C199.308 114.538 184.808 110.075 173.308 112.145Z" fill="${SURFACE}" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M215.932 114.741L217.185 124.024C217.573 126.898 214.761 129.211 211.985 128.372C202.884 125.621 185.448 121.201 173.308 123.385C162.121 125.397 150.154 132.275 143.212 136.794C140.625 138.477 137.019 136.775 136.83 133.695L136.141 122.446C136.06 121.116 136.667 119.842 137.787 119.118C142.897 115.815 158.313 106.642 174.57 104.785C190.933 102.916 208.149 109.451 213.764 111.839C214.959 112.347 215.758 113.454 215.932 114.741Z" fill="${SURFACE}" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M204.896 108.729L204.896 125.793" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M191.617 106.589L191.617 123.652" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M177.024 105.62L177.024 122.684" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M162.572 108.729L162.572 125.793" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>
<path d="M147.451 115.12L147.451 132.184" stroke-width="${W_HAT}" stroke-linecap="round" stroke-linejoin="round" stroke="${INK}"/>`

// ------------------------------------------------------------------ Pose

/** Alle Pose-Schlüssel mit ihrer Ruhelage. Winkel in Grad, Längen als Faktor. */
export const POSE_KEYS = {
  bodyX: 0, bodyY: 0, bodyRot: 0, torso: 0, head: 0, headX: 0, headY: 0,
  shoulderR: 0, elbowR: 0, wristR: 0,
  shoulderL: 0, elbowL: 0, wristL: 0,
  hipR: 0, kneeR: 0, ankleR: 0,
  hipL: 0, kneeL: 0, ankleL: 0,
  upperArmR: 1, foreArmR: 1, upperArmL: 1, foreArmL: 1,
  thighR: 1, shinR: 1, thighL: 1, shinL: 1,
}

export const REST = { ...POSE_KEYS }

/** Fehlende Schlüssel auffüllen, damit der Löser nur mit Zahlen rechnet. */
export function fullPose(pose) {
  const out = { ...POSE_KEYS }
  for (const k in pose) if (k in out && Number.isFinite(pose[k])) out[k] = pose[k]
  return out
}

/** Zwei Posen mischen, t von 0 bis 1. */
export function mixPose(a, b, t) {
  const x = fullPose(a)
  const y = fullPose(b)
  const out = {}
  for (const k in POSE_KEYS) out[k] = x[k] + (y[k] - x[k]) * t
  return out
}

// ------------------------------------------------------------- Kinematik

const RAD = Math.PI / 180
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const dir = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD
const step = (p, deg, l) => [p[0] + Math.cos(deg * RAD) * l, p[1] + Math.sin(deg * RAD) * l]

function around(p, pivot, deg) {
  if (!deg) return [p[0], p[1]]
  const s = Math.sin(deg * RAD)
  const c = Math.cos(deg * RAD)
  const x = p[0] - pivot[0]
  const y = p[1] - pivot[1]
  return [pivot[0] + x * c - y * s, pivot[1] + x * s + y * c]
}

/** Knochenlängen und Ruhewinkel einmalig aus den Gelenkpunkten. */
const BONE = {
  upperArmR: { l: len(JOINTS.shoulderR, JOINTS.elbowR), a: dir(JOINTS.shoulderR, JOINTS.elbowR) },
  foreArmR: { l: len(JOINTS.elbowR, JOINTS.wristR), a: dir(JOINTS.elbowR, JOINTS.wristR) },
  upperArmL: { l: len(JOINTS.shoulderL, JOINTS.elbowL), a: dir(JOINTS.shoulderL, JOINTS.elbowL) },
  foreArmL: { l: len(JOINTS.elbowL, JOINTS.wristL), a: dir(JOINTS.elbowL, JOINTS.wristL) },
  thighR: { l: len(JOINTS.hipR, JOINTS.kneeR), a: dir(JOINTS.hipR, JOINTS.kneeR) },
  shinR: { l: len(JOINTS.kneeR, JOINTS.ankleR), a: dir(JOINTS.kneeR, JOINTS.ankleR) },
  thighL: { l: len(JOINTS.hipL, JOINTS.kneeL), a: dir(JOINTS.hipL, JOINTS.kneeL) },
  shinL: { l: len(JOINTS.kneeL, JOINTS.ankleL), a: dir(JOINTS.kneeL, JOINTS.ankleL) },
}

/**
 * Pose zu Geometrie. Liefert Gelenkpunkte und die Transformationen der
 * starren Teile (Hand, Fuss, Rumpf, Kopf).
 */
export function solve(input) {
  const p = fullPose(input)
  const off = [p.bodyX, p.bodyY]
  const pel = JOINTS.pelvis
  const place = (point, rot) => {
    const q = around(point, pel, rot)
    return [q[0] + off[0], q[1] + off[1]]
  }
  const torsoRot = p.bodyRot + p.torso
  const headRot = torsoRot + p.head

  const shoulderR = place(JOINTS.shoulderR, torsoRot)
  const shoulderL = place(JOINTS.shoulderL, torsoRot)
  const neck = place(JOINTS.neck, torsoRot)
  const hipR = place(JOINTS.hipR, p.bodyRot)
  const hipL = place(JOINTS.hipL, p.bodyRot)

  const armRot = { R: torsoRot + p.shoulderR, L: torsoRot + p.shoulderL }
  const elbowR = step(shoulderR, BONE.upperArmR.a + armRot.R, BONE.upperArmR.l * p.upperArmR)
  const elbowL = step(shoulderL, BONE.upperArmL.a + armRot.L, BONE.upperArmL.l * p.upperArmL)
  const foreRot = { R: armRot.R + p.elbowR, L: armRot.L + p.elbowL }
  const wristR = step(elbowR, BONE.foreArmR.a + foreRot.R, BONE.foreArmR.l * p.foreArmR)
  const wristL = step(elbowL, BONE.foreArmL.a + foreRot.L, BONE.foreArmL.l * p.foreArmL)

  const legRot = { R: p.bodyRot + p.hipR, L: p.bodyRot + p.hipL }
  const kneeR = step(hipR, BONE.thighR.a + legRot.R, BONE.thighR.l * p.thighR)
  const kneeL = step(hipL, BONE.thighL.a + legRot.L, BONE.thighL.l * p.thighL)
  const shinRot = { R: legRot.R + p.kneeR, L: legRot.L + p.kneeL }
  const ankleR = step(kneeR, BONE.shinR.a + shinRot.R, BONE.shinR.l * p.shinR)
  const ankleL = step(kneeL, BONE.shinL.a + shinRot.L, BONE.shinL.l * p.shinL)

  // Starre Teile: Ruhepfad an den neuen Ankerpunkt setzen und mitdrehen.
  const rigid = (anchorRest, anchorNow, rot) =>
    `translate(${r(anchorNow[0])} ${r(anchorNow[1])}) rotate(${r(rot)}) translate(${r(-anchorRest[0])} ${r(-anchorRest[1])})`

  return {
    pose: p,
    shoulderR, elbowR, wristR, shoulderL, elbowL, wristL,
    hipR, kneeR, ankleR, hipL, kneeL, ankleL, neck,
    pelvis: [pel[0] + off[0], pel[1] + off[1]],
    tf: {
      handR: rigid(JOINTS.wristR, wristR, foreRot.R + p.wristR),
      handL: rigid(JOINTS.wristL, wristL, foreRot.L + p.wristL),
      footR: rigid(JOINTS.ankleR, ankleR, shinRot.R + p.ankleR),
      footL: rigid(JOINTS.ankleL, ankleL, shinRot.L + p.ankleL),
      upper: rigid(pel, [pel[0] + off[0], pel[1] + off[1]], torsoRot),
      lower: rigid(pel, [pel[0] + off[0], pel[1] + off[1]], p.bodyRot),
      head: rigid(JOINTS.neck, [neck[0] + p.headX, neck[1] + p.headY], headRot),
    },
  }
}

const r = (n) => Math.round(n * 1000) / 1000
const seg = (a, b) => `M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`

// ------------------------------------------------------------- Rendering

const stroke = (w = W) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"`

/**
 * SVG-Markup der Figur in einer Pose. Reine Funktion, läuft auch in Node.
 * @param {Object} pose
 * @param {{card?: boolean, width?: number|string, height?: number|string, title?: string}} opts
 */
export function frontFigure(pose = {}, opts = {}) {
  const { card = true, width = '100%', height = '100%', title } = opts
  const s = solve(pose)
  const t = s.tf
  const hand = (paths, tf, key) =>
    `<g data-k="${key}" transform="${tf}">${paths.map((d) => `<path d="${d}" ${stroke()}/>`).join('')}</g>`

  return `<svg viewBox="0 0 358 426" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img"${title ? ` aria-label="${title}"` : ' aria-hidden="true"'}>
${card ? `<path d="${CARD}" fill="${SURFACE}"/>` : ''}
<g data-k="armR"><path data-k="armR-upper" d="${seg(s.shoulderR, s.elbowR)}" ${stroke()}/><path data-k="armR-fore" d="${seg(s.elbowR, s.wristR)}" ${stroke()}/><circle data-k="armR-elbow" cx="${r(s.elbowR[0])}" cy="${r(s.elbowR[1])}" r="${R}" fill="${INK}"/>${hand(HAND_R, t.handR, 'armR-hand')}</g>
<g data-k="armL"><path data-k="armL-upper" d="${seg(s.shoulderL, s.elbowL)}" ${stroke()}/><path data-k="armL-fore" d="${seg(s.elbowL, s.wristL)}" ${stroke()}/><circle data-k="armL-elbow" cx="${r(s.elbowL[0])}" cy="${r(s.elbowL[1])}" r="${R}" fill="${INK}"/>${hand(HAND_L, t.handL, 'armL-hand')}</g>
<path data-k="lower" transform="${t.lower}" d="${LOWER_BODY}" ${stroke()}/>
<path data-k="upper" transform="${t.upper}" d="${UPPER_BODY}" fill="${SURFACE}" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>
<g data-k="legR"><path data-k="legR-thigh" d="${seg(s.hipR, s.kneeR)}" ${stroke()}/><path data-k="legR-shin" d="${seg(s.kneeR, s.ankleR)}" ${stroke()}/><circle data-k="legR-hip" cx="${r(s.hipR[0])}" cy="${r(s.hipR[1])}" r="${R}" fill="${INK}"/><circle data-k="legR-knee" cx="${r(s.kneeR[0])}" cy="${r(s.kneeR[1])}" r="${R}" fill="${INK}"/><path data-k="legR-foot" transform="${t.footR}" d="${FOOT_R}" ${stroke()}/></g>
<g data-k="legL"><path data-k="legL-thigh" d="${seg(s.hipL, s.kneeL)}" ${stroke()}/><path data-k="legL-shin" d="${seg(s.kneeL, s.ankleL)}" ${stroke()}/><circle data-k="legL-hip" cx="${r(s.hipL[0])}" cy="${r(s.hipL[1])}" r="${R}" fill="${INK}"/><circle data-k="legL-knee" cx="${r(s.kneeL[0])}" cy="${r(s.kneeL[1])}" r="${R}" fill="${INK}"/><path data-k="legL-foot" transform="${t.footL}" d="${FOOT_L}" ${stroke()}/></g>
<g data-k="head" transform="${t.head}">${FACE}</g>
</svg>`
}

/**
 * Figur als DOM-Knoten, Pose nachträglich änderbar. Pro Bild werden nur
 * Attribute gesetzt, nichts neu geparst.
 */
export function createFrontFigure(opts = {}) {
  const host = document.createElement('div')
  host.innerHTML = frontFigure({}, opts)
  const el = host.firstElementChild
  const q = (k) => el.querySelector(`[data-k="${k}"]`)
  const ref = {
    armRu: q('armR-upper'), armRf: q('armR-fore'), armRe: q('armR-elbow'), armRh: q('armR-hand'),
    armLu: q('armL-upper'), armLf: q('armL-fore'), armLe: q('armL-elbow'), armLh: q('armL-hand'),
    legRt: q('legR-thigh'), legRs: q('legR-shin'), legRh: q('legR-hip'), legRk: q('legR-knee'), legRf: q('legR-foot'),
    legLt: q('legL-thigh'), legLs: q('legL-shin'), legLh: q('legL-hip'), legLk: q('legL-knee'), legLf: q('legL-foot'),
    upper: q('upper'), lower: q('lower'), head: q('head'),
  }
  const dot = (node, p) => { node.setAttribute('cx', r(p[0])); node.setAttribute('cy', r(p[1])) }

  function setPose(pose) {
    const s = solve(pose)
    ref.armRu.setAttribute('d', seg(s.shoulderR, s.elbowR))
    ref.armRf.setAttribute('d', seg(s.elbowR, s.wristR))
    dot(ref.armRe, s.elbowR)
    ref.armRh.setAttribute('transform', s.tf.handR)
    ref.armLu.setAttribute('d', seg(s.shoulderL, s.elbowL))
    ref.armLf.setAttribute('d', seg(s.elbowL, s.wristL))
    dot(ref.armLe, s.elbowL)
    ref.armLh.setAttribute('transform', s.tf.handL)
    ref.legRt.setAttribute('d', seg(s.hipR, s.kneeR))
    ref.legRs.setAttribute('d', seg(s.kneeR, s.ankleR))
    dot(ref.legRh, s.hipR); dot(ref.legRk, s.kneeR)
    ref.legRf.setAttribute('transform', s.tf.footR)
    ref.legLt.setAttribute('d', seg(s.hipL, s.kneeL))
    ref.legLs.setAttribute('d', seg(s.kneeL, s.ankleL))
    dot(ref.legLh, s.hipL); dot(ref.legLk, s.kneeL)
    ref.legLf.setAttribute('transform', s.tf.footL)
    ref.upper.setAttribute('transform', s.tf.upper)
    ref.lower.setAttribute('transform', s.tf.lower)
    ref.head.setAttribute('transform', s.tf.head)
    return s
  }

  return { el, setPose }
}
