/**
 * Génère docs/data/mods.json à partir du .mrpack.
 *
 *   node tools/build-mods-data.mjs [chemin/vers/Petravox.mrpack]
 *
 * Sans argument, utilise le pack mis en cache par le launcher
 * (%APPDATA%\Petravox\cache\pack.mrpack).
 *
 * Un .mrpack contient les mods de DEUX façons, et il faut lire les deux :
 *
 *  1. `modrinth.index.json` — les mods disponibles sur Modrinth, référencés par
 *     URL. Le launcher les télécharge à l'installation.
 *  2. `overrides/mods/*.jar` — les mods embarqués directement dans l'archive,
 *     parce qu'ils ne sont pas sur Modrinth (exclusivités CurseForge, versions
 *     modifiées, mods perso).
 *
 * Ne lire que le premier fait disparaître un tiers du modpack de la liste.
 */
import yauzl from 'yauzl'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(HERE, '..', 'docs', 'data')

const PACK =
  process.argv[2] ??
  join(process.env.APPDATA ?? '', 'Petravox', 'cache', 'pack.mrpack')

/** Ouvre le zip et renvoie l'index + la liste des entrées. */
function readPack(path) {
  return new Promise((resolve, reject) => {
    const overrides = []
    let index = null
    let pending = 0
    let ended = false

    const done = () => {
      if (ended && pending === 0) resolve({ index, overrides })
    }

    yauzl.open(path, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err)

      zip.on('entry', (entry) => {
        const name = entry.fileName

        if (/^(overrides|client-overrides)\/mods\/.+\.jar$/i.test(name)) {
          overrides.push({ file: name.split('/').pop(), sizeBytes: entry.uncompressedSize })
          return zip.readEntry()
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

/** « sodium-extra-0.5.4.jar » → « Sodium Extra ». */
function pretty(fileName) {
  const base = fileName
    .replace(/\.jar$/i, '')
    .replace(/[-_+](v?\d[\w.]*|mc\d[\w.]*|forge|fabric|neoforge)([-_+].*)?$/i, '')
  const words = base.split(/[-_.]+/).filter(Boolean)
  return words.length ? words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : fileName
}

const { index, overrides } = await readPack(PACK)
if (!index) throw new Error('modrinth.index.json absent du pack')

// 1. Mods référencés sur Modrinth.
const fromModrinth = (index.files ?? [])
  .filter((f) => f.path.startsWith('mods/'))
  .map((f) => {
    const file = f.path.slice('mods/'.length)
    const url = (f.downloads ?? []).find((u) => u.includes('cdn.modrinth.com'))
    const slug = url?.match(/\/data\/([^/]+)\//)?.[1]
    return {
      name: pretty(file),
      file,
      sizeBytes: f.fileSize ?? 0,
      source: 'modrinth',
      ...(slug ? { url: `https://modrinth.com/project/${slug}` } : {})
    }
  })

// 2. Mods embarqués dans l'archive.
const seen = new Set(fromModrinth.map((m) => m.file.toLowerCase()))
const embedded = overrides
  .filter((o) => !seen.has(o.file.toLowerCase()))
  .map((o) => ({ name: pretty(o.file), file: o.file, sizeBytes: o.sizeBytes, source: 'pack' }))

const mods = [...fromModrinth, ...embedded].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(
  join(OUT_DIR, 'mods.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packName: index.name ?? null,
      packVersion: index.versionId ?? null,
      minecraft: index.dependencies?.minecraft ?? null,
      forge: index.dependencies?.forge ?? null,
      modCount: mods.length,
      fromModrinth: fromModrinth.length,
      embedded: embedded.length,
      mods
    },
    null,
    2
  ),
  'utf8'
)

console.log(`pack     : ${index.name} ${index.versionId ?? ''}`)
console.log(`Modrinth : ${fromModrinth.length}`)
console.log(`embarqués: ${embedded.length}`)
console.log(`TOTAL    : ${mods.length} mods → docs/data/mods.json`)
