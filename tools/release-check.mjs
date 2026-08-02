/**
 * Vérifie qu'une version publiée est réellement distribuable.
 *
 *   npm run release:check
 *
 * Les trois pièges de publication ne produisent **aucune erreur** : la release
 * a l'air correcte, le site aussi, et les joueurs ne reçoivent simplement
 * rien — ou téléchargent 90 Mo au lieu de quelques-uns. Ce script interroge ce
 * que voit un joueur (URLs publiques, aucun token) et le compare à
 * `package.json`.
 *
 * Ce qu'il attrape :
 *   · `latest.yml` oublié, ou resté sur la version précédente
 *   · release « modpack » marquée Latest — electron-updater ne lit qu'elle
 *   · `.exe` référencé par `latest.yml` absent de la release (404 au download)
 *   · site pas encore poussé, donc `version.json` périmé
 *   · `.blockmap` de la version précédente supprimé, ce qui force un
 *     téléchargement complet au lieu du différentiel
 */
import { readLauncherVersion } from './lib/changelog.mjs'

const REPO = 'Leimmingz/Petravox-modpack'
const VERSION_JSON = 'https://leimmingz.github.io/Petravox-modpack/launcher/version.json'

const expected = readLauncherVersion()

let failures = 0
let warnings = 0

const ok = (label, detail = '') => console.log(`  ✓ ${label}${detail ? `  ${detail}` : ''}`)
const warn = (label, detail = '') => {
  warnings++
  console.log(`  ~ ${label}${detail ? `  ${detail}` : ''}`)
}
const bad = (label, detail = '') => {
  failures++
  console.log(`  ✗ ${label}${detail ? `  ${detail}` : ''}`)
}

async function get(url, as = 'json') {
  // `cache: 'no-store'` : GitHub Pages sert avec un cache court, et on veut
  // savoir ce qui est en ligne maintenant, pas ce qui l'était il y a 10 min.
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'PetravoxReleaseCheck', Accept: '*/*' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return as === 'json' ? res.json() : res.text()
}

console.log(`\nVersion attendue (package.json) : v${expected}\n`)

// ── 1. Release GitHub marquée « Latest » ────────────────────────────────────
console.log('Release GitHub')

let release = null
try {
  release = await get(`https://api.github.com/repos/${REPO}/releases/latest`)
  const assets = release.assets ?? []
  const names = assets.map((a) => a.name)

  // electron-updater ne regarde QUE la release Latest. Si le modpack a été
  // republié après le launcher, c'est lui qui porte le label et la mise à jour
  // s'arrête net, sans message.
  if (names.some((n) => n === 'latest.yml')) {
    ok('la release Latest est bien celle du launcher', `« ${release.name ?? release.tag_name} »`)
  } else {
    bad(
      'la release Latest ne contient pas latest.yml',
      `« ${release.name ?? release.tag_name} » — c'est probablement celle du modpack`
    )
  }

  const exe = `Petravox.Launcher.v${expected}.exe`
  if (names.includes(exe)) ok('installeur présent', exe)
  else bad('installeur absent de la release', exe)

  if (names.includes(`${exe}.blockmap`)) ok('blockmap de la version présent')
  else warn('blockmap de la version absent', 'les futures mises à jour seront complètes')

  // Le différentiel compare la version installée chez le joueur à la nouvelle :
  // il lui faut le blockmap de l'ANCIENNE, souvent supprimé par réflexe de
  // ménage. Sans lui : 90 Mo au lieu de quelques-uns.
  const others = names.filter((n) => n.endsWith('.blockmap') && n !== `${exe}.blockmap`)
  if (others.length > 0) ok('blockmaps précédents conservés', others.join(', '))
  else
    warn(
      'aucun blockmap de version précédente',
      'les joueurs retéléchargeront 90 Mo au lieu du différentiel'
    )
} catch (err) {
  bad('release GitHub illisible', String(err.message ?? err))
}

// ── 2. latest.yml — le fichier que lit electron-updater ─────────────────────
console.log('\nlatest.yml (source de la mise à jour automatique)')

try {
  const asset = (release?.assets ?? []).find((a) => a.name === 'latest.yml')
  if (!asset) throw new Error('absent de la release')

  const yml = await get(asset.browser_download_url, 'text')
  const version = /^version:\s*(.+)$/m.exec(yml)?.[1]?.trim()
  const path = /^path:\s*(.+)$/m.exec(yml)?.[1]?.trim()

  if (version === expected) ok('version annoncée', `v${version}`)
  else
    bad(
      'version périmée',
      `latest.yml annonce v${version}, package.json est en v${expected} — ` +
        'les joueurs ne recevront pas la nouvelle version'
    )

  const names = (release?.assets ?? []).map((a) => a.name)
  if (path && names.includes(path)) ok('installeur référencé bien présent', path)
  else bad('installeur référencé introuvable', `${path} — la mise à jour finira en 404`)
} catch (err) {
  bad('latest.yml illisible', String(err.message ?? err))
}

// ── 3. Site ─────────────────────────────────────────────────────────────────
console.log('\nSite (filet de secours + numéro affiché)')

try {
  const data = await get(VERSION_JSON)
  if (data.version === expected) ok('version.json en ligne', `v${data.version}`)
  else
    warn(
      'version.json périmé',
      `en ligne : v${data.version} — lance github\\push_github.bat`
    )
} catch (err) {
  warn('version.json injoignable', String(err.message ?? err))
}

// ── Verdict ─────────────────────────────────────────────────────────────────
console.log('')
if (failures > 0) {
  console.log(`✖ ${failures} problème(s) bloquant(s) : la mise à jour ne fonctionnera pas.\n`)
  process.exit(1)
}
if (warnings > 0) {
  console.log(`✓ La mise à jour fonctionnera. ${warnings} point(s) d'attention ci-dessus.\n`)
} else {
  console.log('✓ Tout est en ordre.\n')
}
