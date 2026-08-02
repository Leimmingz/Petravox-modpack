/**
 * Génère les données du site depuis les sources du launcher.
 *
 *   node tools/build-site-data.mjs
 *
 * Écrit :
 *   docs/data/changelog.json  ← src/renderer/src/data/changelog.ts du launcher
 *   docs/launcher/version.json ← version de package.json + dernières entrées
 *
 * L'ancien site recopiait le changelog à la main dans le HTML : il se
 * désynchronisait à chaque version. Ici il n'existe qu'une seule source.
 *
 * `docs/data/mods.json` est généré à part, depuis le .mrpack — voir le README.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DOCS, readChangelog, readLauncherVersion } from './lib/changelog.mjs'

const GITHUB_REPO = 'https://github.com/Leimmingz/Petravox-modpack'

const releases = readChangelog()
const version = readLauncherVersion()

mkdirSync(join(DOCS, 'data'), { recursive: true })
writeFileSync(
  join(DOCS, 'data', 'changelog.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2),
  'utf8'
)

/**
 * `launcher/version.json` : filet de sécurité de la mise à jour.
 *
 * electron-updater reste le mécanisme principal, mais il dépend entièrement de
 * la release GitHub marquée « Latest » et de son `latest.yml`. Deux pannes déjà
 * rencontrées le mettent hors service en silence : `latest.yml` oublié dans la
 * release, et release `modpack` republiée par-dessus en « Latest ». Ce fichier
 * permet au launcher de dire « une v3.1.0 existe » même dans ces cas-là, et au
 * site d'afficher la version sans dépendre de l'API GitHub.
 */
const latest = releases[0]
mkdirSync(join(DOCS, 'launcher'), { recursive: true })
writeFileSync(
  join(DOCS, 'launcher', 'version.json'),
  JSON.stringify(
    {
      version,
      date: latest?.date ?? null,
      // Page de la dernière release plutôt qu'un lien direct vers le .exe : le
      // nom du fichier dépend du tag, et un lien mort serait pire que rien.
      download: `${GITHUB_REPO}/releases/latest`,
      notes: (latest?.entries ?? []).map((e) => e.text),
      generatedAt: new Date().toISOString()
    },
    null,
    2
  ),
  'utf8'
)

const entries = releases.reduce((n, r) => n + r.entries.length, 0)
console.log(`changelog.json  : ${releases.length} versions, ${entries} entrées`)
console.log(`version.json    : v${version} (changelog en tête : v${latest?.version})`)

if (latest && latest.version !== version) {
  console.warn(
    `\n⚠  package.json est en v${version} mais le changelog commence à v${latest.version}.\n` +
      `   Les joueurs recevront la v${version} sans savoir ce qu'elle change.\n` +
      `   Utilise « npm run release » pour tenir les deux à jour.`
  )
}
