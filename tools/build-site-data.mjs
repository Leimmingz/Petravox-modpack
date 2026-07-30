/**
 * Génère les données du site depuis les sources du launcher.
 *
 *   node tools/build-site-data.mjs
 *
 * Écrit :
 *   docs/data/changelog.json  ← src/renderer/src/data/changelog.ts du launcher
 *
 * L'ancien site recopiait le changelog à la main dans le HTML : il se
 * désynchronisait à chaque version. Ici il n'existe qu'une seule source.
 *
 * `docs/data/mods.json` est généré à part, depuis le .mrpack — voir le README.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DOCS = join(HERE, '..', 'docs')

// Le launcher vit à côté du dépôt, pas dedans.
const CHANGELOG_TS = join(
  HERE,
  '..',
  '..',
  '..',
  'launcher-electron',
  'src',
  'renderer',
  'src',
  'data',
  'changelog.ts'
)

const source = readFileSync(CHANGELOG_TS, 'utf8')

const start = source.indexOf('export const CHANGELOG: Release[] = ')
if (start === -1) throw new Error('CHANGELOG introuvable dans changelog.ts')

const literal = source.slice(source.indexOf('[', start))
// Le littéral est du JS valide : on l'évalue plutôt que d'écrire un parseur.
const releases = new Function(`return ${literal}`)()

mkdirSync(join(DOCS, 'data'), { recursive: true })
writeFileSync(
  join(DOCS, 'data', 'changelog.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2),
  'utf8'
)

const entries = releases.reduce((n, r) => n + r.entries.length, 0)
console.log(`changelog.json : ${releases.length} versions, ${entries} entrées`)
console.log(`version la plus récente : ${releases[0]?.version}`)
