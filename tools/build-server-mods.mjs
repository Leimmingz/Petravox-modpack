/**
 * Construit le dossier `mods/` du serveur à partir du même .mrpack que celui
 * distribué aux joueurs.
 *
 *   npm run server-mods -- --dry-run     liste sans rien télécharger
 *   npm run server-mods                  construit serveur/mods-generes/
 *   npm run server-mods -- --prune       + signale les fichiers en trop
 *
 * Raison d'être : le 2 août 2026, le serveur a refusé de démarrer parce qu'il
 * avait Epic Fight 20.14.1 alors que le modpack en distribuait 20.14.17, et
 * qu'un mod de compatibilité exigeait ≥ 20.14.5. Rien ne surveillait cet écart :
 * il ne s'est vu qu'au refus de démarrage. Générer les deux côtés depuis une
 * source unique supprime la classe entière de ce problème.
 *
 * Le dossier produit est un dossier de travail local ; il n'écrase jamais le
 * serveur. C'est à toi de le téléverser (Pterodactyl, SFTP).
 *
 * ── Limite importante ──────────────────────────────────────────────────────
 * Le champ `env.server` de modrinth.index.json dit quels mods Modrinth sont
 * refusés côté serveur. Les mods **embarqués** dans `overrides/mods/` n'ont
 * aucune métadonnée équivalente : le format ne la prévoit pas. Un mod purement
 * client (interface, shaders) placé là ne peut donc pas être détecté
 * automatiquement, et ferait planter le serveur au démarrage.
 *
 * D'où `server-exclude.txt` : une liste de motifs à exclure à la main, à
 * compléter au fur et à mesure. Le script affiche toujours les mods embarqués
 * qu'il a retenus, précisément pour qu'on puisse les relire.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yauzl from 'yauzl'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROJECT = join(HERE, '..', '..', '..')
const OUT_DIR = join(PROJECT, 'serveur', 'mods-generes')
const EXCLUDE_FILE = join(HERE, 'server-exclude.txt')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const prune = args.includes('--prune')
const PACK =
  args.find((a) => !a.startsWith('--')) ??
  join(process.env.APPDATA ?? '', 'Petravox', 'cache', 'pack.mrpack')

if (!existsSync(PACK)) {
  console.error(
    `\n✖ Pack introuvable : ${PACK}\n\n` +
      `  Le pack en cache vient du launcher. Lance-le une fois pour le\n` +
      `  rafraîchir, ou passe le chemin du .mrpack en argument.\n`
  )
  process.exit(1)
}

/** Motifs de mods à ne jamais installer côté serveur, un par ligne. */
function readExcludes() {
  if (!existsSync(EXCLUDE_FILE)) return []
  return readFileSync(EXCLUDE_FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim().toLowerCase())
    .filter(Boolean)
}

const excludes = readExcludes()
const isExcluded = (file) => excludes.some((pattern) => file.toLowerCase().includes(pattern))

// ── Lecture du pack ─────────────────────────────────────────────────────────

/**
 * `overrides/` s'applique aux deux côtés, `server-overrides/` au serveur seul,
 * et `client-overrides/` est explicitement exclu ici.
 */
function readPack(path) {
  return new Promise((resolve, reject) => {
    const embedded = []
    let index = null
    let pending = 0
    let ended = false

    const done = () => {
      if (ended && pending === 0) resolve({ index, embedded })
    }

    yauzl.open(path, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err)

      zip.on('entry', (entry) => {
        const name = entry.fileName
        const embeddedMod = /^(overrides|server-overrides)\/mods\/(.+\.jar)$/i.exec(name)

        if (embeddedMod) {
          pending++
          zip.openReadStream(entry, (e, stream) => {
            if (e) return reject(e)
            const chunks = []
            stream.on('data', (c) => chunks.push(c))
            stream.on('end', () => {
              embedded.push({ file: embeddedMod[2], data: Buffer.concat(chunks) })
              pending--
              done()
              zip.readEntry()
            })
          })
          return
        }

        if (name !== 'modrinth.index.json') return zip.readEntry()

        pending++
        zip.openReadStream(entry, (e, stream) => {
          if (e) return reject(e)
          const chunks = []
          stream.on('data', (c) => chunks.push(c))
          stream.on('end', () => {
            index = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            pending--
            done()
            zip.readEntry()
          })
        })
      })

      zip.on('end', () => {
        ended = true
        done()
      })
      zip.on('error', reject)
      zip.readEntry()
    })
  })
}

const hash = (buf, algo) => createHash(algo).update(buf).digest('hex')

/** Le fichier déjà sur disque correspond-il aux empreintes du pack ? */
function alreadyGood(dest, hashes) {
  if (!existsSync(dest)) return false
  if (!hashes?.sha512 && !hashes?.sha1) return true
  const buf = readFileSync(dest)
  if (hashes.sha512) return hash(buf, 'sha512') === hashes.sha512.toLowerCase()
  return hash(buf, 'sha1') === hashes.sha1.toLowerCase()
}

// ── Construction ────────────────────────────────────────────────────────────

