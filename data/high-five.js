// Texte rund ums High Five: A pusht, B macht mit und pusht zurück, beide
// haben trainiert. Dann ist der Kreis zu, und für den Tag ist Pause.
//
// Pro Lage eine Liste. Gezogen wird pro Tag fest (siehe `pick`), damit der
// Satz nicht bei jedem Zeichnen wechselt. {name} ist das Gegenüber, {n} eine
// Zahl. Einfach Zeilen ergänzen oder streichen, der Code liest die Längen.

export const FIVE = 'High Five'

/** Überschrift, wenn der Kreis gerade zugegangen ist. */
export const CLOSED_HEADLINE = [
  'High Five! Ihr habt es beide gemacht 🙌',
  'Zwei Rücken, ein High Five 🙌',
  'Geschafft, und zwar zu zweit 🙌',
  'Kreis zu. High Five! 🙌',
  'Yes! Ihr habt es beide durchgezogen 🙌',
]

/** Satz darunter: die Freude und die Pause bis morgen. */
export const CLOSED_LEAD = [
  '{name} hat nachgezogen. Für heute seid ihr durch, morgen ist ein neuer Tag.',
  'Das war Teamwork. Gönnt euren Rücken eine Pause, morgen geht es weiter.',
  'Heute habt ihr beide geliefert. Morgen startet das nächste High Five.',
  'Ihr zieht euch gegenseitig hoch. Genau so. Bis morgen!',
  'Dein Push hat gewirkt: {name} hat mitgemacht. Morgen bist du wieder dran.',
  'Zehn Minuten du, zehn Minuten {name}. Mehr braucht es nicht. Morgen wieder.',
]

/** Bei B, gleich nachdem der Push zurück ist. */
export const CLOSED_SENT = [
  'High Five mit {name}! Ihr habt es beide gemacht. Morgen ist ein neuer Tag.',
  'Push ist zurück bei {name}. Kreis zu, für heute seid ihr durch.',
  '{name} sieht gleich, dass du mitgemacht hast. Starkes Team. Bis morgen!',
]

/** Startseite, der Kreis ging heute zu. */
export const HOME_TODAY = [
  'Heute ein High Five mit {name}. Morgen geht es weiter.',
  'Ihr habt es heute beide gemacht. Lehn dich zurück, aufrecht natürlich.',
  'Für heute erledigt, zu zweit. Morgen startest du das nächste.',
  'Heute hat es geklatscht. Morgen ist ein neuer Tag für ein High Five.',
]

/** Startseite, gestern ging der Kreis zu, heute ist noch nichts passiert. */
export const HOME_DUE = [
  'Neuer Tag, neues High Five. {name} wartet auf deinen Push.',
  'Gestern High Five, heute wieder? Starte das nächste mit {name}.',
  'Dein Rücken und {name} sind bereit. Zeit für das nächste High Five.',
]

/** Startseite, der letzte Kreis ist zwei Tage oder länger her. */
export const HOME_LATE = [
  'Seit {n} Tagen kein High Five mit {name}. Zehn Minuten, und ihr seid wieder dabei.',
  '{name} hat seit {n} Tagen keinen Push von dir bekommen. Zeit, das zu ändern.',
  'Eure High Fives warten. {n} Tage Pause sind genug.',
]

/** Startseite, ich habe heute trainiert und vorgelegt, das Gegenüber ist dran. */
export const HOME_WAITING = [
  'Du hast vorgelegt. Jetzt ist {name} dran.',
  'Dein Push ist bei {name}. Der Rest liegt nicht mehr bei dir.',
]

/** Abschluss bei A, am Tag nach einem High Five: den nächsten Kreis anstossen. */
export const NEXT_ROUND = 'Starte das nächste High Five. {name} sieht, dass du vorgelegt hast, und ist dran.'

/** Zähler. */
export function fiveCount(n) {
  if (n <= 0) return ''
  return n === 1 ? 'Euer erstes High Five' : `${n} High Fives zusammen`
}

/** Ein Eintrag aus der Liste, fest pro Tag und Name. */
export function pick(list, { day = '', name = '', n = 0 } = {}) {
  let h = 0
  for (const c of day + name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return fill(list[h % list.length], { name, n })
}

export function fill(text, { name = '', n = 0 } = {}) {
  return text.replaceAll('{name}', name).replaceAll('{n}', String(n))
}
