// Was neu ist, für die Leute, die die App benutzen. Erscheint in der App
// unter "Neu" und auf der Erklärung im Abschnitt "Releases".
//
// Nur, was jemandem etwas bringt. Kein Umbau, keine Fehlerbehebung, die
// niemand bemerkt hat. Kurz, direkt, gern mit einem Augenzwinkern.
// Neuester Eintrag zuoberst. `id` ist der Tag der Veröffentlichung: ändert
// er sich, gilt der Eintrag als ungelesen. `emoji` steht auf der Karte nach
// dem Update und vor dem Titel; ohne Angabe ist es ein Geschenk 🎁.

export const RELEASES = [
  {
    id: '2026-11-14',
    emoji: '🙌',
    title: 'High Five',
    items: [
      ['🙌', 'Wer gepusht wird und mitmacht, schickt den Push zurück. Kreis zu, ihr klatscht ab, für heute ist Feierabend.'],
      ['👯', 'Euer Team steht auf der Startseite: mit wem, wie viele High Fives, und wann es wieder Zeit ist. Bummeln wird bemerkt.'],
      ['📅', '«Ihr zusammen: 5 von 6». Gruppendruck, aber die nette Sorte.'],
      ['⏸️', 'Jetzt nicht? Die Einladung wartet auf der Startseite, bis du bereit bist.'],
    ],
  },
]

export const LATEST = RELEASES[0]?.id ?? null

/** Das Emoji eines Releases, mit dem Geschenk als Vorgabe. */
export function releaseEmoji(release) {
  return release?.emoji?.trim() || '🎁'
}
