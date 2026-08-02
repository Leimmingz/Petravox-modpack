/**
 * Prépare une nouvelle version du launcher.
 *
 *   npm run release -- 3.2.0
 *       demande les nouveautés à l'écran, puis écrit tout
 *
 *   npm run release -- 3.2.0 --new "Texte" --fix "Autre texte"
 *       même chose sans rien demander (options répétables :
 *       --new, --fix, --perf, --audit)
 *
 *   npm run release
 *       revérifie la version déjà en place, sans rien modifier
 *
 * Ce script existe parce que publier une version demande quatre gestes dans
 * trois dossiers différents, et qu'en oublier un ne produit aucune erreur —
 * juste des joueurs qui ne reçoivent rien. Il fait, dans l'ordre :
 *
 *   1. bump de `version` dans launcher-electron/package.json
 *      (sans lui, electron-updater considère qu'il n'y a rien de nouveau)
 *   2. écriture de l'entrée de changelog, en tête de changelog.ts
 *   3. régénération de docs/data/changelog.json et docs/launcher/version.json
 *   4. mise à jour du badge de version du README
 *   5. rappel de la marche à suivre côté GitHub
 *
 * Il ne compile ni ne publie rien : `npm run dist` et la création de la release
 * restent des gestes explicites.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  KINDS,
  PACKAGE_JSON,
  REPO_ROOT,
  prependRelease,
  readChangelog,
  readLauncherVersion,
  todayLabel
} from './lib/changelog.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

const SEMVER = /^\d+\.\d+\.\d+$/

/** Libellés affichés à la saisie, dans l'ordre où on les propose. */
const KIND_LABELS = {
  new: 'Nouveauté',
  fix: 'Correctif',
  perf: 'Performance',
  audit: 'Sécurité / audit'
}

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

/** Compare deux versions « x.y.z ». > 0 si `a` est plus récente que `b`. */
function compare(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return 0
}

/**
 * Lit les `--new "…"` / `--fix "…"` / `--perf "…"` / `--audit "…"` de la ligne
 * de commande, dans l'ordre où ils ont été écrits.
 */
function parseEntryFlags(argv) {
  const entries = []
  for (let i = 0; i < argv.length; i++) {
    const kind = argv[i]?.replace(/^--/, '')
    if (!argv[i]?.startsWith('--') || !KINDS.includes(kind)) continue
    const text = argv[i + 1]
    if (!text || text.startsWith('--')) fail(`L'option --${kind} attend un texte entre guillemets.`)
    entries.push({ kind, text: text.trim() })
    i++
  }
  return entries
}

/**
 * Saisie à l'écran, une ligne par nouveauté. Ligne vide = on passe à la
 * catégorie suivante.
 */
async function askEntries() {
  // Pas de terminal (script appelé par un autre script, sortie redirigée) :
  // il n'y a personne pour répondre, et attendre bloquerait indéfiniment.
  if (!process.stdin.isTTY) return []

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const entries = []
  console.log(
    '\nSaisis les nouveautés, une par ligne. Entrée seule passe à la catégorie suivante.\n'
  )
  try {
    for (const kind of KINDS) {
      for (;;) {
        const text = (await rl.question(`  ${KIND_LABELS[kind]} > `)).trim()
        if (!text) break
        entries.push({ kind, text })
      }
    }
  } finally {
    rl.close()
  }
  return entries
}

// ── 1. Version cible ────────────────────────────────────────────────────────

const current = readLauncherVersion()
const argv = process.argv.slice(2)
const target = argv[0] && !argv[0].startsWith('--') ? argv[0] : current
const flagEntries = parseEntryFlags(argv)

if (!SEMVER.test(target)) {
  fail(`« ${target} » n'est pas une version valide. Attendu : x.y.z (ex. 3.1.0)`)
}

