/**
 * Import sites from https://www.haonav.cn into portal_site.
 *
 * Usage:
 *   node scripts/import-haonav.mjs                  # import all
 *   node scripts/import-haonav.mjs --cat=225        # only category 225
 *   node scripts/import-haonav.mjs --replace        # truncate sites/categories first
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dumpPath = path.join(root, 'scripts', 'haonav-home-data.json')

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

const args = process.argv.slice(2)
const catArg = args.find(a => a.startsWith('--cat='))
const targetCat = catArg ? Number(catArg.split('=')[1]) : null
const replace = args.includes('--replace')

const COLORS = [
  '#1a1714', '#24292f', '#4f46e5', '#0ea5e9', '#e11d48',
  '#0d9488', '#7c3aed', '#2563eb', '#f97316', '#0891b2',
  '#0078d4', '#019833', '#fe315d', '#21d789', '#07c3f2'
]

const CAT_ID_MAP = {
  236: 'ai',
  183: 'devtools',
  194: 'ide',
  195: 'vcs',
  196: 'build',
  197: 'deps',
  184: 'frontend',
  198: 'fe-framework',
  199: 'fe-components',
  200: 'fe-style',
  237: 'desktop',
  201: 'fe-tools',
  185: 'backend',
  203: 'languages',
  204: 'be-framework',
  205: 'api-debug',
  206: 'service-check',
  186: 'database',
  207: 'rdbms',
  208: 'nosql',
  209: 'db-tools',
  187: 'mobile',
  210: 'ios',
  211: 'android',
  212: 'cross-platform',
  188: 'devops',
  216: 'cloud',
  235: 'admin-panel',
  214: 'cicd',
  213: 'containers',
  215: 'monitoring',
  189: 'design',
  217: 'ui-design',
  218: 'prototype',
  219: 'icons',
  220: 'colors',
  190: 'learn',
  221: 'courses',
  222: 'docs',
  223: 'interview',
  191: 'community',
  225: 'qa',
  226: 'news',
  227: 'opensource',
  228: 'jobs',
  192: 'other',
  229: 'online-tools',
  231: 'collab',
  232: 'cms',
  233: 'freelance'
}

function categoryId(remoteId, name) {
  if (CAT_ID_MAP[remoteId]) return CAT_ID_MAP[remoteId]
  const ascii = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (ascii && /^[a-z]/.test(ascii)) return ascii.slice(0, 60)
  return `c${remoteId}`
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

function pickLetter(name) {
  const m = String(name || '').trim().match(/[A-Za-z0-9\u4e00-\u9fa5]/)
  return (m?.[0] || '?').toUpperCase()
}

function normalizeUrl(url) {
  const u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

function flattenCategories(categories, parent = null, acc = []) {
  for (const [index, cat] of (categories || []).entries()) {
    const node = {
      remoteId: cat.id,
      id: categoryId(cat.id, cat.name),
      name: cat.name,
      sort: Number(cat.sortOrder ?? index),
      parentRemoteId: parent?.remoteId ?? 0,
      parentId: parent?.id ?? null,
      links: Array.isArray(cat.links) ? cat.links : []
    }
    acc.push(node)
    if (cat.children?.length) flattenCategories(cat.children, node, acc)
  }
  return acc
}

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Missing ${dumpPath}. Open haonav.cn in browser and export app-home-data first.`)
  }

  const home = JSON.parse(fs.readFileSync(dumpPath, 'utf8'))
  const flatCats = flattenCategories(home.categories)
  console.log(`Loaded ${flatCats.length} categories (with children), totalCount=${home.totalCount}`)

  let selectedCats = flatCats
  if (targetCat) {
    selectedCats = flatCats.filter(c => c.remoteId === targetCat)
    if (!selectedCats.length) {
      throw new Error(`Category ${targetCat} not found in dump`)
    }
    console.log(`Filter --cat=${targetCat} => ${selectedCats[0].name}`)
  }

  const linkRows = []
  for (const cat of selectedCats) {
    for (const link of cat.links) {
      linkRows.push({ cat, link, hot: Boolean(link.isRecommend) })
    }
  }

  // Mark hot links
  const hotIds = new Set((home.hotLinks || []).map(l => l.id))
  for (const row of linkRows) {
    if (hotIds.has(row.link.id)) row.hot = true
  }

  // If importing all, also attach orphan hot links
  if (!targetCat) {
    for (const link of (home.hotLinks || [])) {
      const exists = linkRows.some(r => r.link.id === link.id)
      if (!exists) {
        const fallbackCat = flatCats.find(c => c.remoteId === link.categoryId) || {
          id: 'ai',
          name: 'AI相关',
          remoteId: 236,
          sort: 0
        }
        linkRows.push({ cat: fallbackCat, link, hot: true })
      }
    }
  }

  console.log(`Prepared ${linkRows.length} sites`)

  const conn = await mysql.createConnection({
    host: process.env.NUXT_DB_HOST || '127.0.0.1',
    port: Number(process.env.NUXT_DB_PORT || 3306),
    user: process.env.NUXT_DB_USER || 'root',
    password: process.env.NUXT_DB_PASSWORD || '',
    database: process.env.NUXT_DB_NAME || 'portal_site',
    charset: 'utf8mb4'
  })
  await conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

  if (replace) {
    console.log('Replace mode: clearing sites + categories')
    await conn.query('SET FOREIGN_KEY_CHECKS = 0')
    await conn.query('TRUNCATE TABLE sites')
    await conn.query('TRUNCATE TABLE categories')
    await conn.query('SET FOREIGN_KEY_CHECKS = 1')
  }

  // Upsert leaf + parent categories that appear in selection
  const catsToUpsert = new Map()
  for (const row of linkRows) {
    catsToUpsert.set(row.cat.id, row.cat)
    if (row.cat.parentId) {
      const parent = flatCats.find(c => c.id === row.cat.parentId)
      if (parent) catsToUpsert.set(parent.id, parent)
    }
  }
  // When importing a leaf-only filter, ensure its parent category exists too
  for (const cat of selectedCats) {
    catsToUpsert.set(cat.id, cat)
    if (cat.parentId) {
      const parent = flatCats.find(c => c.id === cat.parentId)
      if (parent) catsToUpsert.set(parent.id, parent)
    }
  }

  // Prefer leaf categories for sites; still store parents for navigation
  for (const cat of [...catsToUpsert.values()].sort((a, b) => a.sort - b.sort)) {
    await conn.query(
      `INSERT INTO categories (id, name, sort_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
      [cat.id, cat.name, cat.sort]
    )
  }
  console.log(`Upserted ${catsToUpsert.size} categories`)

  let inserted = 0
  let updated = 0
  const usedIds = new Set()

  for (const row of linkRows) {
    const link = row.link
    const name = String(link.title || '').trim()
    const url = normalizeUrl(link.url)
    if (!name || !url) continue

    let id = siteId(name, link.id)
    if (usedIds.has(id)) id = `${id}-${link.id}`
    usedIds.add(id)

    const description = String(link.description || link.detail || '').trim().slice(0, 500)
    const isHot = row.hot ? 1 : 0
    const color = COLORS[Math.abs(Number(link.id || 0)) % COLORS.length]
    const letter = pickLetter(name)
    const categoryIdValue = row.cat.id

    const [exist] = await conn.query(
      `SELECT id FROM sites WHERE url = ? OR id = ? LIMIT 1`,
      [url, id]
    )

    if (exist.length) {
      await conn.query(
        `UPDATE sites
         SET name = ?, description = ?, url = ?, category_id = ?,
             status = 'online',
             is_hot = GREATEST(is_hot, ?), letter = ?, color = ?
         WHERE id = ?`,
        [name, description, url, categoryIdValue, isHot, letter, color, exist[0].id]
      )
      updated++
    } else {
      await conn.query(
        `INSERT INTO sites (id, name, description, url, category_id, status, is_hot, color, letter)
         VALUES (?, ?, ?, ?, ?, 'online', ?, ?, ?)`,
        [id, name, description, url, categoryIdValue, isHot, color, letter]
      )
      inserted++
    }
  }

  const [siteCount] = await conn.query('SELECT COUNT(*) AS c FROM sites')
  const [catCount] = await conn.query('SELECT COUNT(*) AS c FROM categories')
  await conn.end()

  console.log(`Done. inserted=${inserted}, updated=${updated}`)
  console.log(`DB now: sites=${siteCount[0].c}, categories=${catCount[0].c}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
