/**
 * Annonce d'une nouvelle version sur Discord.
 *
 * ── Où mettre l'URL, et pourquoi pas ailleurs ───────────────────────────────
 * Un webhook Discord est une **clé d'écriture** : quiconque l'obtient peut
 * publier ce qu'il veut dans le salon, sans limite. Il ne doit donc jamais se
 * retrouver :
 *   · dans `launcher_config.json` — ce fichier est servi publiquement par
 *     GitHub Pages, tout le monde peut le lire ;
 *   · dans le launcher — il serait distribué à chaque joueur ;
 *   · dans le dépôt — l'historique Git est public et un secret poussé une fois
 *     y reste même après suppression.
 *
 * Il est donc lu depuis la machine qui publie, et nulle part ailleurs :
 *   · la variable d'environnement `PETRAVOX_DISCORD_WEBHOOK`, ou
 *   · le fichier `tools/discord-webhook.txt`, ignoré par Git.
 *
 * Absent : on n'annonce rien, sans erreur. La publication n'en dépend pas.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const WEBHOOK_FILE = join(HERE, '..', 'discord-webhook.txt')

function readWebhookUrl() {
  const fromEnv = process.env.PETRAVOX_DISCORD_WEBHOOK?.trim()
  if (fromEnv) return fromEnv
  if (!existsSync(WEBHOOK_FILE)) return null
  const fromFile = readFileSync(WEBHOOK_FILE, 'utf8').trim()
  return fromFile || null
}

/** Couleur du liseré de l'embed : le vert Petravox. */
const ACCENT = 0x16b981

const KIND_LABEL = {
  new: '✨',
  fix: '🔧',
  perf: '⚡',
  audit: '🔒'
}

/**
 * Publie l'annonce. Ne lève jamais : rater une annonce ne doit pas faire
 * échouer une publication déjà faite côté GitHub.
 */
export async function announceRelease({ version, date, entries, downloadUrl }) {
  const url = readWebhookUrl()
  if (!url) {
    console.log('discord      : aucun webhook configuré, annonce ignorée')
    return
  }

  // Discord tronque une description au-delà de 4096 caractères et rejette le
  // message entier : on borne le nombre de lignes plutôt que de risquer un 400.
  const lines = entries
    .slice(0, 15)
    .map((e) => `${KIND_LABEL[e.kind] ?? '•'} ${e.text}`)
    .join('\n')
  const more = entries.length > 15 ? `\n… et ${entries.length - 15} autre(s)` : ''

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Petravox',
        embeds: [
          {
            title: `Launcher v${version}`,
            description: `${lines}${more}`,
            color: ACCENT,
            url: downloadUrl,
            footer: { text: `Publié le ${date} · mise à jour automatique au prochain démarrage` }
          }
        ]
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`discord      : annonce publiée pour la v${version}`)
  } catch (err) {
    console.warn(`discord      : annonce impossible (${err.message ?? err})`)
  }
}