const { index, embedded } = await readPack(PACK)
if (!index) throw new Error('modrinth.index.json absent du pack')

console.log(`\nPack : ${index.name ?? '?'} ${index.versionId ?? ''}`)
console.log(`Forge : ${index.dependencies?.forge ?? '?'} · MC ${index.dependencies?.minecraft ?? '?'}\n`)

// 1. Mods Modrinth acceptés côté serveur.
const all = (index.files ?? []).filter((f) => f.path.replace(/\\/g, '/').startsWith('mods/'))
const clientOnly = all.filter((f) => f.env?.server === 'unsupported')
const wanted = all.filter((f) => f.env?.server !== 'unsupported' && !isExcluded(f.path))

console.log(`Mods Modrinth      : ${all.length}`)
console.log(`  retenus serveur  : ${wanted.length}`)
console.log(`  client seulement : ${clientOnly.length} (env.server = unsupported)`)

// 2. Mods embarqués. Aucune métadonnée d'environnement : on prend tout sauf ce
//    qui est listé dans server-exclude.txt, et on affiche la liste pour relecture.
const embeddedKept = embedded.filter((e) => !isExcluded(e.file))
const embeddedSkipped = embedded.filter((e) => isExcluded(e.file))

console.log(`Mods embarqués     : ${embedded.length}`)
console.log(`  retenus serveur  : ${embeddedKept.length}`)
console.log(`  exclus à la main : ${embeddedSkipped.length}`)
console.log(`\nTOTAL serveur      : ${wanted.length + embeddedKept.length} mods`)

if (dryRun) {
  console.log('\n── Mods embarqués retenus (à relire : aucun n’est vérifiable automatiquement) ──')
  for (const e of embeddedKept) console.log(`  · ${e.file}`)
  if (embeddedSkipped.length > 0) {
    console.log('\n── Exclus par server-exclude.txt ──')
    for (const e of embeddedSkipped) console.log(`  · ${e.file}`)
  }
  console.log('\n(--dry-run : rien n’a été écrit)\n')
  process.exit(0)
}

mkdirSync(OUT_DIR, { recursive: true })

let written = 0
let skipped = 0
const failures = []

// Mods embarqués : déjà en mémoire, rien à télécharger.
for (const mod of embeddedKept) {
  const dest = join(OUT_DIR, mod.file)
  if (existsSync(dest) && readFileSync(dest).equals(mod.data)) {
    skipped++
    continue
  }
  writeFileSync(dest, mod.data)
  written++
}

// Mods Modrinth : téléchargement, en sautant ce qui est déjà conforme.
for (const [i, file] of wanted.entries()) {
  const name = file.path.replace(/\\/g, '/').slice('mods/'.length)
  const dest = join(OUT_DIR, name)

  if (alreadyGood(dest, file.hashes)) {
    skipped++
    continue
  }

  const url = (file.downloads ?? [])[0]
  if (!url) {
    failures.push(`${name} (aucune URL)`)
    continue
  }

  process.stdout.write(`\r  téléchargement ${i + 1}/${wanted.length} — ${name.slice(0, 50)}          `)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())

    // Même exigence que le launcher : un mod dont l'empreinte ne correspond pas
    // est un mod qu'on n'installe pas.
    if (file.hashes?.sha512 && hash(buf, 'sha512') !== file.hashes.sha512.toLowerCase()) {
      throw new Error('empreinte sha512 incorrecte')
    }
    writeFileSync(dest, buf)
    written++
  } catch (err) {
    failures.push(`${name} (${err.message ?? err})`)
  }
}
process.stdout.write('\r'.padEnd(80) + '\r')

// 3. Fichiers présents en trop — typiquement une ancienne version d'un mod,
//    exactement ce qui a mis le serveur par terre le 2 août.
const expected = new Set([
  ...wanted.map((f) => f.path.replace(/\\/g, '/').slice('mods/'.length).toLowerCase()),
  ...embeddedKept.map((e) => e.file.toLowerCase())
])
const extra = readdirSync(OUT_DIR).filter(
  (n) => /\.jar$/i.test(n) && !expected.has(n.toLowerCase())
)

console.log(`\nÉcrits   : ${written}`)
console.log(`Inchangés: ${skipped}`)
if (extra.length > 0) {
  console.log(`\n⚠ ${extra.length} fichier(s) hors modpack dans le dossier généré :`)
  for (const n of extra) console.log(`  · ${n}`)
  if (prune) console.log('  (--prune ne supprime rien pour l’instant : à retirer à la main)')
}

if (failures.length > 0) {
  console.log(`\n✖ ${failures.length} mod(s) non récupérés :`)
  for (const f of failures.slice(0, 15)) console.log(`  · ${f}`)
  process.exit(1)
}

console.log(`\n✓ Dossier prêt : ${OUT_DIR}`)
console.log(`
  Sur Pterodactyl : arrête le serveur, remplace le contenu de mods/ par
  celui-ci, puis redémarre. Les mods embarqués n'ont aucune métadonnée
  client/serveur — si le serveur refuse de démarrer sur un mod d'interface,
  ajoute son nom dans tools/server-exclude.txt et relance.
`)
