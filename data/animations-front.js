// Frontale Bewegungen je Übung.
//
// Keyframes mit `t` von 0 bis 1, Werte sind Pose-Schlüssel aus
// lib/figure-front.js. Was nicht dasteht, bleibt in der Ruhelage.
//
// Zur Orientierung, Winkel in Grad gegen die Ruhelage:
//   shoulderR  +44 Arm waagrecht zur Seite, +134 senkrecht nach oben
//   shoulderL  gleiche Beträge, negatives Vorzeichen
//   hipR/hipL  positiv dreht im Uhrzeigersinn, Bein nach aussen heisst
//              rechts positiv, links negativ
//   ankleR/L   gleicht Hüfte und Knie aus, damit der Fuss flach bleibt
//   upperArm*, foreArm*, thigh*, shin*  Längenfaktor. Kleiner als 1 heisst
//              frontal: das Glied zeigt zur Kamera. So entstehen Bewegungen
//              nach vorn oder hinten in einer reinen Frontalansicht.
//
// `view` sagt, aus welcher Richtung die Übung gemeint ist: 'front' steht,
// 'top' liegt (Rücken- oder Bauchlage von oben gesehen).

export const FRONT_ANIMATIONS = {
  idle: {
    id: 'idle',
    name: 'Grundhaltung',
    view: 'front',
    duration: 3800,
    mode: 'pingpong',
    keys: [
      { t: 0 },
      { t: 1, bodyY: -1.6, shoulderR: 2.4, shoulderL: -2.4, headY: -0.8 },
    ],
  },

  'scapula-stehender-schub': {
    id: 'scapula-stehender-schub',
    name: 'Stehender Schub',
    view: 'front',
    duration: 2800,
    mode: 'pingpong',
    keys: [
      // Schulterblätter zusammen: Arme bleiben vorn, kommen aber näher.
      { t: 0,
        shoulderR: 34, elbowR: 10, upperArmR: 0.38, foreArmR: 0.34,
        shoulderL: -34, elbowL: -10, upperArmL: 0.38, foreArmL: 0.34 },
      // Schulterblätter auseinander schieben: Arme strecken zur Kamera.
      { t: 1, bodyY: -1,
        shoulderR: 42, elbowR: 4, upperArmR: 0.6, foreArmR: 0.56,
        shoulderL: -42, elbowL: -4, upperArmL: 0.6, foreArmL: 0.56 },
    ],
  },

  'scapula-boden-engel': {
    id: 'scapula-boden-engel',
    name: 'Boden-Engel',
    view: 'top',
    duration: 4200,
    mode: 'pingpong',
    keys: [
      // Rechter Winkel, Handrücken am Boden.
      { t: 0,
        shoulderR: 44, elbowR: 119, wristR: -30,
        shoulderL: -44, elbowL: -119, wristL: 30 },
      // Arme über den Kopf schieben.
      { t: 1,
        shoulderR: 112, elbowR: 22, wristR: -10,
        shoulderL: -112, elbowL: -22, wristL: 10 },
    ],
  },

  'core-dead-bug': {
    id: 'core-dead-bug',
    name: 'Dead Bug',
    view: 'top',
    duration: 4000,
    mode: 'pingpong',
    keys: [
      // Rechter Arm lang über Kopf, linkes Bein lang. Gegenseite bleibt kurz,
      // zeigt also nach oben zur Kamera.
      { t: 0,
        shoulderR: 112, elbowR: 8, upperArmR: 1, foreArmR: 1,
        shoulderL: -40, elbowL: -14, upperArmL: 0.3, foreArmL: 0.28,
        hipR: 16, kneeR: -22, thighR: 0.34, shinR: 0.32, ankleR: 6,
        hipL: -8, kneeL: 6, thighL: 1, shinL: 1 },
      // Spiegelbild.
      { t: 1,
        shoulderL: -112, elbowL: -8, upperArmL: 1, foreArmL: 1,
        shoulderR: 40, elbowR: 14, upperArmR: 0.3, foreArmR: 0.28,
        hipL: -16, kneeL: 22, thighL: 0.34, shinL: 0.32, ankleL: -6,
        hipR: 8, kneeR: -6, thighR: 1, shinR: 1 },
    ],
  },

  'pull-liegend-yt': {
    id: 'pull-liegend-yt',
    name: 'Liegend Y heben',
    view: 'top',
    duration: 3600,
    mode: 'pingpong',
    keys: [
      { t: 0, shoulderR: 92, elbowR: 10, shoulderL: -92, elbowL: -10 },
      { t: 1, bodyY: -5, headY: -2.5,
        shoulderR: 104, elbowR: 4, wristR: -14,
        shoulderL: -104, elbowL: -4, wristL: 14 },
    ],
  },

  'hipflexor-ausfallschritt': {
    id: 'hipflexor-ausfallschritt',
    name: 'Ausfallschritt',
    view: 'front',
    duration: 4200,
    mode: 'pingpong',
    keys: [
      { t: 0, shoulderR: 4, shoulderL: -4 },
      // Vorderes Bein verkürzt, zeigt zur Kamera. Hinteres Bein lang,
      // Becken nach vorn, Arm der hinteren Seite nach oben.
      { t: 1, bodyY: 24, torso: -2,
        hipR: 20, kneeR: -44, ankleR: 24, thighR: 0.6, shinR: 0.78,
        hipL: -7, kneeL: 5, thighL: 1.04, shinL: 1.04,
        shoulderR: 14, elbowR: 6,
        shoulderL: -122, elbowL: -12 },
    ],
  },

  'glutes-stehende-hueftstreckung': {
    id: 'glutes-stehende-hueftstreckung',
    name: 'Hüftstreckung im Stand',
    view: 'front',
    duration: 3400,
    mode: 'pingpong',
    keys: [
      // Hände stützen vorn ab, Gewicht links.
      { t: 0,
        shoulderR: 30, elbowR: 16, upperArmR: 0.5, foreArmR: 0.48,
        shoulderL: -30, elbowL: -16, upperArmL: 0.5, foreArmL: 0.48 },
      // Rechtes Bein gestreckt nach hinten: verkürzt sich frontal.
      { t: 1, torso: -3, bodyY: -2,
        shoulderR: 30, elbowR: 16, upperArmR: 0.5, foreArmR: 0.48,
        shoulderL: -30, elbowL: -16, upperArmL: 0.5, foreArmL: 0.48,
        hipR: -10, kneeR: 8, thighR: 0.52, shinR: 0.56, ankleR: 2 },
    ],
  },

  'finish-nicken-stehend': {
    id: 'finish-nicken-stehend',
    name: 'Kinn-Nicken im Stand',
    view: 'front',
    duration: 4000,
    mode: 'pingpong',
    keys: [
      { t: 0, bodyY: 1.2, headY: 1.6 },
      { t: 1, bodyY: -2.2, headY: -2.4, shoulderR: 3, shoulderL: -3 },
    ],
  },
}

/** Animation zu einer Übung, sonst die Grundhaltung. */
export function animationFor(exerciseId) {
  return FRONT_ANIMATIONS[exerciseId] ?? FRONT_ANIMATIONS.idle
}

export const ANIMATION_LIST = Object.values(FRONT_ANIMATIONS)
