// Frontmatter der Übungsordner lesen.
//
// Bewusst klein gehalten: Werte sind JSON, wenn sie mit { [ " beginnen,
// sonst Zahl, Wahrheitswert oder blanker Text. Listen stehen eingerückt
// als "- <json>". Mehr Syntax gibt es nicht, damit die Dateien von Hand
// lesbar bleiben und der Parser ohne Abhängigkeit auskommt.

const FENCE = '---'

function parseValue(raw) {
  const text = raw.trim()
  if (text === '') return ''
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if (/^[{["]/.test(text)) {
    try {
      return JSON.parse(text)
    } catch {
      // Kaputtes JSON lieber als Text durchreichen als die Datei verlieren.
      return text
    }
  }
  return text
}

/**
 * @param {string} file Inhalt einer .md mit Frontmatter
 * @returns {{ data: Object, body: string }}
 */
export function parse(file) {
  const text = String(file).replace(/^﻿/, '')
  const lines = text.split('\n')
  if (lines[0]?.trim() !== FENCE) return { data: {}, body: text.trim() }

  const data = {}
  let i = 1
  let key = null
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === FENCE) { i++; break }
    const item = /^\s+-\s+(.*)$/.exec(line)
    if (item && key) {
      if (!Array.isArray(data[key])) data[key] = []
      data[key].push(parseValue(item[1]))
      continue
    }
    const pair = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (!pair) continue
    key = pair[1]
    const value = pair[2].trim()
    // Leerer Wert heisst: die Liste kommt in den nächsten Zeilen.
    data[key] = value === '' ? [] : parseValue(value)
  }
  return { data, body: lines.slice(i).join('\n').trim() }
}
