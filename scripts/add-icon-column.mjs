import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
if (fs.existsSync(envPath)) {
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

const conn = await mysql.createConnection({
  host: process.env.NUXT_DB_HOST || '127.0.0.1',
  port: Number(process.env.NUXT_DB_PORT || 3306),
  user: process.env.NUXT_DB_USER || 'root',
  password: process.env.NUXT_DB_PASSWORD || '',
  database: process.env.NUXT_DB_NAME || 'portal_site'
})

for (const table of ['sites', 'reviews']) {
  const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'icon'`)
  if (!cols.length) {
    await conn.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`icon\` VARCHAR(500) NOT NULL DEFAULT '' AFTER \`letter\``
    )
    console.log(`added icon to ${table}`)
  } else {
    console.log(`icon already exists on ${table}`)
  }
}

await conn.end()
