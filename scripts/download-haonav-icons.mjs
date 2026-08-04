/**
 * Download all site icons from haonav dump / live site.
 *
 * Usage:
 *   node scripts/download-haonav-icons.mjs
 *   node scripts/download-haonav-icons.mjs --update-db   # also write icon paths into portal_site.sites
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dumpPath = path.join(root, 'scripts', 'haonav-home-data.json')
const outRoot = path.join(root, 'public')
const BASE = 'https://www.haonav.cn'
const updateDb = process.argv.includes('--update-db')
const concurrency = 8

function loadEnv() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    const value = trimmed.slice(i + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnv()

function walkLinks(node, bag = []) {
  if (!node) return bag
  if (Array.isArray(node)) {
    for (const item of node) walkLinks(item, bag)
    return bag
  }
  if (typeof node !== 'object') return bag

  if (node.url && (node.title || node.name) && (node.icon || node.favicon || node.logo)) {
    bag.push(node)
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') walkLinks(value, bag)
  }
  return bag
}

function normalizeIconPath(raw) {
  if (!raw || typeof raw !== 'string') return null
  let p = raw.trim()
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) {
    try {
      const u = new URL(p)
      if (!u.hostname.includes('haonav.cn')) return null
      p = u.pathname
    } catch {
      return null
    }
  }
  if (!p.startsWith('/')) p = `/${p}`
  // only allow upload paths
  if (!p.startsWith('/uploads/')) return null
  return p.split('?')[0]
}

function siteId(name, remoteId) {
  const ascii = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (ascii && /^[a-z]/.test(ascii) && ascii.length >= 2) {
    return ascii.slice(0, 50)
  }
  return `site-${remoteId}`
}

async function downloadOne(iconPath) {
  const localPath = path.join(outRoot, iconPath.replace(/^\//, ''))
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
    return { iconPath, status: 'skip' }
  }

  fs.mkdirSync(path.dirname(localPath), { recursive: true })
  const url = `${BASE}${iconPath}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; portal-site-icon-downloader/1.0)',
      Accept: 'image/*,*/*'
    }
  })
  if (!res.ok) {
    return { iconPath, status: 'fail', error: `${res.status} ${res.statusText}` }
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.length) return { iconPath, status: 'fail', error: 'empty body' }
  fs.writeFileSync(localPath, buf)
  return { iconPath, status: 'ok', bytes: buf.length }
}

async function mapPool(items, limit, worker) {
  const results = []
  let i = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Missing dump: ${dumpPath}`)
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'))
  const links = walkLinks(dump)
  console.log(`Found ${links.length} link records with icon fields`)

  const iconSet = new Set()
  const linkIcons = [] // { id, title, url, iconPath }

  for (const link of links) {
    const iconPath = normalizeIconPath(link.icon || link.favicon || link.logo)
    if (!iconPath) continue
    iconSet.add(iconPath)
    linkIcons.push({
      id: link.id,
      title: link.title || link.name,
      url: link.url,
      iconPath
    })
  }

  const icons = [...iconSet].sort()
  console.log(`Unique icons: ${icons.length}`)
  console.log(`Saving under: ${path.join(outRoot, 'uploads')}`)

  let ok = 0
  let skip = 0
  let fail = 0
  const failures = []

  await mapPool(icons, concurrency, async (iconPath, idx) => {
    try {
      const result = await downloadOne(iconPath)
      if (result.status === 'ok') ok++
      else if (result.status === 'skip') skip++
      else {
        fail++
        failures.push(result)
      }
      if ((idx + 1) % 50 === 0 || idx + 1 === icons.length) {
        console.log(`Progress ${idx + 1}/${icons.length} (ok=${ok}, skip=${skip}, fail=${fail})`)
      }
      return result
    } catch (e) {
      fail++
      failures.push({ iconPath, status: 'fail', error: e.message })
      return { iconPath, status: 'fail', error: e.message }
    }
  })

  const manifest = {
    source: BASE,
    downloadedAt: new Date().toISOString(),
    totalUnique: icons.length,
    ok,
    skip,
    fail,
    icons,
    failures
  }
  const manifestPath = path.join(root, 'scripts', 'haonav-icons-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Done. ok=${ok}, skip=${skip}, fail=${fail}`)

  if (updateDb) {
    const conn = await mysql.createConnection({
      host: process.env.NUXT_DB_HOST || '127.0.0.1',
      port: Number(process.env.NUXT_DB_PORT || 3306),
      user: process.env.NUXT_DB_USER || 'root',
      password: process.env.NUXT_DB_PASSWORD || '',
      database: process.env.NUXT_DB_NAME || 'portal_site'
    })

    // Deduplicate by preferred site id / url
    const byKey = new Map()
    for (const item of linkIcons) {
      const id = siteId(item.title, item.id)
      byKey.set(id, item.iconPath)
      byKey.set(String(item.url || '').replace(/^https?:\/\//, ''), item.iconPath)
    }

    const [rows] = await conn.query('SELECT id, url, icon FROM sites')
    let updated = 0
    for (const row of rows) {
      const urlKey = String(row.url || '').replace(/^https?:\/\//, '')
      const iconPath = byKey.get(row.id) || byKey.get(urlKey)
      if (!iconPath || row.icon === iconPath) continue
      await conn.query('UPDATE sites SET icon = ? WHERE id = ?', [iconPath, row.id])
      updated++
    }
    await conn.end()
    console.log(`DB icons updated: ${updated}/${rows.length}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
