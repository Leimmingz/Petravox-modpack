/**
 * Comportements du site Petravox.
 *
 * Aucune dépendance : le site doit rester consultable et rapide même sur une
 * connexion médiocre, et déployable sur GitHub Pages sans étape de build.
 */

const SERVER = { host: 'srv01.uniheberg.fr', port: 25540 }
const REPO = 'Leimmingz/Petravox-modpack'

/** Abrège un nombre d'octets. */
export function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`
}

// ── Statut du serveur ───────────────────────────────────────────────────────
async function loadServerStatus() {
  const dot = document.querySelector('[data-server-dot]')
  const label = document.querySelector('[data-server-label]')
  const players = document.querySelector('[data-server-players]')
  if (!dot || !label) return

  try {
    // Délai borné : sans ça, une API lente laisse « Vérification… » à l'écran
    // indéfiniment, ce qui donne l'impression que le serveur est mort.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER.host}:${SERVER.port}`, {
      signal: ctrl.signal
    })
    clearTimeout(timer)
    const data = await res.json()

    if (data.online) {
      dot.className = 'dot online'
      label.textContent = 'Serveur en ligne'
      if (players) {
        const n = data.players?.online ?? 0
        const max = data.players?.max ?? 0
        players.textContent = `${n}/${max} joueur${n > 1 ? 's' : ''}`
      }
    } else {
      dot.className = 'dot offline'
      label.textContent = 'Serveur hors ligne'
      if (players) players.textContent = 'Réessaie dans un moment'
    }
  } catch {
    dot.className = 'dot'
    label.textContent = 'Statut indisponible'
    if (players) players.textContent = ''
  }
}

// ── Dernière version publiée ────────────────────────────────────────────────
async function loadRelease() {
  const version = document.querySelector('[data-release-version]')
  const link = document.querySelector('[data-release-link]')
  if (!version && !link) return

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return
    const data = await res.json()

    const asset = (data.assets || []).find((a) => a.name.endsWith('.exe'))
    if (version) version.textContent = data.tag_name || data.name || ''
    if (link && asset) {
      link.href = asset.browser_download_url
      const size = document.querySelector('[data-release-size]')
      if (size) size.textContent = formatBytes(asset.size)
    }
  } catch {
    // La page reste utilisable : le lien pointe déjà vers /releases/latest.
  }
}

// ── Copie de l'adresse ──────────────────────────────────────────────────────
function setupCopy() {
  for (const btn of document.querySelectorAll('[data-copy]')) {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(btn.dataset.copy)
      const before = btn.textContent
      btn.textContent = 'Copié'
      setTimeout(() => {
        btn.textContent = before
      }, 1600)
    })
  }
}

// ── Liste des mods ──────────────────────────────────────────────────────────
async function setupMods() {
  const grid = document.querySelector('[data-mod-grid]')
  if (!grid) return

  const search = document.querySelector('[data-mod-search]')
  const count = document.querySelector('[data-mod-count]')

  let mods = []
  try {
    const res = await fetch('data/mods.json')
    const data = await res.json()
    mods = data.mods || []
    for (const el of document.querySelectorAll('[data-mod-total]')) {
      el.textContent = String(data.modCount ?? mods.length)
    }
  } catch {
    grid.innerHTML = '<p class="muted">Liste des mods indisponible pour le moment.</p>'
    return
  }

  const render = (list) => {
    if (list.length === 0) {
      grid.innerHTML = '<p class="muted">Aucun mod ne correspond à cette recherche.</p>'
    } else {
      // On construit le DOM plutôt que d'injecter du HTML : les noms viennent
      // d'un fichier généré, autant ne pas ouvrir la porte à une injection.
      grid.replaceChildren(
        ...list.map((mod) => {
          const el = document.createElement(mod.modrinth ? 'a' : 'div')
          el.className = 'mod'
          if (mod.modrinth) {
            el.href = mod.modrinth
            el.target = '_blank'
            el.rel = 'noopener'
          }
          const body = document.createElement('span')
          body.className = 'spacer'
          const name = document.createElement('span')
          name.className = 'mod-name'
          name.textContent = mod.name
          const file = document.createElement('span')
          file.className = 'mod-file'
          file.textContent = mod.file
          body.append(name, file)
          el.append(body)
          return el
        })
      )
    }
    if (count) count.textContent = `${list.length} affiché${list.length > 1 ? 's' : ''}`
  }

  render(mods)

  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase()
    render(q ? mods.filter((m) => `${m.name} ${m.file}`.toLowerCase().includes(q)) : mods)
  })
}

// ── Année du pied de page ───────────────────────────────────────────────────
function setupYear() {
  const el = document.querySelector('[data-year]')
  if (el) el.textContent = String(new Date().getFullYear())
}

loadServerStatus()
loadRelease()
setupCopy()
setupMods()
setupYear()
