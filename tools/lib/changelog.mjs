/**
 * Lecture du changelog du launcher.
 *
 * `changelog.ts` est la source unique : le site et le launcher affichent le
 * même texte, et personne ne recopie rien à la main. L'ancien site avait le
 * changelog en dur dans son HTML, et il se désynchronisait à chaque version.
 *
 * Partagé par build-site-data.mjs et release.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Le dépôt du site et le launcher sont deux dossiers voisins, pas imbriqués. */
export const REPO_ROOT = join(HERE, '..', '..')
export const LAUNCHER_ROOT = join(REPO_ROOT, '..', '..', 'launcher-electron')
export const DOCS = join(REPO_ROOT, 'docs')

export const CHANGELOG_TS = join(
  LAUNCHER_ROOT,
  'src',
  'renderer',
  'src',
  'data',
  'changelog.ts'
)

export const PACKAGE_JSON = join(LAUNCHER_ROOT, 'package.json')

/** Version déclarée dans package.json — celle qu'electron-builder publiera. */
export function readLauncherVersion() {
  return JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')).version
}

/**
 * Extrait le tableau CHANGELOG.
 *
 * Le littéral est du JS valide : on l'évalue plutôt que d'écrire un parseur
 * TypeScript pour lire un tableau d'objets.
 */
export function readChangelog() {
  const source = readFileSync(CHANGELOG_TS, 'utf8')
  const start = source.indexOf('export const CHANGELOG: Release[] = ')
  if (start === -1) throw new Error('CHANGELOG introuvable dans changelog.ts')
  const literal = source.slice(source.indexOf('[', start))
  return new Function(`return ${literal}`)()
}

/** Les quatre catégories acceptées par le type `ChangeKind` du launcher. */
export const KINDS = ['new', 'fix', 'perf', 'audit']

/** Date du jour telle que l'écrivent les entrées existantes : « 2 août 2026 ». */
export function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Insère une version en tête du tableau CHANGELOG, dans le fichier source.
 *
 * On édite le TypeScript plutôt que de passer par un JSON intermédiaire parce
 * que `changelog.ts` est la source unique : c'est lui que le launcher compile
 * et lui dont le site est dérivé. Un second format à tenir synchronisé
 * ramènerait exactement le problème que cette source unique a résolu.
 *
 * L'écriture est volontairement textuelle (et non « parser puis re-sérialiser »)
 * pour ne pas reformater les 34 versions déjà en place à chaque publication.
 *
 * `JSON.stringify` produit les littéraux de chaîne : il gère les guillemets et
 * les apostrophes typographiques, fréquentes dans les textes français.
 */
export function prependRelease({ version, date, entries }) {
  const source = readFileSync(CHANGELOG_TS, 'utf8')
  const anchor = 'export const CHANGELOG: Release[] = ['
  const at = source.indexOf(anchor)
  if (at === -1) throw new Error('CHANGELOG introuvable dans changelog.ts')

  const body = entries
    .map(
      (e) =>
        `      {\n        kind: ${JSON.stringify(e.kind)},\n` +
        `        text: ${JSON.stringify(e.text)}\n      }`
    )
    .join(',\n')

  const block =
    `\n  {\n    version: ${JSON.stringify(version)},\n` +
    `    date: ${JSON.stringify(date)},\n` +
    `    entries: [\n${body}\n    ]\n  },`

  const cut = at + anchor.length
  writeFileSync(CHANGELOG_TS, source.slice(0, cut) + block + source.slice(cut), 'utf8')
}
