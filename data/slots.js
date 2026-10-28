// Die 6 Funktions-Slots einer Einheit, in Reihenfolge.
// `offset` versetzt die Variantenrotation pro Slot, damit sich nicht alle
// Slots gleichzeitig umstellen.
export const SLOTS = [
  { id: 'mobility-bws',   label: 'Brustwirbelsäule', hint: 'Mobilisieren',             offset: 0 },
  { id: 'pull-upper',     label: 'Oberer Rücken',    hint: 'Ziehen',                   offset: 1 },
  { id: 'scapula',        label: 'Schulterblatt',    hint: 'Führen und stabilisieren', offset: 2 },
  { id: 'hipflexor',      label: 'Hüftbeuger',       hint: 'Dehnen',                   offset: 3 },
  { id: 'glutes-core',    label: 'Glutes und Core',  hint: 'Becken aufrichten',        offset: 4 },
  { id: 'haltung-finish', label: 'Aufrichtung',      hint: 'Nacken und Abschluss',     offset: 5 },
]

export const SLOT_COUNT = SLOTS.length

/** Mindestzahl erledigter Übungen, damit eine Einheit zählt. */
export const MIN_DONE = 4

/** Einheiten pro Woche fürs Wochenziel. */
export const WEEK_GOAL = 3