if (target !== current) {
  if (compare(target, current) <= 0) {
    // electron-updater compare les numéros : une version qui recule ou stagne
    // ne déclenche aucune mise à jour, sans le moindre message d'erreur.
    fail(`La v${target} n'est pas postérieure à la v${current} installée dans package.json.`)
  }
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
  pkg.version = target
  // Newline finale : sans elle, npm réécrit le fichier entier au prochain
  // install et le diff devient illisible.
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  console.log(`package.json  : v${current} → v${target}`)
} else {
  console.log(`package.json  : v${current} (inchangé)`)
}

// ── 2. Entrée de changelog ──────────────────────────────────────────────────

let releases = readChangelog()

if (!releases.some((r) => r.version === target)) {
  // Les options de la ligne de commande priment ; sinon on demande. Sans
  // terminal (script appelé depuis un autre script), on ne peut rien demander :
  // mieux vaut échouer que publier une mise à jour muette.
  const entries = flagEntries.length > 0 ? flagEntries : await askEntries()

  if (entries.length === 0) {
    fail(
      `Aucune nouveauté saisie pour la v${target}.\n\n` +
        `  Relance avec les options :\n` +
        `    npm run release -- ${target} --new "Ce qui change" --fix "Ce qui est corrigé"\n\n` +
        `  Sans entrée de changelog, les joueurs reçoivent une mise à jour muette.`
    )
  }

  prependRelease({ version: target, date: todayLabel(), entries })
  console.log(`changelog.ts  : entrée v${target} ajoutée (${entries.length} ligne(s))`)

  // Relecture depuis le disque : c'est la preuve que ce qu'on vient d'écrire
  // est du TypeScript valide et se relit comme prévu, avant que le launcher
  // n'essaie de le compiler.
  releases = readChangelog()
  if (releases[0]?.version !== target) {
    fail('L’entrée écrite n’a pas pu être relue. Vérifie changelog.ts à la main.')
  }
}

const entry = releases.find((r) => r.version === target)

if (!entry) fail(`Aucune entrée de changelog pour la v${target}.`)

if (releases[0]?.version !== target) {
  fail(
    `L'entrée v${target} existe mais n'est pas en tête du changelog ` +
      `(la première est v${releases[0]?.version}). Les nouvelles versions se ` +
      `placent en haut : le site et le launcher affichent la première comme « actuelle ».`
  )
}

if (entry.entries.length === 0) {
  fail(`L'entrée de changelog v${target} est vide.`)
}

console.log(`changelog.ts  : v${target}, ${entry.entries.length} entrée(s)`)

// ── 3. Données du site ──────────────────────────────────────────────────────

execFileSync(process.execPath, [join(HERE, 'build-site-data.mjs')], { stdio: 'inherit' })

// ── 4. Badge du README ──────────────────────────────────────────────────────

const readmePath = join(REPO_ROOT, 'README.md')
const readme = readFileSync(readmePath, 'utf8')
// Le badge shields.io porte la version en dur dans son URL ; il affichait
// encore la v3.0.0 longtemps après.
const updated = readme.replace(/(Launcher-v)\d+\.\d+\.\d+(-)/g, `$1${target}$2`)
if (updated !== readme) {
  writeFileSync(readmePath, updated, 'utf8')
  console.log(`README.md     : badge mis à jour en v${target}`)
}

// ── 5. Marche à suivre ──────────────────────────────────────────────────────

console.log(`
────────────────────────────────────────────────────────────────
  Préparation terminée pour la v${target}. Il reste :

  1. cd launcher-electron && npm run dist
  2. Pousser le site :  github\\push_github.bat
  3. Créer la release GitHub avec le tag  v${target}
     et y attacher LES TROIS fichiers de launcher-electron/release/ :
       · Petravox.Launcher.v${target}.exe
       · latest.yml           ← sans lui, AUCUN joueur n'est mis à jour
       · Petravox.Launcher.v${target}.exe.blockmap

  Et surtout : la release « modpack » ne doit PAS être marquée
  « Latest ». electron-updater lit la release Latest et y cherche
  latest.yml ; republier le modpack après le launcher casse
  silencieusement la mise à jour automatique.
────────────────────────────────────────────────────────────────
`)
